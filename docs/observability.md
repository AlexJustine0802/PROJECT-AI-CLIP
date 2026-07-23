# Observability

## Metrics (Prometheus)

Both services expose `/metrics`:
- **API**: default Node metrics (`clipforge_api_*`) + HTTP counters/histograms.
- **AI**: `clipforge_pipeline_runs_total`, `clipforge_stage_duration_seconds`,
  `clipforge_clips_generated_total`.

Scrape config: `infra/observability/prometheus.yml`. Grafana is provisioned with the
Prometheus datasource (`infra/observability/grafana-datasources.yml`) and runs on `:3001`.

## Tracing (OpenTelemetry)

Set `OTEL_EXPORTER_OTLP_ENDPOINT` (e.g. `http://otel-collector:4318`). The AI service
instruments FastAPI automatically when the OTel extra + endpoint are present; the API is
wired the same way. The collector config is `infra/observability/otel-collector.yaml`.

## Logging (structured)

- **API**: Pino (JSON). No `console.log` in production code.
- **AI**: structlog (JSON). Ship to Loki / Elastic / OpenSearch by pointing your log driver
  at the JSON stdout stream.

## Health probes

`/health` (basic), `/ready` (checks DB), `/live` (process alive), on both services.
