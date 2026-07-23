# AI Pipeline

`Pipeline → Stage (interface) → Plugin → Model`

The pipeline (`services/ai`) is an ordered list of **stage plugins**. Each stage is an
abstract `Stage` with a single `run(ctx)` method and self-registers via `@register`. Ordering
lives in `STAGE_ORDER_V1` (data, not code), so plugins compose freely and the pipeline is
**versioned** for reproducibility (`pipelineVersion` is stored on every `Job`).

## Stages

| # | Stage | Real / Stub | Notes |
| --- | --- | --- | --- |
| 1 | `probe_metadata` | real (ffprobe) | fps, bitrate, codec, resolution, rotation, audio |
| 2 | `extract_audio` | real (ffmpeg) | mono 16kHz wav |
| 3 | `transcribe` | real (faster-whisper) | model from registry; stub transcript otherwise |
| 4 | `diarization` | stub | pyannote/NeMo plugin is the extension point |
| 5 | `scene_detect` | real (PySceneDetect) | pauses-based fallback |
| 6 | `silence_detect` | real | gaps between segments |
| 7 | `story_detect` | ClipForge | narrative windowing (differentiator) |
| 8 | `highlight_score` | heuristic | transparent hook/emotion/engagement |
| 9 | `virality_score` | stub model | weighted blend; swap a trained ranker |
| 10 | `clip_select` | ClipForge | narrative-aware selection + series + reasoning |
| 11 | `smart_crop` | real (ffmpeg) | center smart-crop; face-track plugin extends |
| 12 | `subtitles` | real | SRT + styled ASS |
| 13 | `caption_burn` | real (ffmpeg) | animated ASS burn-in at render |
| 14 | `metadata_gen` | stub LLM | title/hashtags/description via `LlmProvider` |
| 15 | `thumbnail` | real (ffmpeg) | representative frame |
| 16 | `export` | real (ffmpeg) | per export preset / aspect ratio / resolution |

Set `AI_USE_STUBS=false` (+ install the `ml` extra and ffmpeg) to run the real path on CPU.

## Contract

The API calls `POST /pipeline/run` with a `PipelineRunRequest` (see `packages/types`), gets a
`PipelineRunResult` (metadata, transcript, timeline, scored clips, usage), and persists it.
Progress is streamed back to `callback_url` and re-broadcast to the web app over WebSocket.

## Differentiators in the pipeline

- **Story detection** groups segments into self-contained narratives before scoring, so clips
  preserve flow instead of cutting isolated highlights.
- **Clip series** numbers chosen clips into Part 1 / 2 / 3.
- **Editable reasoning** — every clip carries a human-readable, editable explanation.
- **Quality score** — a 0–100 score per clip drives ranking and the "min quality" preference.

See [plugins.md](plugins.md) to add a stage, model, storage, or export plugin.
