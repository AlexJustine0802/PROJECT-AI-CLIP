/**
 * StorageProvider port — the single abstraction all business logic uses for object storage.
 * Concrete adapters (local fs, MinIO/S3/R2, Supabase) live in the infrastructure layer
 * (apps/api) and are selected by configuration. Business logic never imports a vendor SDK.
 */

export type StorageProviderType = 'local' | 'minio' | 's3' | 'r2' | 'supabase';

export interface PutObjectOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface PresignOptions {
  expiresInSec?: number;
  contentType?: string;
}

export interface StoredObject {
  key: string;
  sizeBytes: number;
  contentType?: string;
}

export interface StorageProvider {
  readonly type: StorageProviderType;

  /** Upload bytes/stream to a key. */
  put(key: string, body: Buffer | Uint8Array, options?: PutObjectOptions): Promise<StoredObject>;

  /** Download an object into memory. */
  get(key: string): Promise<Buffer>;

  /** Remove an object (no-op if missing). */
  remove(key: string): Promise<void>;

  /** True if the object exists. */
  exists(key: string): Promise<boolean>;

  /** A presigned URL a client can use to PUT directly (resumable/multipart upload). */
  presignUpload(key: string, options?: PresignOptions): Promise<string>;

  /** A presigned URL a client (or the AI service) can use to GET the object. */
  presignDownload(key: string, options?: PresignOptions): Promise<string>;

  /** Stable public/internal URL for a key (may be a presigned URL for private buckets). */
  urlFor(key: string): Promise<string>;
}
