"""Application settings & feature flags (mirrors packages/core flags)."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    # Core
    ai_service_url: str = "http://localhost:8000"
    log_level: str = "info"
    otel_service_name: str = "clipforge-ai"
    otel_exporter_otlp_endpoint: str | None = None
    prometheus_enabled: bool = True

    # Pipeline / models
    ai_use_stubs: bool = True
    ai_transcribe_model: str = "whisper-small"
    ai_whisper_device: str = "cpu"
    ai_whisper_compute_type: str = "int8"
    ai_pipeline_version: int = 1

    # Feature flags
    enable_gpu: bool = False
    enable_export_4k: bool = False
    enable_experimental_models: bool = False

    # Optional provider keys
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_ai_api_key: str | None = None
    deepgram_api_key: str | None = None
    assemblyai_api_key: str | None = None

    # Work dir for intermediate artifacts
    work_dir: str = "/tmp/clipforge"


@lru_cache
def get_settings() -> Settings:
    return Settings()
