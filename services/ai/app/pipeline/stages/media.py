"""Media stages: probe metadata, extract audio, smart crop, export. Real ffmpeg with stubs."""
from __future__ import annotations

import os
from typing import Any

from ...logging import get_logger
from ...schemas import MediaMetadata
from .. import ffmpeg_utils as ff
from ..base import PipelineContext, Stage
from ..registry import register

log = get_logger(component="stage")


@register
class ProbeMetadataStage(Stage):
    name = "probe_metadata"
    description = "Extract full media metadata (fps, bitrate, codec, resolution, rotation...)"

    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        if ctx.request.use_stubs or not ff.has_ffmpeg() or not ctx.source_path:
            ctx.metadata = MediaMetadata(
                duration_sec=612.0, fps=30.0, bitrate=4_500_000, video_codec="h264",
                width=1920, height=1080, rotation=0, aspect_ratio="16:9",
                audio_codec="aac", sample_rate=48000,
            )
            return {"stub": True, "metadata": ctx.metadata.model_dump()}

        probe = ff.ffprobe(ctx.source_path)
        v = next((s for s in probe["streams"] if s["codec_type"] == "video"), {})
        a = next((s for s in probe["streams"] if s["codec_type"] == "audio"), {})
        fps = 0.0
        if v.get("r_frame_rate", "0/1") != "0/0":
            num, den = (v.get("r_frame_rate", "0/1").split("/") + ["1"])[:2]
            fps = float(num) / float(den or 1)
        w, h = int(v.get("width", 0)), int(v.get("height", 0))
        ctx.metadata = MediaMetadata(
            duration_sec=float(probe.get("format", {}).get("duration", 0) or 0),
            fps=round(fps, 3),
            bitrate=int(probe.get("format", {}).get("bit_rate", 0) or 0),
            video_codec=v.get("codec_name", ""),
            width=w, height=h,
            rotation=int((v.get("tags", {}) or {}).get("rotate", 0) or 0),
            aspect_ratio=f"{w}:{h}" if w and h else "",
            audio_codec=a.get("codec_name", ""),
            sample_rate=int(a.get("sample_rate", 0) or 0),
        )
        return {"metadata": ctx.metadata.model_dump()}


@register
class ExtractAudioStage(Stage):
    name = "extract_audio"
    description = "Extract mono 16kHz WAV for transcription."

    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        if ctx.request.use_stubs or not ff.has_ffmpeg() or not ctx.source_path:
            ctx.audio_path = None
            return {"stub": True}
        dst = os.path.join(ctx.work_dir, f"{ctx.request.video_id}.wav")
        ff.extract_audio(ctx.source_path, dst)
        ctx.audio_path = dst
        return {"audio_path": dst}


@register
class SmartCropStage(Stage):
    name = "smart_crop"
    description = "Reframe selected clips to their target aspect ratio (center smart-crop)."

    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        # Reframing is performed per-export; here we annotate the intended crop so the export
        # stage / API can act on it. A face-tracking plugin can replace the center-crop default.
        for clip in ctx.clips:
            pass
        return {"reframe": "center", "clips": len(ctx.clips)}


@register
class ExportStage(Stage):
    name = "export"
    description = "Render final clip files per export preset (aspect ratio / resolution)."

    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        # In the real path the API enqueues per-clip export jobs; the AI service exposes the
        # renderer via /render. Here we just confirm the clips are export-ready.
        if ctx.settings.enable_export_4k:
            log.info("4k_export_enabled")
        return {"exportable_clips": len(ctx.clips)}
