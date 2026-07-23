import { estimateCost, usdToCredits, ModelRegistry, resolveFeatureFlags } from '@clipforge/core';

describe('cost estimator', () => {
  it('sums all cost components', () => {
    const c = estimateCost({ cpuSeconds: 3600, gpuSeconds: 3600, inferenceUsd: 0.5 });
    expect(c.cpuUsd).toBeCloseTo(0.04, 5);
    expect(c.gpuUsd).toBeCloseTo(0.6, 5);
    expect(c.totalUsd).toBeCloseTo(0.04 + 0.6 + 0.5, 5);
  });

  it('converts usd to at least one credit', () => {
    expect(usdToCredits(0)).toBe(1);
    expect(usdToCredits(0.1)).toBe(5);
  });
});

describe('model registry', () => {
  it('resolves the default transcription model', () => {
    const reg = new ModelRegistry();
    expect(reg.resolve('transcription').key).toBe('whisper-small');
  });

  it('hides experimental models unless allowed', () => {
    expect(new ModelRegistry().get('deepgram-nova')).toBeDefined();
    const listed = new ModelRegistry().list('transcription').map((m) => m.key);
    expect(listed).not.toContain('deepgram-nova');
    const allowed = new ModelRegistry(undefined, true).list('transcription').map((m) => m.key);
    expect(allowed).toContain('deepgram-nova');
  });

  it('falls back to default for unknown keys', () => {
    const reg = new ModelRegistry();
    expect(reg.resolve('transcription', 'does-not-exist').key).toBe('whisper-small');
  });
});

describe('feature flags', () => {
  it('defaults stubs on and gpu off', () => {
    const f = resolveFeatureFlags({});
    expect(f.aiUseStubs).toBe(true);
    expect(f.enableGpu).toBe(false);
  });

  it('parses truthy strings', () => {
    expect(resolveFeatureFlags({ ENABLE_GPU: 'true' }).enableGpu).toBe(true);
    expect(resolveFeatureFlags({ AI_USE_STUBS: 'off' }).aiUseStubs).toBe(false);
  });
});
