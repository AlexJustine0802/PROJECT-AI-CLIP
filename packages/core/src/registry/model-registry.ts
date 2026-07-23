/**
 * AI Model Registry (#6) — logical model selection independent of provider. The registry is
 * seeded into the database (AiModel table) but this pure module provides the selection logic
 * and default catalog so it can be reasoned about and tested without a DB.
 */

export type ModelKind = 'transcription' | 'diarization' | 'llm' | 'vision' | 'embedding';

export interface ModelDescriptor {
  key: string;
  name: string;
  kind: ModelKind;
  provider: string;
  isDefault?: boolean;
  experimental?: boolean;
  costPerMinuteUsd?: number;
  costPer1kTokensUsd?: number;
}

export const DEFAULT_MODEL_CATALOG: ModelDescriptor[] = [
  { key: 'whisper-tiny', name: 'Whisper Tiny', kind: 'transcription', provider: 'whisper' },
  { key: 'whisper-base', name: 'Whisper Base', kind: 'transcription', provider: 'whisper' },
  { key: 'whisper-small', name: 'Whisper Small', kind: 'transcription', provider: 'whisper', isDefault: true },
  { key: 'whisper-medium', name: 'Whisper Medium', kind: 'transcription', provider: 'whisper' },
  { key: 'whisper-large-v3', name: 'Whisper Large v3', kind: 'transcription', provider: 'whisper' },
  { key: 'deepgram-nova', name: 'Deepgram Nova', kind: 'transcription', provider: 'deepgram', experimental: true },
  { key: 'assemblyai', name: 'AssemblyAI', kind: 'transcription', provider: 'assemblyai', experimental: true },
  { key: 'gpt-4o-mini', name: 'GPT-4o mini', kind: 'llm', provider: 'openai' },
  { key: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', kind: 'llm', provider: 'anthropic', isDefault: true },
  { key: 'gemini-1-5-flash', name: 'Gemini 1.5 Flash', kind: 'llm', provider: 'google' },
  { key: 'qwen2-7b', name: 'Qwen2 7B (local)', kind: 'llm', provider: 'local', experimental: true },
];

export class ModelRegistry {
  constructor(
    private readonly catalog: ModelDescriptor[] = DEFAULT_MODEL_CATALOG,
    private readonly allowExperimental = false,
  ) {}

  list(kind?: ModelKind): ModelDescriptor[] {
    return this.catalog.filter(
      (m) => (!kind || m.kind === kind) && (this.allowExperimental || !m.experimental),
    );
  }

  get(key: string): ModelDescriptor | undefined {
    return this.catalog.find((m) => m.key === key);
  }

  /** Resolve a requested key, falling back to the default for its kind. */
  resolve(kind: ModelKind, requestedKey?: string): ModelDescriptor {
    if (requestedKey) {
      const found = this.get(requestedKey);
      if (found && (this.allowExperimental || !found.experimental)) return found;
    }
    const def = this.list(kind).find((m) => m.isDefault) ?? this.list(kind)[0];
    if (!def) throw new Error(`No available model for kind "${kind}"`);
    return def;
  }
}
