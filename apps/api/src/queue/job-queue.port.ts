/** DI token + interface for the job queue. Drivers: in-process (default) or BullMQ (prod). */
export const JOB_QUEUE = Symbol('JOB_QUEUE');

export interface ProcessJobData {
  jobId: string;
  videoId: string;
  teamId: string;
  storageKey: string;
  editingStyle: string;
  generateSeries: boolean;
}

export interface JobQueue {
  /** Enqueue a pipeline job. In-process runs it asynchronously; BullMQ persists to Redis. */
  enqueue(data: ProcessJobData): Promise<void>;
}
