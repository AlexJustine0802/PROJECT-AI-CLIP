# Environment variables

Copy `.env.example` → `.env`. Every variable is documented there; highlights below.

## Core
| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis (queues, cache, rate limiting) |
| `AI_SERVICE_URL` | URL of the FastAPI AI service |
| `JWT_SECRET` / `AUTH_SECRET` | Shared HS256 secret (API validates Auth.js tokens) |

## Storage (provider abstraction)
`STORAGE_PROVIDER` = `local | minio | s3 | r2 | supabase`. For S3-compatible providers set
`S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`,
`STORAGE_BUCKET`. Local uses `STORAGE_LOCAL_ROOT`.

## AI / models
`AI_USE_STUBS` (run on CPU with mock outputs), `AI_TRANSCRIBE_MODEL`, `AI_WHISPER_DEVICE`,
`AI_WHISPER_COMPUTE_TYPE`, `AI_PIPELINE_VERSION`. Optional provider keys: `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `DEEPGRAM_API_KEY`, `ASSEMBLYAI_API_KEY`.

## Feature flags
`ENABLE_GPU`, `ENABLE_BILLING`, `ENABLE_ADMIN`, `ENABLE_ANALYTICS`, `ENABLE_EXPORT_4K`,
`ENABLE_EXPERIMENTAL_MODELS`, `ENABLE_AI_PROFILES`, plus `AI_USE_STUBS`. Resolved once by
`@clipforge/core` and shared across web / api / ai.

## Billing (Stripe, test mode)
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_BUSINESS`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## Observability
`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `LOG_LEVEL`, `PROMETHEUS_ENABLED`.

## OAuth (optional)
`GOOGLE_CLIENT_ID/SECRET`, `GITHUB_CLIENT_ID/SECRET`, SMTP `EMAIL_SERVER` / `EMAIL_FROM`.
