<div align="center">

# 🎬 ClipForge

**AI that turns long-form video into a series of narrative-aware short-form clips.**

Not another highlight cutter — ClipForge detects *stories*, preserves narrative flow,
generates clip series (Part 1 / 2 / 3), scores every clip, and explains its reasoning.

[![CI](https://github.com/alexjustine0802/project-ai-clip/actions/workflows/ci.yml/badge.svg)](https://github.com/alexjustine0802/project-ai-clip/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

---

## What makes ClipForge different

ClipForge is intentionally **not** a clone of existing clippers. Its identity:

| Differentiator | What it means |
| --- | --- |
| 🧠 **AI Story Detection** | Finds narrative arcs, not just loud moments. |
| 🧵 **Clip Series** | Auto-splits a long video into Part 1 / 2 / 3 that stand alone yet connect. |
| 🎭 **Editing Styles** | Podcast, Educational, Gaming, Interview, Vlog, News templates. |
| 💬 **Editable AI Reasoning** | Every clip explains *why* it was chosen — and you can edit it. |
| ⭐ **Quality Score** | A 0–100 score per clip so you export only the best. |
| 📊 **Insight Timeline** | Hooks, emotions, silence, and scene changes on one timeline. |
| ⚖️ **Side-by-side Compare** | Compare candidate clips before exporting. |
| ✍️ **AI-assisted, not fully-auto** | You stay in control; the AI proposes, you decide. |
| 👤 **Personalized AI Profiles** | Learns your editing preferences over time. |

## The pipeline

`upload → probe metadata → extract audio → transcribe → scene/silence detect →
story detect → highlight + virality score → clip select → smart crop → subtitles →
animated captions → title/hashtags/description → thumbnail → export`

Every stage is a **plugin behind an interface** (see [`docs/ai-pipeline.md`](docs/ai-pipeline.md)).
The real, CPU-runnable path (ffmpeg + faster-whisper + PySceneDetect) works out of the box;
heavier stages (diarization, face-tracking, emotion, cloud LLMs) ship as swappable stubs.

## Architecture

A Turborepo monorepo with three deployable units and shared packages:

```
apps/web      Next.js 14 (App Router, TS, Tailwind, shadcn/ui, Framer Motion) + Auth.js
apps/api      NestJS — REST /api/v1 + GraphQL, Prisma, BullMQ (queue-per-stage), Stripe, WS
services/ai   FastAPI — plugin pipeline, model registry, ffmpeg + faster-whisper
packages/db   Prisma schema, migrations, seed
packages/core Framework-agnostic interfaces (StorageProvider, AiProvider, FeatureFlags, …)
packages/types Shared enums & DTOs
packages/sdk  Generated TypeScript SDK (+ Python SDK)
infra/        Dockerfiles, docker-compose, observability stack, nginx
docs/         Architecture, API, pipeline, deployment, env, plugins, observability
```

Design principles: **interface-first, SOLID, Clean Architecture, DI, vendor-neutral
abstractions** (storage, AI models, cache), **feature flags**, **queue-per-stage +
worker pools**, **API versioning**, **WebSocket realtime**, **OpenTelemetry + Prometheus**,
and **structured logging**. See [`docs/architecture.md`](docs/architecture.md).

## Quick start (Windows / macOS / Linux — Node.js only, no Docker)

The default configuration needs **nothing but Node.js 20+ and pnpm 9+**. No Docker,
PostgreSQL, Redis, MinIO, or Python required — it uses SQLite, an in-process queue, an
in-memory cache, local file storage, and an in-process Node AI pipeline.

```powershell
# 1. Install (from the repo root)
pnpm install

# 2. One-time setup: creates .env, the SQLite DB, and seed data
pnpm setup

# 3. Start API + Web together
pnpm dev
```

- Web → http://localhost:3000  (sign in with **demo@clipforge.local / password123**)
- API (Swagger) → http://localhost:4000/api/docs
- GraphQL → http://localhost:4000/graphql

That's it — upload a video and the full `upload → transcribe → story detect → clip →
subtitles → export` flow runs in-process.

### Optional upgrades (opt-in, not required)

Everything is driver-based, selected by `.env`. Turn these on only if you want them:

| Want… | Set in `.env` | Needs |
| --- | --- | --- |
| Real ffmpeg + Whisper inference | `AI_DRIVER=http` | Python service (`services/ai`) |
| Scaled background workers | `QUEUE_DRIVER=bullmq` | Redis |
| Shared/multi-instance cache | `CACHE_DRIVER=redis` | Redis |
| Cloud object storage | `STORAGE_PROVIDER=s3\|r2\|supabase` | provider keys |
| PostgreSQL | schema `provider = "postgresql"` | Postgres |

Docker is still available for a full containerized stack (`infra/docker-compose.yml`) but is
entirely optional. See [`docs/deployment.md`](docs/deployment.md).

## Documentation

- [Architecture](docs/architecture.md) · [Database](docs/database.md) · [API](docs/api.md)
- [AI Pipeline](docs/ai-pipeline.md) · [Plugins](docs/plugins.md) · [Observability](docs/observability.md)
- [Environment](docs/environment.md) · [Deployment](docs/deployment.md) · [SDK](docs/sdk.md)
- [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

## Status

This is an open, from-scratch foundation. The abstractions and the core
`upload → … → export` slice are real and runnable. Heavy ML providers and non-default
cloud storage backends are implemented against their interfaces with realistic stubs —
see the "marked stubs" note in [`docs/architecture.md`](docs/architecture.md).

## License

[MIT](./LICENSE) — no proprietary assets, code, or branding from any existing product.
