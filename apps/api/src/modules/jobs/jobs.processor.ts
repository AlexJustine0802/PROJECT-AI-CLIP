import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Job } from 'bullmq';
import type { CachePort, StorageProvider } from '@clipforge/core';
import { cacheKeys, estimateCost, usdToCredits } from '@clipforge/core';
import type { PipelineRunResult } from '@clipforge/types';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { CACHE } from '../../infra/cache/cache.module';
import { STORAGE_PROVIDER } from '../../infra/storage/storage.tokens';
import { AiClientService } from './ai-client.service';
import { JobsGateway } from './jobs.gateway';

interface ProcessJobData {
  jobId: string;
  videoId: string;
  teamId: string;
  storageKey: string;
  editingStyle: string;
  generateSeries: boolean;
}

/**
 * Consumes the `transcription` queue (the pipeline entrypoint), dispatches to the AI service,
 * persists results (transcript, timeline, clips, series, usage), meters credits, and emits
 * realtime events. Other queues (subtitle/thumbnail/export) follow the same pattern.
 */
@Processor('transcription')
export class JobsProcessor extends WorkerHost {
  private readonly logger = new Logger('JobsProcessor');

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiClientService,
    private readonly gateway: JobsGateway,
    private readonly config: ConfigService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
    @Inject(CACHE) private readonly cache: CachePort,
  ) {
    super();
  }

  async process(job: Job<ProcessJobData>): Promise<void> {
    const { jobId, videoId, teamId, storageKey, editingStyle, generateSeries } = job.data;
    const flags = this.config.get('flags');
    await this.setStatus(jobId, 'RUNNING', 'TRANSCRIBE');

    const sourceUrl = await this.storage.presignDownload(storageKey, { expiresInSec: 3600 });

    const result = await this.ai.runPipeline({
      jobId,
      videoId,
      sourceUrl,
      editingStyle: editingStyle.toLowerCase() as any,
      transcriptionModel: this.config.get<string>('ai.transcribeModel')!,
      useStubs: flags.aiUseStubs,
      pipelineVersion: this.config.get<number>('ai.pipelineVersion')!,
      generateSeries,
      callbackUrl: `${this.config.get('apiUrl')}/api/v1/jobs/${jobId}/progress`,
    });

    await this.persist(videoId, teamId, jobId, result);
    await this.setStatus(jobId, 'COMPLETED', 'EXPORT', 1);
    this.gateway.emit(jobId, { type: 'completed', jobId, clips: result.clips.length });
    this.logger.log(`Job ${jobId} completed with ${result.clips.length} clips`);
  }

  private async persist(
    videoId: string,
    teamId: string,
    jobId: string,
    result: PipelineRunResult,
  ): Promise<void> {
    // Video metadata
    if (result.metadata) {
      const m = result.metadata;
      await this.prisma.video.update({
        where: { id: videoId },
        data: {
          status: 'READY',
          durationSec: m.durationSec,
          fps: m.fps,
          bitrate: m.bitrate,
          videoCodec: m.videoCodec,
          width: m.width,
          height: m.height,
          rotation: m.rotation,
          aspectRatio: m.aspectRatio,
          audioCodec: m.audioCodec,
          sampleRate: m.sampleRate,
        },
      });
      await this.cache.set(cacheKeys.metadata(videoId), m, 3600);
    }

    // Transcript
    if (result.transcript) {
      await this.prisma.transcript.upsert({
        where: { videoId },
        create: {
          videoId,
          language: result.transcript.language,
          fullText: result.transcript.segments.map((s) => s.text).join(' '),
          segments: result.transcript.segments as any,
          wordCount: result.transcript.wordCount,
          model: this.config.get<string>('ai.transcribeModel'),
        },
        update: { segments: result.transcript.segments as any },
      });
    }

    // Timeline
    if (result.timeline.length) {
      await this.prisma.timelineEvent.createMany({
        data: result.timeline.map((e) => ({
          videoId,
          type: e.type.toUpperCase() as any,
          startSec: e.startSec,
          endSec: e.endSec ?? null,
          label: e.label ?? null,
          score: e.score ?? null,
          meta: (e.meta as any) ?? undefined,
        })),
      });
    }

    // Clip series + clips
    const seriesParts = result.clips.filter((c) => c.seriesPart != null);
    let seriesId: string | null = null;
    if (seriesParts.length >= 2) {
      const series = await this.prisma.clipSeries.create({
        data: { videoId, title: 'Auto Series', summary: `${seriesParts.length}-part series` },
      });
      seriesId = series.id;
    }
    for (const c of result.clips) {
      await this.prisma.clip.create({
        data: {
          videoId,
          seriesId: c.seriesPart != null ? seriesId : null,
          title: c.title,
          startSec: c.startSec,
          endSec: c.endSec,
          editingStyle: c.editingStyle.toUpperCase() as any,
          qualityScore: c.qualityScore,
          viralityScore: c.viralityScore,
          hookScore: c.hookScore,
          reasoning: c.reasoning,
          seriesPart: c.seriesPart ?? null,
          aiTitle: c.aiTitle ?? c.title,
          description: c.description ?? null,
          hashtags: c.hashtags ?? [],
        },
      });
    }

    // Usage + cost + credit metering
    const cost = estimateCost({
      cpuSeconds: result.usage.cpuSeconds,
      gpuSeconds: result.usage.gpuSeconds,
      storageBytes: result.usage.storageBytes,
    });
    await this.prisma.usageRecord.create({
      data: {
        teamId,
        jobId,
        processingMs: result.usage.processingMs,
        cpuSeconds: result.usage.cpuSeconds,
        gpuSeconds: result.usage.gpuSeconds,
        minutesProcessed: result.usage.minutesProcessed,
        wordsTranscribed: result.usage.wordsTranscribed,
        clipsGenerated: result.usage.clipsGenerated,
        estimatedCostUsd: cost.totalUsd,
        modelKey: this.config.get<string>('ai.transcribeModel'),
      },
    });
    await this.chargeCredits(teamId, usdToCredits(cost.totalUsd), jobId);
  }

  private async chargeCredits(teamId: string, credits: number, jobId: string): Promise<void> {
    const wallet = await this.prisma.creditWallet.findUnique({ where: { teamId } });
    if (!wallet) return;
    const balanceAfter = wallet.balance - credits;
    await this.prisma.$transaction([
      this.prisma.creditWallet.update({ where: { teamId }, data: { balance: balanceAfter } }),
      this.prisma.creditTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'USAGE',
          amount: -credits,
          balanceAfter,
          reason: `pipeline job ${jobId}`,
        },
      }),
    ]);
  }

  private async setStatus(
    jobId: string,
    status: 'RUNNING' | 'COMPLETED' | 'FAILED',
    stage: string,
    progress = 0,
  ): Promise<void> {
    await this.prisma.job.update({
      where: { id: jobId },
      data: {
        status: status as any,
        stage: stage as any,
        progress,
        ...(status === 'RUNNING' ? { startedAt: new Date() } : {}),
        ...(status === 'COMPLETED' ? { finishedAt: new Date() } : {}),
      },
    });
  }

  async onFailed(jobId: string, error: string): Promise<void> {
    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: 'FAILED', error, finishedAt: new Date() },
    });
    this.gateway.emit(jobId, { type: 'failed', jobId, error });
  }
}
