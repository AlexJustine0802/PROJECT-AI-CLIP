# Changelog

All notable changes to ClipForge are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Docker is no longer required for development.** The entire dev environment now runs on
  Windows 11 (and macOS/Linux) with only Node.js. Infrastructure is driver-based and selected
  via `.env`:
  - **Database → SQLite** by default (`file:./dev.db`); schema made portable (String value
    sets instead of native enums, JSON-encoded String fields instead of `Json`/arrays) so it
    still targets PostgreSQL in production by changing one `provider` line.
  - **Queue → in-process** driver (`QUEUE_DRIVER=memory`); BullMQ/Redis is now opt-in.
  - **Cache → in-memory** driver (`CACHE_DRIVER=memory`); Redis is opt-in.
  - **AI pipeline → in-process Node** driver (`AI_DRIVER=node`) that runs story detection,
    scoring, clip series, reasoning, and the insight timeline with no Python/ffmpeg; the
    Python FastAPI service becomes an opt-in `http` driver for real inference.
  - **Storage → local filesystem** by default.
- Added `pnpm setup` (cross-platform Node script) and `pnpm db:push` for one-command bootstrap.
- Extracted `PipelineRunnerService` (driver-agnostic) and a `RealtimeModule`; Docker/Compose
  are retained as an optional prod-like stack.

### Added
- Initial monorepo scaffold (Turborepo + pnpm): `apps/web`, `apps/api`, `services/ai`,
  `packages/{db,core,types,config,sdk}`.
- **Database**: full Prisma schema — auth (Auth.js), teams/RBAC, projects, videos (with
  complete media metadata), clips (quality score, editable AI reasoning, editing style),
  clip series, timeline events, transcripts, subtitles, jobs (per-stage + pipeline version),
  export presets, subscriptions/plans/invoices/coupons, credit wallet, usage records, AI
  model registry, notifications, audit log, API keys. Seed for plans, presets, models.
- **AI service**: plugin-based pipeline (`Pipeline → Stage → Plugin → Model`) with a
  configurable model registry, real ffmpeg + faster-whisper + PySceneDetect stages, and
  stub plugins for story detection, diarization, emotion, virality, and LLM metadata.
- **API**: versioned REST (`/api/v1`) + GraphQL, Auth.js JWT validation, RBAC, storage
  abstraction, queue-per-stage BullMQ topology, typed worker pools, Stripe billing + credit
  wallet, admin/analytics, WebSocket realtime, OpenTelemetry + Prometheus + Pino.
- **Web**: Next.js 14 app with Auth.js, landing, pricing, dashboard, workspace/editor
  (insight timeline, clip compare, editable reasoning), upload, billing, admin, settings;
  i18n scaffolding (en/id/ja/zh) and WebSocket job progress.
- **Differentiators**: AI story detection, clip series, editing styles, editable reasoning,
  per-clip quality score, insight timeline, side-by-side compare, personalized AI profiles.
- Infra: Dockerfiles, docker-compose (+ observability stack), GitHub Actions CI/CD.
- Docs: architecture, database, API, AI pipeline, plugins, observability, environment,
  deployment, SDK.

[Unreleased]: https://github.com/alexjustine0802/project-ai-clip/commits/main
