/**
 * Feature flags — pure, dependency-free. Reads from a provided env-like map so it can be used
 * on server (process.env) or client (public config) identically. Gates optional functionality
 * so modules stay replaceable and experiments are safe to ship dark.
 */

export interface FeatureFlags {
  aiUseStubs: boolean;
  enableGpu: boolean;
  enableBilling: boolean;
  enableAdmin: boolean;
  enableAnalytics: boolean;
  enableExport4k: boolean;
  enableExperimentalModels: boolean;
  enableAiProfiles: boolean;
}

export type FlagName = keyof FeatureFlags;

const truthy = (v: string | undefined, fallback = false): boolean => {
  if (v === undefined || v === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(v.toLowerCase());
};

export function resolveFeatureFlags(env: Record<string, string | undefined>): FeatureFlags {
  return {
    aiUseStubs: truthy(env.AI_USE_STUBS, true),
    enableGpu: truthy(env.ENABLE_GPU, false),
    enableBilling: truthy(env.ENABLE_BILLING, true),
    enableAdmin: truthy(env.ENABLE_ADMIN, true),
    enableAnalytics: truthy(env.ENABLE_ANALYTICS, true),
    enableExport4k: truthy(env.ENABLE_EXPORT_4K, false),
    enableExperimentalModels: truthy(env.ENABLE_EXPERIMENTAL_MODELS, false),
    enableAiProfiles: truthy(env.ENABLE_AI_PROFILES, true),
  };
}

export const DEFAULT_FLAGS: FeatureFlags = resolveFeatureFlags({});
