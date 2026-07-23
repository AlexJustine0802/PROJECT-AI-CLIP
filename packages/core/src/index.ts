// Ports (interfaces) — the vendor-neutral boundaries every module depends on.
export * from './ports/storage.port';
export * from './ports/ai-provider.port';
export * from './ports/cache.port';
export * from './ports/logger.port';

// Pure domain services.
export * from './flags/feature-flags';
export * from './cost/cost-estimator';
export * from './registry/model-registry';
