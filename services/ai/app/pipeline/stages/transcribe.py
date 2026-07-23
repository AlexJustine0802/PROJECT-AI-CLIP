"""Transcription + diarization stages. Real faster-whisper with a deterministic stub."""
from __future__ import annotations

from typing import Any

from ...logging import get_logger
from ...schemas import TranscriptSegment
from ..base import PipelineContext, Stage
from ..registry import register

log = get_logger(component="stage")

# A short scripted transcript used when stubbing so downstream stages have realistic input.
_STUB_SEGMENTS = [
    (0.0, 6.5, "So here's the thing nobody tells you when you start a company."),
    (6.5, 14.2, "Everyone talks about the wins, but the real story is what happens after you fail."),
    (14.2, 23.0, "I lost my first three hundred users in a single weekend, and it broke me."),
    (23.0, 31.5, "But that failure taught me the one lesson that changed everything."),
    (31.5, 40.0, "You don't need more features. You need to talk to the people who left."),
    (40.0, 49.0, "The moment I called ten churned users, I understood the product for the first time."),
    (49.0, 58.0, "Within a month we tripled retention, and it started with a single phone call."),
    (58.0, 67.0, "So if you take one thing from this: your best roadmap is a conversation."),
]


@register
class TranscribeStage(Stage):
    name = "transcribe"
    description = "Speech-to-text via the configured transcription model (Whisper by default)."

    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        model_key = ctx.request.transcription_model
        if ctx.request.use_stubs or not ctx.audio_path:
            ctx.transcript_segments = [
                TranscriptSegment(start=s, end=e, text=t, speaker="SPEAKER_0")
                for (s, e, t) in _STUB_SEGMENTS
            ]
            ctx.language = ctx.request.language or "en"
            return {"stub": True, "model": model_key, "segments": len(ctx.transcript_segments)}

        # Real path — faster-whisper. Import lazily so the stub path needs no ML deps.
        from faster_whisper import WhisperModel  # type: ignore

        size = model_key.replace("whisper-", "")
        model = WhisperModel(
            size, device=ctx.settings.ai_whisper_device,
            compute_type=ctx.settings.ai_whisper_compute_type,
        )
        segments, info = model.transcribe(ctx.audio_path, language=ctx.request.language)
        ctx.language = info.language
        ctx.transcript_segments = [
            TranscriptSegment(start=seg.start, end=seg.end, text=seg.text.strip())
            for seg in segments
        ]
        ctx.inference_usd += 0.0  # local whisper ~ free
        return {"model": model_key, "language": ctx.language, "segments": len(ctx.transcript_segments)}


@register
class DiarizationStage(Stage):
    name = "diarization"
    description = "Speaker diarization (STUB — swap in pyannote/NeMo plugin for real speakers)."

    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        # STUB: alternate speakers on long pauses. Extension point: real diarization plugin.
        speaker = 0
        prev_end = 0.0
        for seg in ctx.transcript_segments:
            if seg.start - prev_end > 2.0:
                speaker ^= 1
            seg.speaker = f"SPEAKER_{speaker}"
            prev_end = seg.end
        return {"stub": True, "speakers": len({s.speaker for s in ctx.transcript_segments})}
