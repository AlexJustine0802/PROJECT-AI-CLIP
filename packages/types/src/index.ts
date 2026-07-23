/**
 * Shared, framework-agnostic types & enums used across web, api, and (mirrored in) the
 * Python AI service. Kept dependency-free on purpose.
 */

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export const PIPELINE_STAGES = [
  'upload',
  'probe_metadata',
  'extract_audio',
  'transcribe',
  'diarization',
  'scene_detect',
  'silence_detect',
  'story_detect',
  'highlight_score',
  'virality_score',
  'clip_select',
  'smart_crop',
  'subtitles',
  'caption_burn',
  'metadata_gen',
  'thumbnail',
  'export',
] as const;
export type PipelineStageName = (typeof PIPELINE_STAGES)[number];

export const CURRENT_PIPELINE_VERSION = 1;

export type JobStatusName = 'queued' | 'running' | 'completed' | 'failed' | 'canceled';

export type WorkerTypeName = 'cpu' | 'gpu' | 'priority' | 'retry';

// One queue per stage group — scaled independently.
export const QUEUES = [
  'upload',
  'transcription',
  'highlight',
  'subtitle',
  'thumbnail',
  'export',
  'notification',
] as const;
export type QueueName = (typeof QUEUES)[number];

// ---------------------------------------------------------------------------
// Media / clips
// ---------------------------------------------------------------------------

export type AspectRatioName = '9:16' | '16:9' | '1:1' | '4:5';
export type ResolutionName = '1080p' | '1440p' | '2160p';
export type PlatformName =
  | 'tiktok'
  | 'instagram'
  | 'youtube_shorts'
  | 'facebook'
  | 'linkedin'
  | 'x'
  | 'podcast'
  | 'custom';

export type EditingStyleName =
  | 'podcast'
  | 'educational'
  | 'gaming'
  | 'interview'
  | 'vlog'
  | 'news'
  | 'auto';

export type TimelineEventName =
  | 'hook'
  | 'emotion'
  | 'silence'
  | 'scene_change'
  | 'speaker_change'
  | 'keyword';

export interface MediaMetadata {
  durationSec: number;
  fps: number;
  bitrate: number;
  videoCodec: string;
  width: number;
  height: number;
  rotation: number;
  aspectRatio: string;
  audioCodec: string;
  sampleRate: number;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  words?: { start: number; end: number; word: string }[];
}

export interface TimelineEventDto {
  type: TimelineEventName;
  startSec: number;
  endSec?: number;
  label?: string;
  score?: number;
  meta?: Record<string, unknown>;
}

export interface ClipCandidate {
  title: string;
  startSec: number;
  endSec: number;
  qualityScore: number; // 0-100
  viralityScore: number; // 0-100
  hookScore: number; // 0-100
  reasoning: string; // editable AI explanation
  seriesPart?: number;
  editingStyle: EditingStyleName;
}

// ---------------------------------------------------------------------------
// AI pipeline request/response (API <-> AI service contract)
// ---------------------------------------------------------------------------

export interface PipelineRunRequest {
  jobId: string;
  videoId: string;
  sourceUrl: string; // presigned URL / storage key resolvable by the AI service
  editingStyle: EditingStyleName;
  language?: string;
  transcriptionModel: string; // registry key
  useStubs: boolean;
  pipelineVersion: number;
  maxClips?: number;
  generateSeries?: boolean;
  callbackUrl?: string; // API endpoint the AI service posts stage updates to
}

export interface PipelineStageResult {
  stage: PipelineStageName;
  status: 'ok' | 'skipped' | 'error';
  progress: number; // 0-1
  startedAt: string;
  finishedAt?: string;
  logs?: string[];
  cost?: CostBreakdown;
  data?: unknown;
}

export interface PipelineRunResult {
  jobId: string;
  videoId: string;
  pipelineVersion: number;
  metadata?: MediaMetadata;
  transcript?: { language: string; segments: TranscriptSegment[]; wordCount: number };
  timeline: TimelineEventDto[];
  clips: ClipCandidate[];
  usage: UsageStats;
  stages: PipelineStageResult[];
}

// ---------------------------------------------------------------------------
// Usage & cost
// ---------------------------------------------------------------------------

export interface CostBreakdown {
  storageUsd?: number;
  bandwidthUsd?: number;
  cpuUsd?: number;
  gpuUsd?: number;
  inferenceUsd?: number;
  totalUsd: number;
}

export interface UsageStats {
  processingMs: number;
  cpuSeconds: number;
  gpuSeconds: number;
  minutesProcessed: number;
  wordsTranscribed: number;
  clipsGenerated: number;
  storageBytes: number;
  estimatedCostUsd: number;
}

// ---------------------------------------------------------------------------
// Realtime (WebSocket) events
// ---------------------------------------------------------------------------

export type JobEvent =
  | { type: 'progress'; jobId: string; stage: PipelineStageName; progress: number; etaSec?: number }
  | { type: 'log'; jobId: string; stage: PipelineStageName; message: string }
  | { type: 'stage'; jobId: string; stage: PipelineStageName; status: JobStatusName }
  | { type: 'completed'; jobId: string; clips: number }
  | { type: 'failed'; jobId: string; error: string };

// ---------------------------------------------------------------------------
// Billing / roles
// ---------------------------------------------------------------------------

export type RoleName = 'owner' | 'admin' | 'member';
export type PlanTierName = 'free' | 'pro' | 'business' | 'enterprise';
