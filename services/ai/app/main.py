"""ClipForge AI service — FastAPI entrypoint.

Exposes the plugin pipeline over HTTP. The API (NestJS) calls `/pipeline/run` from its
BullMQ workers; progress is streamed back via the optional `callback_url`.
"""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

import httpx
from fastapi import BackgroundTasks, FastAPI
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from . import __version__
from .config import get_settings
from .logging import configure_logging, get_logger
from .observability import CLIPS_GENERATED, PIPELINE_RUNS, setup_tracing
from .pipeline import registry
from .pipeline.pipeline import STAGE_ORDER_V1, run_pipeline
from .pipeline.stages import media  # noqa: F401  ensure plugins are imported/registered
from .schemas import PipelineRunRequest, PipelineRunResult

configure_logging()
log = get_logger(component="main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("ai_service_starting", version=__version__, stages=len(registry.all_stages()))
    yield
    log.info("ai_service_stopping")


app = FastAPI(
    title="ClipForge AI Service",
    version=__version__,
    description="Plugin-based video-to-shorts pipeline.",
    lifespan=lifespan,
)
setup_tracing(app)


# --- Health / readiness / liveness ----------------------------------------
@app.get("/health", tags=["ops"])
async def health() -> dict[str, str]:
    return {"status": "ok", "version": __version__}


@app.get("/live", tags=["ops"])
async def live() -> dict[str, str]:
    return {"status": "alive"}


@app.get("/ready", tags=["ops"])
async def ready() -> dict[str, object]:
    return {"status": "ready", "stages": list(registry.all_stages().keys())}


@app.get("/metrics", tags=["ops"])
async def metrics() -> Response:
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/pipeline/stages", tags=["pipeline"])
async def stages() -> dict[str, object]:
    reg = registry.all_stages()
    return {
        "version": get_settings().ai_pipeline_version,
        "order": STAGE_ORDER_V1,
        "plugins": {name: cls.description for name, cls in reg.items()},
    }


# --- Pipeline -------------------------------------------------------------
async def _post_callback(url: str, payload: dict) -> None:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(url, json=payload)
    except Exception as exc:  # noqa: BLE001
        log.warn("callback_failed", url=url, error=str(exc))


@app.post("/pipeline/run", response_model=PipelineRunResult, tags=["pipeline"])
async def pipeline_run(req: PipelineRunRequest) -> PipelineRunResult:
    """Run the full pipeline synchronously and return the result.

    Progress events are POSTed to `callback_url` if provided (fire-and-forget).
    """
    async def on_progress(stage: str, progress: float, message: str | None) -> None:
        if req.callback_url:
            asyncio.create_task(
                _post_callback(
                    req.callback_url,
                    {"jobId": req.job_id, "stage": stage, "progress": progress, "message": message},
                )
            )

    log.info("pipeline_run", job_id=req.job_id, video_id=req.video_id, use_stubs=req.use_stubs)
    try:
        result = await run_pipeline(req, on_progress=on_progress)
        PIPELINE_RUNS.labels(status="completed").inc()
        CLIPS_GENERATED.inc(len(result.clips))
        return result
    except Exception:
        PIPELINE_RUNS.labels(status="failed").inc()
        raise


@app.post("/pipeline/run-async", tags=["pipeline"])
async def pipeline_run_async(req: PipelineRunRequest, background: BackgroundTasks) -> dict[str, str]:
    """Kick the pipeline off in the background; results are delivered via callback_url."""
    background.add_task(_run_and_report, req)
    return {"status": "accepted", "jobId": req.job_id}


async def _run_and_report(req: PipelineRunRequest) -> None:
    result = await run_pipeline(req)
    if req.callback_url:
        await _post_callback(req.callback_url + "/result", result.model_dump())
