"""Importing this package registers all built-in stage plugins with the registry."""
from . import analyze, captions, media, metadata, transcribe  # noqa: F401

__all__ = ["media", "transcribe", "analyze", "captions", "metadata"]
