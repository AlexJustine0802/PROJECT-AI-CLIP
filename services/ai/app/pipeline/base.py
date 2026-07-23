"""Stage interface + shared pipeline context. Every stage depends only on interfaces."""
from __future__ import annotations

import abc
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable

from ..config import Settings
from ..schemas import (
    ClipCandidate,
    MediaMetadata,
    PipelineRunRequest,
    TimelineEvent,
    TranscriptSegment,
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


ProgressCallback = Callable[[str, float, str | None], Awaitable[None]]


@dataclass
class PipelineContext:
    """Mutable state threaded through every stage."""

    request: PipelineRunRequest
    settings: Settings
    work_dir: str
    on_progress: ProgressCallback | None = None

    # Artifacts produced by stages
    source_path: str | None = None
    audio_path: str | None = None
    metadata: MediaMetadata | None = None
    transcript_segments: list[TranscriptSegment] = field(default_factory=list)
    language: str = "en"
    timeline: list[TimelineEvent] = field(default_factory=list)
    scenes: list[tuple[float, float]] = field(default_factory=list)
    silences: list[tuple[float, float]] = field(default_factory=list)
    stories: list[dict[str, Any]] = field(default_factory=list)
    clips: list[ClipCandidate] = field(default_factory=list)
    cpu_seconds: float = 0.0
    gpu_seconds: float = 0.0
    inference_usd: float = 0.0

    async def report(self, stage: str, progress: float, message: str | None = None) -> None:
        if self.on_progress is not None:
            await self.on_progress(stage, progress, message)


class Stage(abc.ABC):
    """Base class for every pipeline stage plugin."""

    #: unique stage name (matches PipelineStageName in packages/types)
    name: str = "stage"
    #: human description
    description: str = ""

    def enabled(self, ctx: PipelineContext) -> bool:  # noqa: D401 - simple predicate
        """Whether this stage should run for the given context."""
        return True

    @abc.abstractmethod
    async def run(self, ctx: PipelineContext) -> dict[str, Any]:
        """Execute the stage, mutating ctx and returning a small result payload."""
        raise NotImplementedError


@dataclass
class StageRecord:
    stage: str
    status: str
    started_at: str
    finished_at: str | None = None
    logs: list[str] = field(default_factory=list)
    data: Any | None = None

    @staticmethod
    def start(stage: str) -> "StageRecord":
        return StageRecord(stage=stage, status="ok", started_at=_now_iso())

    def done(self, data: Any | None = None) -> "StageRecord":
        self.finished_at = _now_iso()
        self.data = data
        return self
