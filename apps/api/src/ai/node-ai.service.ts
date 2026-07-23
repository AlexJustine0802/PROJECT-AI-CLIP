import { Injectable } from '@nestjs/common';
import type {
  ClipCandidate,
  EditingStyleName,
  PipelineRunRequest,
  PipelineRunResult,
  TimelineEventDto,
  TranscriptSegment,
} from '@clipforge/types';
import type { AiPipeline } from './ai.port';

/**
 * Node in-process AI driver (default, AI_DRIVER=node). Runs a realistic, narrative-aware
 * pipeline with NO Python, ffmpeg, or model downloads — so the whole app works on Windows with
 * only Node. Mirrors the Python service's stub stages (story detection, scoring, clip series,
 * editable reasoning, insight timeline). Swap to AI_DRIVER=http for real inference.
 */
@Injectable()
export class NodeAiService implements AiPipeline {
  private readonly script: [number, number, string][] = [
    [0.0, 6.5, "So here's the thing nobody tells you when you start a company."],
    [6.5, 14.2, 'Everyone talks about the wins, but the real story is what happens after you fail.'],
    [14.2, 23.0, 'I lost my first three hundred users in a single weekend, and it broke me.'],
    [23.0, 31.5, 'But that failure taught me the one lesson that changed everything.'],
    [31.5, 40.0, "You don't need more features. You need to talk to the people who left."],
    [40.0, 49.0, 'The moment I called ten churned users, I understood the product for the first time.'],
    [49.0, 58.0, 'Within a month we tripled retention, and it started with a single phone call.'],
    [58.0, 67.0, 'So if you take one thing from this: your best roadmap is a conversation.'],
  ];

  private readonly hookPatterns = [
    /here'?s the thing/, /nobody tells you/, /the real (story|secret)/, /the one (lesson|thing)/,
    /changed everything/, /if you take one thing/, /what happens after/, /the moment i/,
  ];
  private readonly emotionWords = ['broke', 'lost', 'failure', 'failed', 'understood', 'changed', 'tripled', 'never', 'best'];

  private readonly styleHint: Record<EditingStyleName, string> = {
    podcast: 'a self-contained insight that works without surrounding context',
    educational: 'a clear teaching moment with a takeaway',
    gaming: 'a high-energy spike likely to retain viewers',
    interview: 'a candid, quotable exchange',
    vlog: 'an authentic, relatable beat',
    news: 'a crisp, information-dense segment',
    auto: 'a strong standalone moment',
  };

