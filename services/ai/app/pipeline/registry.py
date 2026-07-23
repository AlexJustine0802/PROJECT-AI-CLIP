"""Plugin registry — stages register themselves here so new plugins drop in without editing
the orchestrator (marketplace-ready, #17). Import a plugin module and it self-registers."""
from __future__ import annotations

from .base import Stage

_STAGES: dict[str, type[Stage]] = {}


def register(stage_cls: type[Stage]) -> type[Stage]:
    """Class decorator to register a stage plugin by its `name`."""
    if not stage_cls.name or stage_cls.name == "stage":
        raise ValueError(f"Stage {stage_cls.__name__} must define a unique `name`")
    _STAGES[stage_cls.name] = stage_cls
    return stage_cls


def get(name: str) -> type[Stage]:
    return _STAGES[name]


def all_stages() -> dict[str, type[Stage]]:
    return dict(_STAGES)
