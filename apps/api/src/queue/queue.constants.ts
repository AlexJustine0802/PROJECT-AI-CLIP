import type { QueueName, WorkerTypeName } from '@clipforge/types';

/**
 * Queue-per-stage topology (#4). Each queue scales independently and can be pinned to a
 * worker pool type (#5). Distributed workers register against the same queue names.
 */
export const QUEUE_NAMES: QueueName[] = [
  'upload',
  'transcription',
  'highlight',
  'subtitle',
  'thumbnail',
  'export',
  'notification',
];

/** Which worker pool each queue prefers. GPU-heavy stages target the GPU pool when enabled. */
export const QUEUE_WORKER_TYPE: Record<QueueName, WorkerTypeName> = {
  upload: 'cpu',
  transcription: 'gpu',
  highlight: 'cpu',
  subtitle: 'cpu',
  thumbnail: 'cpu',
  export: 'gpu',
  notification: 'cpu',
};

/** Concurrency per worker pool type — tuned independently, overridable via env. */
export const WORKER_CONCURRENCY: Record<WorkerTypeName, number> = {
  cpu: parseInt(process.env.WORKER_CPU_CONCURRENCY ?? '4', 10),
  gpu: parseInt(process.env.WORKER_GPU_CONCURRENCY ?? '1', 10),
  priority: parseInt(process.env.WORKER_PRIORITY_CONCURRENCY ?? '2', 10),
  retry: parseInt(process.env.WORKER_RETRY_CONCURRENCY ?? '1', 10),
};
