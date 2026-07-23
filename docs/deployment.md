# Deployment

ClipForge is portable by design (vendor-neutral abstractions). Any of the following work.

## One-command local / self-host (Docker Compose)

```bash
docker compose -f infra/docker-compose.yml up --build
# + observability:
docker compose -f infra/docker-compose.yml -f infra/docker-compose.observability.yml up
```

Brings up postgres, redis, minio (+ bucket init), the AI service, API, and web. Run
migrations once against the running DB: `pnpm db:migrate && pnpm db:seed`.

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
