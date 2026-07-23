import { Logger } from '@nestjs/common';
import type { JobQueue, ProcessJobData } from './job-queue.port';
import type { PipelineRunnerService } from './pipeline-runner.service';

/**
 * Optional BullMQ driver (QUEUE_DRIVER=bullmq) for horizontally-scaled production workers.
 * Lazy-loads `bullmq` and connects to Redis only when selected, so the default in-process
 * path never touches Redis. This preserves the queue-per-stage / worker-pool design for prod.
 */
export class BullmqQueue implements JobQueue {
  private readonly logger = new Logger('BullmqQueue');
  private queue: any;

  constructor(
    private readonly redisUrl: string,
    private readonly runner: PipelineRunnerService,
    private readonly queueName = 'transcription',
  ) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Queue, Worker } = require('bullmq');
    const url = new URL(this.redisUrl);
    const connection = { host: url.hostname, port: Number(url.port || 6379), password: url.password || undefined };

    this.queue = new Queue(this.queueName, { connection });
    new Worker(
      this.queueName,
      async (job: { data: ProcessJobData }) => this.runner.run(job.data),
      { connection, concurrency: Number(process.env.WORKER_CPU_CONCURRENCY ?? 4) },
    );
    this.logger.log(`BullMQ worker attached to "${this.queueName}"`);
  }

  async enqueue(data: ProcessJobData): Promise<void> {
    await this.queue.add('process', data, { jobId: data.jobId });
  }
}
