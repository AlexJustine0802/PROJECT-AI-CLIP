# ClipForge AI service
FROM python:3.11-slim AS base

# ffmpeg is required for the real media path.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY pyproject.toml README.md ./
COPY app ./app

# Install the stub path by default; add ".[ml]" to bake in faster-whisper/PySceneDetect.
RUN pip install --no-cache-dir -e ".[otel]"

ENV AI_USE_STUBS=true \
    PYTHONUNBUFFERED=1

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
