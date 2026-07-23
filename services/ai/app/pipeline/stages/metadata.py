"""AI metadata generation: titles, hashtags, descriptions, thumbnails. LLM behind an interface;
deterministic stub keeps the whole flow offline-runnable."""
from __future__ import annotations

import re
from typing import Any

from ..base import PipelineContext, Stage
from ..registry import register

_STOPWORDS = {"the", "and", "you", "your", "that", "with", "this", "for", "but", "when", "what"}


def _keywords(text: str, n: int = 4) -> list[str]:
    words = re.findall(r"[a-zA-Z]{4,}", text.lower())
    freq: dict[str, int] = {}
    for w in words:
        if w not in _STOPWORDS:
            freq[w] = freq.get(w, 0) + 1
    top = sorted(freq, key=lambda w: freq[w], reverse=True)[:n]
    return top


@register
class MetadataGenStage(Stage):
    name = "metadata_gen"
    description = "Generate AI title, description, and hashtags per clip (LLM or stub)."

    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        # STUB generator. Extension point: call an LlmProvider (OpenAI/Claude/Gemini/Qwen).
        for clip in ctx.clips:
            text = " ".join(
                s.text for s in ctx.transcript_segments
                if s.start >= clip.start_sec and s.end <= clip.end_sec
            )
            kws = _keywords(text) or ["story", "founder", "lesson"]
            clip.ai_title = clip.title
            clip.hashtags = [f"#{k}" for k in kws] + ["#shorts", "#clipforge"]
            clip.description = (
                f"{clip.title} — {('a ' + clip.editing_style + ' moment') if clip.editing_style != 'auto' else 'a standout moment'} "
                f"from the full video. {' '.join('#' + k for k in kws)}"
            )
        return {"generated": len(ctx.clips)}


@register
class ThumbnailStage(Stage):
    name = "thumbnail"
    description = "Pick a representative frame + generate a thumbnail (ffmpeg; stubbed key)."

    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        # Thumbnails are rendered by the export/render path; record intended timestamps.
        for clip in ctx.clips:
            pass
        return {"thumbnails": len(ctx.clips)}
