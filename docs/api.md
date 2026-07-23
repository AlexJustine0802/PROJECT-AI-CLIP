# API

Base URL: `http://localhost:4000` · All REST routes are versioned under `/api/v1`.
Interactive docs: `/api/docs` (Swagger). GraphQL: `/graphql`.

## Auth

`POST /api/v1/auth/register` · `POST /api/v1/auth/login` → `{ token }`.
Send `Authorization: Bearer <token>` on protected routes. The same HS256 token is issued by
Auth.js in the web app.

## Core REST endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v1/projects?teamId=` | List projects |
| POST | `/api/v1/projects` | Create project |
| POST | `/api/v1/videos/upload-url` | Reserve video + presigned upload URL |
| POST | `/api/v1/videos/:id/process` | Start the pipeline (returns `jobId`) |
| GET | `/api/v1/videos/:id` | Video + clips + transcript + timeline |
| GET | `/api/v1/clips?videoId=` | List clips (quality-ranked) |
| PATCH | `/api/v1/clips/:id` | Edit clip title / AI reasoning |
| POST | `/api/v1/clips/:id/export` | Export a clip with a preset |
| GET | `/api/v1/jobs/:id` | Job status + usage |
| GET | `/api/v1/credits?teamId=` | Credit wallet balance + history |
| POST | `/api/v1/billing/checkout` | Stripe checkout session |
| GET | `/api/v1/admin/overview` | Admin metrics (flag + role gated) |

Ops (unversioned): `/health` `/live` `/ready` `/metrics`.

## GraphQL

```graphql
query {
  projects(teamId: "...") { id name editingStyle }
  clips(videoId: "...") { id title qualityScore viralityScore reasoning seriesPart }
}
```

## Realtime (WebSocket)

Namespace `/jobs`. Emit `subscribe { jobId }`, then receive `job` events:
`progress | log | stage | completed | failed` (typed in `packages/types` as `JobEvent`).

## Errors

Consistent JSON envelope: `{ statusCode, path, timestamp, error }`. Validation uses strict
DTO whitelisting (SQLi/XSS defense). Rate limiting via Redis-backed throttler.

## SDK

Use `@clipforge/sdk` (`ClipForgeClient`) instead of hand-rolling fetch calls. See [sdk.md](sdk.md).
