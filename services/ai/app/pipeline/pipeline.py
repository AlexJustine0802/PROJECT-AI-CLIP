"""Pipeline orchestrator — runs registered stages in order, threading a shared context and
emitting progress. Stage ordering is data, not code branches, so plugins compose freely."""
from __future__ import annotations

import os
import time
from datetime import datetime, timezone

from ..config import get_settings
from ..logging import get_logger
from ..schemas import (
    PipelineRunRequest,
    PipelineRunResult,
    StageResult,
    UsageStats,
)
from . import registry
from .base import PipelineContext, ProgressCallback
from .stages import media, transcribe, analyze, captions, metadata  # noqa: F401  (registers)

log = get_logger(component="pipeline")

# Canonical stage order for pipeline v1. Bumping AI_PIPELINE_VERSION can select another order.
STAGE_ORDER_V1 = [
    "probe_metadata",
    "extract_audio",
    "transcribe",
    "diarization",
    "scene_detect",
    "silence_detect",
    "story_detect",
    "highlight_score",
    "virality_score",
    "clip_select",
    "smart_crop",
    "subtitles",
    "caption_burn",
    "metadata_gen",
    "thumbnail",
    "export",
]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def run_pipeline(
    request: PipelineRunRequest,
    source_path: str | None = None,
    on_progress: ProgressCallback | None = None,
) -> PipelineRunResult:
    settings = get_settings()
    os.makedirs(settings.work_dir, exist_ok=True)
    ctx = PipelineContext(
        request=request,
        settings=settings,
        work_dir=settings.work_dir,
        on_progress=on_progress,
        source_path=source_path,
    )

    order = STAGE_ORDER_V1
    total = len(order)
    stage_results: list[StageResult] = []
    t0 = time.perf_counter()

    for i, stage_name in enumerate(order):
        stage_cls = registry.get(stage_name)
        stage = stage_cls()
        rec = StageResult(stage=stage_name, started_at=_now_iso())
        try:
            if not stage.enabled(ctx):
                rec.status = "skipped"
                rec.finished_at = _now_iso()
                stage_results.append(rec)
                continue
            await ctx.report(stage_name, i / total, f"starting {stage_name}")
            data = await stage.run(ctx)
            rec.status = "ok"
            rec.progress = (i + 1) / total
            rec.finished_at = _now_iso()
            rec.data = data
            log.info("stage_completed", stage=stage_name, job_id=request.job_id, data=data)
        except Exception as exc:  # noqa: BLE001 - surface stage failures, keep pipeline result
            rec.status = "error"
            rec.finished_at = _now_iso()
            rec.logs.append(str(exc))
            log.error("stage_failed", stage=stage_name, job_id=request.job_id, error=str(exc))
            stage_results.append(rec)
            await ctx.report(stage_name, (i + 1) / total, f"error: {exc}")
            break
        stage_results.append(rec)
        await ctx.report(stage_name, (i + 1) / total, f"done {stage_name}")

    elapsed_ms = int((time.perf_counter() - t0) * 1000)
    duration_min = (ctx.metadata.duration_sec / 60.0) if ctx.metadata else 0.0
    words = sum(len(s.text.split()) for s in ctx.transcript_segments)

    usage = UsageStats(
        processing_ms=elapsed_ms,
        cpu_seconds=elapsed_ms / 1000.0,
        gpu_seconds=ctx.gpu_seconds,
        minutes_processed=round(duration_min, 2),
        words_transcribed=words,
        clips_generated=len(ctx.clips),
        estimated_cost_usd=round(ctx.inference_usd + (elapsed_ms / 1000.0) * (0.04 / 3600), 6),
    )

    transcript_payload = None
    if ctx.transcript_segments:
        transcript_payload = {
            "language": ctx.language,
            "segments": [s.model_dump() for s in ctx.transcript_segments],
            "wordCount": words,
        }

    return PipelineRunResult(
        job_id=request.job_id,
        video_id=request.video_id,
        pipeline_version=request.pipeline_version,
        metadata=ctx.metadata,
        transcript=transcript_payload,
        timeline=ctx.timeline,
        clips=ctx.clips,
        usage=usage,
        stages=stage_results,
    )
