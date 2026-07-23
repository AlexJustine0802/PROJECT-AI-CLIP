# ClipForge AI Service

FastAPI service implementing the plugin-based video-to-shorts pipeline.

`Pipeline → Stage (interface) → Plugin → Model`

## Run

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"          # stub path only (no ML deps)
pip install -e ".[dev,ml]"       # + faster-whisper, PySceneDetect (real transcription)
uvicorn app.main:app --reload --port 8000
```

- Docs: http://localhost:8000/docs
- Health: `/health` · Readiness: `/ready` · Liveness: `/live` · Metrics: `/metrics`
- Stages: `GET /pipeline/stages`

Set `AI_USE_STUBS=false` (and install the `ml` extra + ffmpeg) to run real inference.

## Add a stage plugin

Create a class in `app/pipeline/stages/`, decorate with `@register`, give it a unique `name`,
and add that name to `STAGE_ORDER_V1` (or a new versioned order). No core edits required.

```python
from ..base import PipelineContext, Stage
from ..registry import register

@register
class MyStage(Stage):
    name = "my_stage"
    description = "..."
    async def run(self, ctx: PipelineContext) -> dict:
        ...
        return {"ok": True}
```

## Test

```bash
pytest            # runs on the stub path, no models required
```
