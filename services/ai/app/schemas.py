"""Pydantic contracts — mirror packages/types (TS) so the API <-> AI service contract holds."""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

EditingStyle = Literal[
    "podcast", "educational", "gaming", "interview", "vlog", "news", "auto"
]
TimelineEventType = Literal[
    "hook", "emotion", "silence", "scene_change", "speaker_change", "keyword"
]


class PipelineRunRequest(BaseModel):
    job_id: str
    video_id: str
    source_url: str
    editing_style: EditingStyle = "auto"
    language: str | None = None
    transcription_model: str = "whisper-small"
    use_stubs: bool = True
    pipeline_version: int = 1
    max_clips: int = 6
    generate_series: bool = True
    callback_url: str | None = None


class MediaMetadata(BaseModel):
    duration_sec: float = 0
    fps: float = 0
    bitrate: int = 0
    video_codec: str = ""
    width: int = 0
    height: int = 0
    rotation: int = 0
    aspect_ratio: str = ""
    audio_codec: str = ""
    sample_rate: int = 0


class TranscriptSegment(BaseModel):
    start: float
    end: float
    text: str
    speaker: str | None = None


class TimelineEvent(BaseModel):
    type: TimelineEventType
    start_sec: float
    end_sec: float | None = None
    label: str | None = None
    score: float | None = None
    meta: dict[str, Any] | None = None


class ClipCandidate(BaseModel):
    title: str
    start_sec: float
    end_sec: float
    quality_score: float = Field(ge=0, le=100)
    virality_score: float = Field(ge=0, le=100)
    hook_score: float = Field(ge=0, le=100)
    reasoning: str
    editing_style: EditingStyle = "auto"
    series_part: int | None = None
    ai_title: str | None = None
    description: str | None = None
    hashtags: list[str] = Field(default_factory=list)


class CostBreakdown(BaseModel):
    storage_usd: float = 0
    bandwidth_usd: float = 0
    cpu_usd: float = 0
    gpu_usd: float = 0
    inference_usd: float = 0
    total_usd: float = 0


class UsageStats(BaseModel):
    processing_ms: int = 0
    cpu_seconds: float = 0
    gpu_seconds: float = 0
    minutes_processed: float = 0
    words_transcribed: int = 0
    clips_generated: int = 0
    storage_bytes: int = 0
    estimated_cost_usd: float = 0


class StageResult(BaseModel):
    stage: str
    status: Literal["ok", "skipped", "error"] = "ok"
    progress: float = 1.0
    started_at: str
    finished_at: str | None = None
    logs: list[str] = Field(default_factory=list)
    cost: CostBreakdown | None = None
    data: Any | None = None


class PipelineRunResult(BaseModel):
    job_id: str
    video_id: str
    pipeline_version: int
    metadata: MediaMetadata | None = None
    transcript: dict[str, Any] | None = None
    timeline: list[TimelineEvent] = Field(default_factory=list)
    clips: list[ClipCandidate] = Field(default_factory=list)
    usage: UsageStats = Field(default_factory=UsageStats)
    stages: list[StageResult] = Field(default_factory=list)
