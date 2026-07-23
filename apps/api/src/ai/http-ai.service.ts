import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { PipelineRunRequest, PipelineRunResult } from '@clipforge/types';
import type { AiPipeline } from './ai.port';

/**
 * HTTP driver — delegates to the Python FastAPI service for real inference
 * (ffmpeg + faster-whisper + PySceneDetect). Selected with AI_DRIVER=http.
 */
@Injectable()
export class HttpAiService implements AiPipeline {
  private readonly logger = new Logger('HttpAi');
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.get<string>('aiServiceUrl')!;
  }

  async runPipeline(req: PipelineRunRequest): Promise<PipelineRunResult> {
    const res = await fetch(`${this.baseUrl}/pipeline/run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(this.toSnake(req)),
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`AI pipeline failed: ${res.status} ${body}`);
      throw new Error(`AI service error ${res.status}`);
    }
    return (await res.json()) as PipelineRunResult;
  }

  private toSnake(req: PipelineRunRequest): Record<string, unknown> {
    return {
      job_id: req.jobId,
      video_id: req.videoId,
      source_url: req.sourceUrl,
      editing_style: req.editingStyle,
      language: req.language,
      transcription_model: req.transcriptionModel,
      use_stubs: req.useStubs,
      pipeline_version: req.pipelineVersion,
      max_clips: req.maxClips ?? 6,
      generate_series: req.generateSeries ?? true,
      callback_url: req.callbackUrl,
    };
  }
}
