/**
 * Cache port — Redis-backed in production, in-memory in tests. Used for transcripts,
 * media metadata, thumbnails, export info, and hot projects.
 */
export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSec?: number): Promise<void>;
  del(key: string): Promise<void>;
  /** Get-or-compute helper. */
  wrap<T>(key: string, ttlSec: number, compute: () => Promise<T>): Promise<T>;
}

export const cacheKeys = {
  transcript: (videoId: string) => `transcript:${videoId}`,
  metadata: (videoId: string) => `metadata:${videoId}`,
  thumbnail: (clipId: string) => `thumbnail:${clipId}`,
  exportInfo: (exportId: string) => `export:${exportId}`,
  project: (projectId: string) => `project:${projectId}`,
} as const;
