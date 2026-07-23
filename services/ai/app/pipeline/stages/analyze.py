"""Analysis stages: scene/silence detection, ClipForge story detection, highlight & virality
scoring, and narrative-aware clip selection (incl. auto clip series)."""
from __future__ import annotations

import re
from typing import Any

from ...logging import get_logger
from ...schemas import ClipCandidate, TimelineEvent
from .. import ffmpeg_utils as ff
from ..base import PipelineContext, Stage
from ..registry import register

log = get_logger(component="stage")

# Signals used by the (transparent, tunable) heuristic scorers.
_HOOK_PATTERNS = [
    r"\bhere'?s the thing\b", r"\bnobody tells you\b", r"\bthe real (story|secret)\b",
    r"\bthe one (lesson|thing)\b", r"\bchanged everything\b", r"\bif you take one thing\b",
    r"\bwhat happens after\b", r"\bthe moment i\b",
]
_EMOTION_WORDS = {
    "broke", "lost", "failure", "failed", "understood", "changed", "tripled", "never", "best",
}


def _text_between(ctx: PipelineContext, start: float, end: float) -> str:
    return " ".join(s.text for s in ctx.transcript_segments if s.start >= start and s.end <= end)


@register
class SceneDetectStage(Stage):
    name = "scene_detect"
    description = "Detect scene cuts (PySceneDetect) with a stub fallback."

    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        if ctx.request.use_stubs or not ff.has_ffmpeg() or not ctx.source_path:
            # Derive pseudo-scenes from transcript pauses.
            scenes, cur = [], 0.0
            for seg in ctx.transcript_segments:
                if seg.start - cur > 8.0:
                    scenes.append((cur, seg.start))
                    cur = seg.start
            dur = ctx.metadata.duration_sec if ctx.metadata else 67.0
            scenes.append((cur, dur))
            ctx.scenes = scenes
        else:
            from scenedetect import detect, ContentDetector  # type: ignore

            found = detect(ctx.source_path, ContentDetector())
            ctx.scenes = [(s.get_seconds(), e.get_seconds()) for s, e in found]
        for s, e in ctx.scenes:
            ctx.timeline.append(TimelineEvent(type="scene_change", start_sec=s, end_sec=e))
        return {"scenes": len(ctx.scenes)}


@register
class SilenceDetectStage(Stage):
    name = "silence_detect"
    description = "Detect silences for trimming / filler removal."

    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        silences = []
        prev_end = 0.0
        for seg in ctx.transcript_segments:
            gap = seg.start - prev_end
            if gap > 0.8:
                silences.append((prev_end, seg.start))
                ctx.timeline.append(
                    TimelineEvent(type="silence", start_sec=prev_end, end_sec=seg.start, score=gap)
                )
            prev_end = seg.end
        ctx.silences = silences
        return {"silences": len(silences)}


@register
class StoryDetectStage(Stage):
    name = "story_detect"
    description = "ClipForge narrative detection — group segments into self-contained stories."

    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        # Narrative-aware windowing: build stories that start on a hook and run to a resolution,
        # preserving flow rather than cutting isolated highlights.
        stories: list[dict[str, Any]] = []
        segs = ctx.transcript_segments
        if not segs:
            ctx.stories = []
            return {"stories": 0}

        i = 0
        while i < len(segs):
            start = segs[i].start
            # extend the window to ~20-45s or until a strong pause / scene boundary
            j = i
            while j < len(segs) and segs[j].end - start < 45:
                j += 1
                if j < len(segs) and segs[j].start - segs[j - 1].end > 1.5 and segs[j].end - start > 18:
                    break
            end = segs[min(j, len(segs) - 1)].end
            text = _text_between(ctx, start, end)
            has_hook = any(re.search(p, text.lower()) for p in _HOOK_PATTERNS)
            stories.append({"start": start, "end": end, "text": text, "has_hook": has_hook})
            i = j if j > i else i + 1

        ctx.stories = stories
        return {"stories": len(stories)}


