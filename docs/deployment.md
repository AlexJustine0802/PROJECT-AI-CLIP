# Deployment

ClipForge is portable by design (vendor-neutral abstractions). Any of the following work.

## Local development — Node.js only, no Docker (default)

The default configuration runs entirely on Node.js 20+ with **no Docker, PostgreSQL, Redis,
MinIO, or Python**. It uses SQLite, an in-process queue, an in-memory cache, local file
storage, and an in-process Node AI pipeline.

```powershell
pnpm install
pnpm setup     # creates .env + SQLite DB + seed data (cross-platform)
pnpm dev       # API (:4000) + Web (:3000)
```

Drivers are chosen in `.env` and can be upgraded independently without code changes:

| Concern | Default (Node-only) | Opt-in |
| --- | --- | --- |
| Database | SQLite (`file:./dev.db`) | PostgreSQL (schema `provider`) |
| Queue | `QUEUE_DRIVER=memory` (in-process) | `bullmq` (Redis) |
| Cache | `CACHE_DRIVER=memory` | `redis` |
| AI pipeline | `AI_DRIVER=node` (in-process) | `http` (Python FastAPI + ffmpeg/Whisper) |
| Storage | `STORAGE_PROVIDER=local` | `minio` / `s3` / `r2` / `supabase` |

## Optional containerized stack (Docker)

Docker is **not required** for development. The Compose stack is a prod-like reference that
wires PostgreSQL + Redis + MinIO + the Python AI service:

```bash
docker compose -f infra/docker-compose.yml up --build
# + observability:
docker compose -f infra/docker-compose.yml -f infra/docker-compose.observability.yml up
```

Because it targets PostgreSQL, set the Prisma datasource `provider = "postgresql"` in
`packages/db/prisma/schema.prisma` first (the app schema is portable — no other edits needed),
and set `QUEUE_DRIVER=bullmq`, `CACHE_DRIVER=redis`, `AI_DRIVER=http`, `STORAGE_PROVIDER=minio`
for that environment. Run `pnpm db:migrate:deploy && pnpm db:seed` against the running DB.

## Split managed deployment

| Component | Suggested host | Notes |
| --- | --- | --- |
| `apps/web` | Vercel | Next.js 14; set `NEXT_PUBLIC_API_URL`, `AUTH_SECRET`, OAuth keys |
| `apps/api` | Railway / Fly / Render | Docker (`infra/docker/api.Dockerfile`); needs Postgres + Redis |
| `services/ai` | Railway / GPU host | Docker (`services/ai/Dockerfile`); GPU optional |
| PostgreSQL | Supabase / Neon / RDS | set `DATABASE_URL` |
| Redis | Upstash / Railway | set `REDIS_URL` |
| Object storage | Cloudflare R2 / S3 / Supabase | set `STORAGE_PROVIDER` + keys |

Because storage, DB, cache, and AI providers sit behind interfaces, moving between these hosts
is configuration only.

## CI/CD

- `.github/workflows/ci.yml` — lint, typecheck, Node tests, Python pytest, Playwright e2e.
- `.github/workflows/docker.yml` — builds all three images with layer caching.

## Health & probes

Each service exposes `/health`, `/live`, `/ready`, `/metrics` for orchestrator probes and
Prometheus scraping.
