import { Body, Controller, Get, Injectable, Module, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Public } from '../../common/decorators';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { AiClientService } from './ai-client.service';
import { JobsGateway } from './jobs.gateway';
import { JobsProcessor } from './jobs.processor';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: JobsGateway,
    @InjectQueue('transcription') private readonly queue: Queue,
  ) {}

  /** Create a Job row and enqueue the pipeline entry job. */
  async enqueue(input: {
    videoId: string;
    teamId: string;
    storageKey: string;
    editingStyle: string;
    generateSeries: boolean;
  }): Promise<{ jobId: string }> {
    const job = await this.prisma.job.create({
      data: { videoId: input.videoId, status: 'QUEUED', stage: 'UPLOAD', queueName: 'transcription' },
    });
    await this.prisma.video.update({ where: { id: input.videoId }, data: { status: 'PROCESSING' } });
    await this.queue.add('process', { jobId: job.id, ...input }, { jobId: job.id });
    return { jobId: job.id };
  }

  get(id: string) {
    return this.prisma.job.findUnique({ where: { id }, include: { usageRecord: true } });
  }

  /** Progress callback posted by the AI service; re-broadcast over WebSocket. */
  async onProgress(jobId: string, body: { stage: string; progress: number; message?: string }) {
    this.gateway.emit(jobId, {
      type: 'progress',
      jobId,
      stage: body.stage as any,
      progress: body.progress,
    });
    await this.prisma.job.update({
      where: { id: jobId },
      data: { stage: body.stage.toUpperCase() as any, progress: body.progress },
    });
    return { ok: true };
  }
}

@ApiTags('jobs')
@Controller({ path: 'jobs', version: '1' })
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get(':id')
  get(@Param('id') id: string) {
    return this.jobs.get(id);
  }

  @Public()
  @Post(':id/progress')
  progress(@Param('id') id: string, @Body() body: { stage: string; progress: number; message?: string }) {
    return this.jobs.onProgress(id, body);
  }
}

@Module({
  imports: [BullModule.registerQueue({ name: 'transcription' })],
  providers: [JobsService, JobsProcessor, JobsGateway, AiClientService],
  controllers: [JobsController],
  exports: [JobsService, JobsGateway],
})
export class JobsModule {}
