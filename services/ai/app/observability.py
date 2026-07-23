"""Prometheus metrics + optional OpenTelemetry tracing. All optional deps are lazy."""
from __future__ import annotations

from prometheus_client import Counter, Histogram

from .config import get_settings
from .logging import get_logger

log = get_logger(component="observability")

PIPELINE_RUNS = Counter("clipforge_pipeline_runs_total", "Pipeline runs", ["status"])
STAGE_DURATION = Histogram("clipforge_stage_duration_seconds", "Stage duration", ["stage"])
CLIPS_GENERATED = Counter("clipforge_clips_generated_total", "Clips generated")


def setup_tracing(app: object) -> None:
    """Instrument FastAPI with OTel if the optional deps + endpoint are configured."""
    settings = get_settings()
    if not settings.otel_exporter_otlp_endpoint:
        return
    try:
        from opentelemetry import trace
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor

        provider = TracerProvider(resource=Resource.create({"service.name": settings.otel_service_name}))
        provider.add_span_processor(
            BatchSpanProcessor(OTLPSpanExporter(endpoint=f"{settings.otel_exporter_otlp_endpoint}/v1/traces"))
        )
        trace.set_tracer_provider(provider)
        FastAPIInstrumentor.instrument_app(app)  # type: ignore[arg-type]
        log.info("otel_enabled", endpoint=settings.otel_exporter_otlp_endpoint)
    except Exception as exc:  # noqa: BLE001
        log.warn("otel_setup_skipped", error=str(exc))