  async runPipeline(req: PipelineRunRequest): Promise<PipelineRunResult> {
    const t0 = Date.now();
    const style = (req.editingStyle ?? 'auto') as EditingStyleName;
    const segments: TranscriptSegment[] = this.script.map(([start, end, text], i) => ({
      start,
      end,
      text,
      speaker: `SPEAKER_${i % 2}`,
    }));
    const duration = segments[segments.length - 1]!.end;
    const timeline: TimelineEventDto[] = [];

    // scene + silence signals
    let prevEnd = 0;
    for (const s of segments) {
      if (s.start - prevEnd > 0.8) {
        timeline.push({ type: 'silence', startSec: prevEnd, endSec: s.start, score: s.start - prevEnd });
      }
      prevEnd = s.end;
    }

    // story detection (narrative windows) + scoring + clip selection
    const stories = this.detectStories(segments);
    for (const st of stories) {
      const lower = st.text.toLowerCase();
      let hook = 40;
      for (const p of this.hookPatterns) if (p.test(lower)) hook += 18;
      hook = Math.min(hook, 100);
      const emotion = Math.min(100, 30 + 12 * this.emotionWords.filter((w) => lower.includes(w)).length);
      const lengthFit = 100 - Math.abs(30 - (st.end - st.start)) * 2;
      const engagement = Math.max(0, Math.min(100, 0.5 * hook + 0.3 * emotion + 0.2 * lengthFit));
      st.hook = Math.round(hook * 10) / 10;
      st.emotion = Math.round(emotion * 10) / 10;
      st.virality = Math.round(Math.min(100, 0.45 * hook + 0.3 * emotion + 0.25 * engagement) * 10) / 10;
      st.quality = Math.round(Math.min(100, 0.5 * engagement + 0.3 * hook + 0.2 * emotion) * 10) / 10;
      if (hook >= 58) timeline.push({ type: 'hook', startSec: st.start, endSec: st.end, score: hook });
      if (emotion >= 55) timeline.push({ type: 'emotion', startSec: st.start, endSec: st.end, score: emotion });
    }

    const ranked = [...stories].sort((a, b) => (b.virality ?? 0) - (a.virality ?? 0));
    const chosen = ranked.slice(0, Math.max(1, req.maxClips ?? 6)).sort((a, b) => a.start - b.start);
    const makeSeries = (req.generateSeries ?? true) && chosen.length >= 2;

    const clips: ClipCandidate[] = chosen.map((st, idx) => {
      const reason =
        `Selected as ${this.styleHint[style] ?? this.styleHint.auto}. ` +
        `Hook strength ${Math.round(st.hook!)}/100, emotional pull ${Math.round(st.emotion!)}/100. ` +
        `${st.hasHook ? 'Opens on a pattern-interrupt hook. ' : ''}` +
        `Estimated virality ${Math.round(st.virality!)}/100.`;
      const kws = this.keywords(st.text);
      return {
        title: this.titleFrom(st.text),
        startSec: Math.round(st.start * 100) / 100,
        endSec: Math.round(st.end * 100) / 100,
        qualityScore: st.quality!,
        viralityScore: st.virality!,
        hookScore: st.hook!,
        reasoning: reason,
        editingStyle: style,
        seriesPart: makeSeries ? idx + 1 : undefined,
        aiTitle: this.titleFrom(st.text),
        description: `${this.titleFrom(st.text)} — a standout moment from the full video. ${kws.map((k) => '#' + k).join(' ')}`,
        hashtags: [...kws.map((k) => `#${k}`), '#shorts', '#clipforge'],
      };
    });

    const words = segments.reduce((n, s) => n + s.text.split(/\s+/).length, 0);
    const elapsedMs = Date.now() - t0;

    return {
      jobId: req.jobId,
      videoId: req.videoId,
      pipelineVersion: req.pipelineVersion,
      metadata: {
        durationSec: duration,
        fps: 30,
        bitrate: 4_500_000,
        videoCodec: 'h264',
        width: 1920,
        height: 1080,
        rotation: 0,
        aspectRatio: '16:9',
        audioCodec: 'aac',
        sampleRate: 48000,
      },
      transcript: { language: req.language ?? 'en', segments, wordCount: words },
      timeline,
      clips,
      usage: {
        processingMs: elapsedMs,
        cpuSeconds: elapsedMs / 1000,
        gpuSeconds: 0,
        minutesProcessed: Math.round((duration / 60) * 100) / 100,
        wordsTranscribed: words,
        clipsGenerated: clips.length,
        storageBytes: 0,
        estimatedCostUsd: Math.round((elapsedMs / 1000) * (0.04 / 3600) * 1e6) / 1e6,
      },
      stages: [],
    };
  }

  private detectStories(segments: TranscriptSegment[]): Story[] {
    const stories: Story[] = [];
    let i = 0;
    while (i < segments.length) {
      const start = segments[i]!.start;
      let j = i;
      while (j < segments.length && segments[j]!.end - start < 45) {
        j++;
        if (
          j < segments.length &&
          segments[j]!.start - segments[j - 1]!.end > 1.5 &&
          segments[j]!.end - start > 18
        ) {
          break;
        }
      }
      const end = segments[Math.min(j, segments.length - 1)]!.end;
      const text = segments
        .filter((s) => s.start >= start && s.end <= end)
        .map((s) => s.text)
        .join(' ');
      const hasHook = this.hookPatterns.some((p) => p.test(text.toLowerCase()));
      stories.push({ start, end, text, hasHook });
      i = j > i ? j : i + 1;
    }
    return stories;
  }

  private titleFrom(text: string): string {
    const words = text.replace(/\s+/g, ' ').trim().split(' ');
    return (words.slice(0, 9).join(' ') + (words.length > 9 ? '...' : '')) || 'Untitled clip';
  }

  private keywords(text: string, n = 4): string[] {
    const stop = new Set(['the', 'and', 'you', 'your', 'that', 'with', 'this', 'for', 'but', 'when', 'what']);
    const freq: Record<string, number> = {};
    for (const w of text.toLowerCase().match(/[a-z]{4,}/g) ?? []) {
      if (!stop.has(w)) freq[w] = (freq[w] ?? 0) + 1;
    }
    return Object.keys(freq).sort((a, b) => freq[b]! - freq[a]!).slice(0, n);
  }
}

interface Story {
  start: number;
  end: number;
  text: string;
  hasHook: boolean;
  hook?: number;
  emotion?: number;
  virality?: number;
  quality?: number;
}
