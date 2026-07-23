import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JOB_QUEUE } from './job-queue.port';
import { PipelineRunnerService } from './pipeline-runner.service';
import { InProcessQueue } from './in-process.queue';
import { BullmqQueue } from './bullmq.queue';

/**
 * Provides the JobQueue driver selected by config (#queue abstraction). Default `memory` runs
 * jobs in-process (no Redis/Docker); `bullmq` connects to Redis for scaled production workers.
 * The queue-per-stage / worker-pool topology lives in queue.constants.ts and is honored by the
 * BullMQ driver.
 */
@Global()
@Module({
  providers: [
    PipelineRunnerService,
    InProcessQueue,
    {
      provide: JOB_QUEUE,
      inject: [ConfigService, InProcessQueue, PipelineRunnerService],
      useFactory: (config: ConfigService, inProcess: InProcessQueue, runner: PipelineRunnerService) => {
        if (config.get<string>('queue.driver') === 'bullmq') {
          return new BullmqQueue(config.get<string>('redis.url')!, runner);
        }
        return inProcess;
      },
    },
  ],
  exports: [JOB_QUEUE, PipelineRunnerService],
})
export class QueueModule {}
