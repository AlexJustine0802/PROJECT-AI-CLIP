import { resolveFeatureFlags } from '@clipforge/core';

/**
 * Centralized, validated configuration. Reads process.env once and exposes a typed object.
 * Feature flags come from the shared @clipforge/core resolver so web/api/ai agree.
 */
export const configuration = () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '4000', 10),
  webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
  aiServiceUrl: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
  apiUrl: process.env.API_URL ?? 'http://localhost:4000',

  database: { url: process.env.DATABASE_URL ?? '' },
  redis: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-insecure-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },

  storage: {
    provider: (process.env.STORAGE_PROVIDER ?? 'local') as
      | 'local'
      | 'minio'
      | 's3'
      | 'r2'
      | 'supabase',
    bucket: process.env.STORAGE_BUCKET ?? 'clipforge',
    localRoot: process.env.STORAGE_LOCAL_ROOT ?? './storage',
    s3: {
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
      forcePathStyle: (process.env.S3_FORCE_PATH_STYLE ?? 'true') === 'true',
    },
  },

  ai: {
    transcribeModel: process.env.AI_TRANSCRIBE_MODEL ?? 'whisper-small',
    pipelineVersion: parseInt(process.env.AI_PIPELINE_VERSION ?? '1', 10),
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    prices: {
      pro: process.env.STRIPE_PRICE_PRO ?? '',
      business: process.env.STRIPE_PRICE_BUSINESS ?? '',
    },
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX ?? '120', 10),
  },

  flags: resolveFeatureFlags(process.env),
});

export type AppConfig = ReturnType<typeof configuration>;
