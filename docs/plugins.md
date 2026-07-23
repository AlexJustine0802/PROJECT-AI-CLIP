# Extending ClipForge with plugins

ClipForge is designed so new capabilities are added as **plugins behind interfaces** — no core
edits required (marketplace-ready).

## Add an AI pipeline stage

```python
# services/ai/app/pipeline/stages/my_stage.py
from ..base import PipelineContext, Stage
from ..registry import register

@register
class MyStage(Stage):
    name = "my_stage"
    description = "What it does"
    async def run(self, ctx: PipelineContext) -> dict:
        # read ctx.transcript_segments / ctx.clips / ..., mutate ctx
        return {"ok": True}
```

Import it in `stages/__init__.py` and add `"my_stage"` to `STAGE_ORDER_V1` (or a new versioned
order). Done.

## Add a transcription / LLM model

1. Add a row to the model registry (`AiModel` table / `DEFAULT_MODEL_CATALOG`).
2. Implement `TranscriptionProvider` or `LlmProvider` (`packages/core/ports`) — or the Python
   equivalent — for the new provider.
3. Select it via `AI_TRANSCRIBE_MODEL` or per-request `transcriptionModel`.

## Add a storage backend

Implement `StorageProvider` (`packages/core`) and register it in
`apps/api/src/infra/storage/storage.module.ts` under a new `STORAGE_PROVIDER` value. Business
logic is untouched.

## Add an export preset / subtitle style / thumbnail generator

- **Export preset**: insert an `ExportPreset` row (`key`, aspect ratio, resolution, fps).
- **Subtitle style**: add a style key handled in `captions.py` `segments_to_ass`.
- **Thumbnail generator**: implement a `thumbnail`-kind plugin and select by config.

Every extension point depends only on an interface, so plugins are swappable and testable in
isolation.
