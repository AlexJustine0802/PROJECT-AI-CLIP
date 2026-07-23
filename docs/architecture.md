# Architecture

ClipForge is a Turborepo monorepo built on **interface-first, SOLID, Clean Architecture**
principles. Every external dependency is wrapped behind a port so any module is replaceable
via configuration.

## Topology

```
┌────────────┐     JWT (HS256)     ┌────────────────────────┐    presigned    ┌────────────┐
│  apps/web  │ ──────────────────► │        apps/api        │ ─────URL──────► │  storage   │
│ Next.js 14 │ ◄── WebSocket ───── │  NestJS REST+GraphQL    │                 │ local/s3/… │
│  Auth.js   │                     │  BullMQ (queue/stage)   │                 └────────────┘
└────────────┘                     │  Prisma ─► PostgreSQL   │
                                    │  Redis (cache+queues)   │
                                    └───────────┬─────────────┘
                                                │ POST /pipeline/run
                                                ▼
                                    ┌────────────────────────┐
                                    │      services/ai       │
                                    │ FastAPI plugin pipeline │
                                    │ ffmpeg + faster-whisper │
                                    └────────────────────────┘
```

## Layers (per deployable)

- **Domain / application**: pure logic — `packages/core` (ports, feature flags, cost
  estimator, model registry), `packages/types`. No framework or vendor imports.
- **Infrastructure (adapters)**: `apps/api/src/infra/*` — Prisma, Redis cache, storage
  providers; `services/ai/app/pipeline/*` — ffmpeg/whisper plugins. Each implements a port.
- **Interface (delivery)**: NestJS controllers/resolvers/gateway, Next.js routes, FastAPI
  routes.

## Key abstractions

| Concern | Port | Adapters |
| --- | --- | --- |
| Object storage | `StorageProvider` | local fs, S3 (minio/s3/r2/supabase) |
| Cache | `CachePort` | Redis, (in-memory for tests) |
| Transcription / LLM | `TranscriptionProvider`, `LlmProvider` | Whisper (real), OpenAI/Claude/Gemini/Qwen/Deepgram/AssemblyAI (stub) |
| AI stage | `Stage` (Python) | one plugin per stage, self-registered |
| Feature flags | `FeatureFlags` | env-resolved, shared across services |
| Queue | BullMQ per stage | worker-pool typed (cpu/gpu/priority/retry) |

## Vendor-neutrality & vendor lock-in avoidance

Business logic imports **ports**, never SDKs. Switching Postgres host, storage backend,
transcription provider, or LLM is a configuration change. This keeps the system portable
across Vercel / Railway / Supabase / Cloudflare / self-hosted.

## Marked stubs (honesty)

The abstractions are real; not every provider is fully implemented. Heavy ML (GPU
diarization, face-tracking, emotion, virality) and cloud AI providers ship as
**interface + realistic stub** with TODO extension points. Non-default storage backends are
implemented against the interface but validated only for local/MinIO. Stripe/OAuth run in
test mode. This is a runnable, extensible foundation — not a finished commercial product.
