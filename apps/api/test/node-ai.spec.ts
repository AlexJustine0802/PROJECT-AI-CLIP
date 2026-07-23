import { NodeAiService } from '../src/ai/node-ai.service';
import type { PipelineRunRequest } from '@clipforge/types';

const req = (over: Partial<PipelineRunRequest> = {}): PipelineRunRequest => ({
  jobId: 'job_1',
  videoId: 'vid_1',
  sourceUrl: 'memory://stub',
  editingStyle: 'podcast',
  transcriptionModel: 'whisper-small',
  useStubs: true,
  pipelineVersion: 1,
  maxClips: 4,
  generateSeries: true,
  ...over,
});

describe('NodeAiService (in-process AI, no Python/Docker)', () => {
  const ai = new NodeAiService();

  it('produces metadata, transcript and clips', async () => {
    const r = await ai.runPipeline(req());
    expect(r.metadata?.durationSec).toBeGreaterThan(0);
    expect(r.transcript?.segments.length).toBeGreaterThan(0);
    expect(r.clips.length).toBeGreaterThanOrEqual(1);
    expect(r.usage.clipsGenerated).toBe(r.clips.length);
  });

  it('scores every clip and always includes editable reasoning', async () => {
    const r = await ai.runPipeline(req());
    for (const c of r.clips) {
      expect(c.qualityScore).toBeGreaterThanOrEqual(0);
      expect(c.qualityScore).toBeLessThanOrEqual(100);
      expect(c.reasoning.length).toBeGreaterThan(0);
      expect(c.hashtags && c.hashtags.length).toBeTruthy();
    }
  });

  it('numbers a clip series in chronological order', async () => {
    const r = await ai.runPipeline(req({ generateSeries: true, maxClips: 4 }));
    if (r.clips.length >= 2) {
      const parts = r.clips.map((c) => c.seriesPart);
      expect(parts.every((p) => p != null)).toBe(true);
      expect(parts).toEqual([...parts].sort((a, b) => (a! - b!)));
    }
  });

  it('emits an insight timeline with scene/hook/silence signals', async () => {
    const r = await ai.runPipeline(req());
    const types = new Set(r.timeline.map((e) => e.type));
    expect(types.has('hook') || types.has('silence')).toBe(true);
  });
});
