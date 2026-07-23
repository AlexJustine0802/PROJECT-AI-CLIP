import type { PipelineRunRequest, PipelineRunResult } from '@clipforge/types';

/** DI token for the AI pipeline driver (Node in-process stub, or HTTP to the Python service). */
export const AI_PIPELINE = Symbol('AI_PIPELINE');

/**
 * The API depends only on this interface. Two drivers implement it:
 *  - NodeAiService: runs a realistic pipeline entirely in Node (no Python, no Docker).
 *  - HttpAiService: calls the Python FastAPI service for real ffmpeg/faster-whisper inference.
 */
export interface AiPipeline {
  runPipeline(req: PipelineRunRequest): Promise<PipelineRunResult>;
}
