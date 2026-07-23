"""Pipeline contract tests — run entirely on the stub path (no ffmpeg/whisper needed)."""
import pytest

from app.pipeline.pipeline import STAGE_ORDER_V1, run_pipeline
from app.pipeline import registry
from app.schemas import PipelineRunRequest


def _req(**kw) -> PipelineRunRequest:
    base = dict(
        job_id="job_1",
        video_id="vid_1",
        source_url="memory://stub",
        editing_style="podcast",
        transcription_model="whisper-small",
        use_stubs=True,
        pipeline_version=1,
        max_clips=4,
        generate_series=True,
    )
    base.update(kw)
    return PipelineRunRequest(**base)


def test_all_stages_registered():
    reg = registry.all_stages()
    for name in STAGE_ORDER_V1:
        assert name in reg, f"stage {name} not registered"


@pytest.mark.asyncio
async def test_stub_pipeline_produces_clips():
    result = await run_pipeline(_req())
    assert result.job_id == "job_1"
    assert result.metadata is not None
    assert result.transcript is not None
    assert len(result.clips) >= 1
    assert result.usage.clips_generated == len(result.clips)


@pytest.mark.asyncio
async def test_clips_have_scores_and_reasoning():
    result = await run_pipeline(_req())
    for clip in result.clips:
        assert 0 <= clip.quality_score <= 100
        assert 0 <= clip.virality_score <= 100
        assert clip.reasoning  # editable AI explanation is always present
        assert clip.hashtags  # metadata stage ran


@pytest.mark.asyncio
async def test_series_numbering_when_multiple_clips():
    result = await run_pipeline(_req(generate_series=True, max_clips=4))
    if len(result.clips) >= 2:
        parts = [c.series_part for c in result.clips]
        assert all(p is not None for p in parts)
        assert parts == sorted(parts)


@pytest.mark.asyncio
async def test_timeline_events_emitted():
    result = await run_pipeline(_req())
    types = {e.type for e in result.timeline}
    # scene/silence/hook events should appear from the analysis stages
    assert "scene_change" in types
