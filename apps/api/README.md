# ClipForge API (NestJS)

REST (`/api/v1`) + GraphQL (`/graphql`) backend. Prisma, BullMQ (queue-per-stage), Auth.js
JWT validation, RBAC, Stripe billing + credit wallet, WebSocket realtime, OTel + Prometheus.

## Run

```bash
pnpm --filter @clipforge/api dev     # http://localhost:4000
```

- Swagger: `/api/docs` · GraphQL: `/graphql`
- Ops: `/health` `/live` `/ready` `/metrics`

## Layering (Clean Architecture)

```
main.ts                 bootstrap (helmet, versioning, validation, swagger)
app.module.ts           composition root + global guards (auth → rbac → throttle)
config/                 typed configuration + feature flags
common/                 guards, decorators, filters (cross-cutting)
infra/                  adapters behind ports: prisma, cache (redis), storage (local/s3/r2)
queue/                  per-stage BullMQ topology + worker-pool mapping
modules/                feature slices (auth, projects, videos, clips, jobs, billing, admin…)
```

Business logic depends on **ports** from `@clipforge/core` (StorageProvider, CachePort, …),
never on vendor SDKs. Swap a backend by changing config, not code.

## Test

```bash
pnpm --filter @clipforge/api test
```
