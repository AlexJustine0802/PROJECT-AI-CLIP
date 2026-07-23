/**
 * ClipForge TypeScript SDK — a thin, typed REST client used by the web app and available to
 * third-party integrators. In CI this is regenerated from the API's OpenAPI document
 * (`pnpm sdk:generate`); this hand-authored core stays stable and re-exports generated types.
 *
 * A matching Python SDK lives in `services/ai/sdk_py` for server-to-server use.
 */
import type {
  ClipCandidate,
  MediaMetadata,
  PlatformName,
  UsageStats,
} from '@clipforge/types';

export interface ClipForgeClientOptions {
  baseUrl: string; // e.g. http://localhost:4000
  apiVersion?: string; // default v1
  getToken?: () => string | Promise<string | undefined> | undefined;
  fetch?: typeof fetch;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

export class ClipForgeError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ClipForgeError';
  }
}

export class ClipForgeClient {
  private readonly baseUrl: string;
  private readonly version: string;
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: ClipForgeClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.version = options.apiVersion ?? 'v1';
    this.fetchImpl = options.fetch ?? globalThis.fetch;
  }

  private async request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}/api/${this.version}${path}`);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
    const token = await this.options.getToken?.();
    const res = await this.fetchImpl(url.toString(), {
      method: opts.method ?? 'GET',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
    if (!res.ok) {
      let details: unknown;
      try {
        details = await res.json();
      } catch {
        details = await res.text();
      }
      throw new ClipForgeError(`Request failed: ${res.status}`, res.status, details);
    }
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  // --- Resources -----------------------------------------------------------
  readonly projects = {
    list: () => this.request<ProjectDto[]>('/projects'),
    create: (input: { name: string; teamId: string; description?: string }) =>
      this.request<ProjectDto>('/projects', { method: 'POST', body: input }),
    get: (id: string) => this.request<ProjectDto>(`/projects/${id}`),
  };

  readonly videos = {
    createUploadUrl: (input: { projectId: string; filename: string; contentType: string }) =>
      this.request<{ videoId: string; uploadUrl: string; storageKey: string }>('/videos/upload-url', {
        method: 'POST',
        body: input,
      }),
    get: (id: string) => this.request<VideoDto>(`/videos/${id}`),
    process: (id: string, input?: { editingStyle?: string; generateSeries?: boolean }) =>
      this.request<{ jobId: string }>(`/videos/${id}/process`, { method: 'POST', body: input ?? {} }),
  };

  readonly clips = {
    listForVideo: (videoId: string) => this.request<ClipDto[]>(`/clips`, { query: { videoId } }),
    updateReasoning: (id: string, reasoning: string) =>
      this.request<ClipDto>(`/clips/${id}`, { method: 'PATCH', body: { reasoning } }),
    export: (id: string, presetKey: string) =>
      this.request<{ exportId: string }>(`/clips/${id}/export`, { method: 'POST', body: { presetKey } }),
  };

  readonly jobs = {
    get: (id: string) => this.request<JobDto>(`/jobs/${id}`),
  };

  readonly billing = {
    checkout: (input: { teamId: string; tier: string }) =>
      this.request<{ url: string }>('/billing/checkout', { method: 'POST', body: input }),
    credits: (teamId: string) => this.request<{ balance: number }>(`/credits`, { query: { teamId } }),
  };
}

// --- DTOs (mirror API responses; regenerated from OpenAPI in CI) ------------
export interface ProjectDto {
  id: string;
  name: string;
  description?: string;
  editingStyle: string;
  createdAt: string;
}
export interface VideoDto {
  id: string;
  title: string;
  status: string;
  metadata?: MediaMetadata;
}
export interface ClipDto extends ClipCandidate {
  id: string;
  videoId: string;
  seriesPart?: number;
  thumbnailUrl?: string;
}
export interface JobDto {
  id: string;
  status: string;
  stage: string;
  progress: number;
  usage?: UsageStats;
}

export * from '@clipforge/types';