@register
class HighlightScoreStage(Stage):
    name = "highlight_score"
    description = "Score each story for hook strength & engagement (transparent heuristic)."

    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        for st in ctx.stories:
            text = st["text"].lower()
            hook = 40.0
            for p in _HOOK_PATTERNS:
                if re.search(p, text):
                    hook += 18
            hook = min(hook, 100)
            emotion = min(100.0, 30 + 12 * sum(1 for w in _EMOTION_WORDS if w in text))
            length = st["end"] - st["start"]
            length_fit = 100 - abs(30 - length) * 2  # sweet spot ~30s
            st["hook"] = round(hook, 1)
            st["emotion"] = round(emotion, 1)
            st["engagement"] = round(max(0, min(100, 0.5 * hook + 0.3 * emotion + 0.2 * length_fit)), 1)
            if hook >= 58:
                ctx.timeline.append(
                    TimelineEvent(type="hook", start_sec=st["start"], end_sec=st["end"], score=hook)
                )
            if emotion >= 55:
                ctx.timeline.append(
                    TimelineEvent(type="emotion", start_sec=st["start"], end_sec=st["end"], score=emotion)
                )
        return {"scored": len(ctx.stories)}


@register
class ViralityScoreStage(Stage):
    name = "virality_score"
    description = "Predict virality per story (STUB model — combine hook/emotion/pacing signals)."

    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        for st in ctx.stories:
            hook = st.get("hook", 50)
            emotion = st.get("emotion", 40)
            engagement = st.get("engagement", 50)
            # STUB virality model: weighted blend, capped. Extension point: trained ranker.
            st["virality"] = round(min(100, 0.45 * hook + 0.3 * emotion + 0.25 * engagement), 1)
            st["quality"] = round(min(100, 0.5 * engagement + 0.3 * hook + 0.2 * emotion), 1)
        return {"scored": len(ctx.stories)}


# Style-specific reasoning templates keep explanations recognizable & editable.
_STYLE_HINT = {
    "podcast": "a self-contained insight that works without surrounding context",
    "educational": "a clear teaching moment with a takeaway",
    "gaming": "a high-energy spike likely to retain viewers",
    "interview": "a candid, quotable exchange",
    "vlog": "an authentic, relatable beat",
    "news": "a crisp, information-dense segment",
    "auto": "a strong standalone moment",
}


@register
class ClipSelectStage(Stage):
    name = "clip_select"
    description = "Select best stories as clips, build series (Part 1/2/3), write editable reasoning."

    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        style = ctx.request.editing_style
        ranked = sorted(ctx.stories, key=lambda s: s.get("virality", 0), reverse=True)
        chosen = ranked[: max(1, ctx.request.max_clips)]
        # Keep chronological order for series numbering.
        chosen_sorted = sorted(chosen, key=lambda s: s["start"])
        make_series = ctx.request.generate_series and len(chosen_sorted) >= 2

        for idx, st in enumerate(chosen_sorted):
            hook = st.get("hook", 50)
            emotion = st.get("emotion", 40)
            quality = st.get("quality", 60)
            virality = st.get("virality", 50)
            reason = (
                f"Selected as {_STYLE_HINT.get(style, _STYLE_HINT['auto'])}. "
                f"Hook strength {hook:.0f}/100, emotional pull {emotion:.0f}/100. "
                f"{'Opens on a pattern-interrupt hook. ' if st.get('has_hook') else ''}"
                f"Estimated virality {virality:.0f}/100."
            )
            ctx.clips.append(
                ClipCandidate(
                    title=self._title_from(st["text"]),
                    start_sec=round(st["start"], 2),
                    end_sec=round(st["end"], 2),
                    quality_score=quality,
                    virality_score=virality,
                    hook_score=hook,
                    reasoning=reason,
                    editing_style=style,
                    series_part=(idx + 1) if make_series else None,
                )
            )
        return {"clips": len(ctx.clips), "series": make_series}

    @staticmethod
    def _title_from(text: str) -> str:
        words = re.sub(r"\s+", " ", text).strip().split(" ")
        return (" ".join(words[:9]) + ("..." if len(words) > 9 else "")) or "Untitled clip"
