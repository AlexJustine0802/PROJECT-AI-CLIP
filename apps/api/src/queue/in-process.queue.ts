import { Injectable, Logger } from '@nestjs/common';
import type { JobQueue, ProcessJobData } from './job-queue.port';
import { PipelineRunnerService } from './pipeline-runner.service';

/**
 * In-process queue (default, QUEUE_DRIVER=memory) — no Redis, no Docker. Jobs run
 * asynchronously on the Node event loop so the HTTP request returns immediately, exactly like
 * a real worker. A tiny concurrency gate keeps CPU usage sane in dev.
 */
@Injectable()
export class InProcessQueue implements JobQueue {
  private readonly logger = new Logger('InProcessQueue');
  private active = 0;
  private readonly maxConcurrent = Number(process.env.WORKER_CPU_CONCURRENCY ?? 2);
  private readonly pending: ProcessJobData[] = [];

  constructor(private readonly runner: PipelineRunnerService) {}

  async enqueue(data: ProcessJobData): Promise<void> {
    this.pending.push(data);
    queueMicrotask(() => this.drain());
  }

  private drain(): void {
    while (this.active < this.maxConcurrent && this.pending.length > 0) {
      const data = this.pending.shift()!;
      this.active++;
      // Fire-and-forget; PipelineRunnerService handles its own errors/status.
      void this.runner
        .run(data)
        .catch((err) => this.logger.error(`Job ${data.jobId} crashed: ${err}`))
        .finally(() => {
          this.active--;
          if (this.pending.length > 0) queueMicrotask(() => this.drain());
        });
    }
  }
}
