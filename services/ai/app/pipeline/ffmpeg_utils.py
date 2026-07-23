"""Thin ffmpeg/ffprobe helpers. All shell-outs are guarded; callers fall back to stubs when
the binaries are missing or AI_USE_STUBS is on."""
from __future__ import annotations

import json
import shutil
import subprocess
from typing import Any


def has_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None and shutil.which("ffprobe") is not None


def ffprobe(path: str) -> dict[str, Any]:
    """Return the parsed ffprobe JSON for a media file."""
    out = subprocess.run(
        [
            "ffprobe", "-v", "quiet", "-print_format", "json",
            "-show_format", "-show_streams", path,
        ],
        capture_output=True, text=True, check=True,
    )
    return json.loads(out.stdout)


def run_ffmpeg(args: list[str]) -> None:
    """Run ffmpeg with the given args (input/output included). Raises on failure."""
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *args], check=True)


def extract_audio(src: str, dst_wav: str, sample_rate: int = 16000) -> None:
    run_ffmpeg(["-i", src, "-vn", "-ac", "1", "-ar", str(sample_rate), dst_wav])


# Aspect ratio -> (w, h) for a given short-side resolution.
ASPECT_DIMS = {
    "9:16": lambda p: (int(p * 9 / 16), p),
    "16:9": lambda p: (int(p * 16 / 9), p),
    "1:1": lambda p: (p, p),
    "4:5": lambda p: (int(p * 4 / 5), p),
}


def crop_and_scale(src: str, dst: str, start: float, end: float, aspect: str, height: int) -> None:
    """Cut [start,end] and reframe to the target aspect ratio (center smart-crop)."""
    w, h = ASPECT_DIMS.get(aspect, ASPECT_DIMS["9:16"])(height)
    # scale to cover, then center-crop to exact target — the "smart crop" default.
    vf = f"scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h}"
    run_ffmpeg([
        "-ss", str(start), "-to", str(end), "-i", src,
        "-vf", vf, "-c:a", "aac", "-c:v", "libx264", "-preset", "veryfast", dst,
    ])
