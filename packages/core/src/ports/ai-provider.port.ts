/**
 * AI provider ports. Every AI stage depends only on these interfaces — concrete providers
 * (Whisper, OpenAI, Claude, Gemini, Qwen, Deepgram, AssemblyAI, custom local) are plugins
 * selected via the model registry. This lives on the API side for orchestration; the Python
 * AI service mirrors the same contract (see services/ai/app/ports).
 */
import type { TranscriptSegment } from '@clipforge/types';

export interface TranscriptionRequest {
  audioUrl: string;
  language?: string;
  modelKey: string;
}

export interface TranscriptionResult {
  language: string;
  segments: TranscriptSegment[];
  wordCount: number;
  modelKey: string;
}

export interface TranscriptionProvider {
  readonly provider: string; // 'whisper' | 'deepgram' | 'assemblyai' | ...
  transcribe(req: TranscriptionRequest): Promise<TranscriptionResult>;
}

export interface LlmGenerateRequest {
  system?: string;
  prompt: string;
  modelKey: string;
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
}

export interface LlmGenerateResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  modelKey: string;
}

export interface LlmProvider {
  readonly provider: string; // 'openai' | 'anthropic' | 'google' | 'local' | ...
  generate(req: LlmGenerateRequest): Promise<LlmGenerateResult>;
}
