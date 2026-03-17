from __future__ import annotations

from dataclasses import dataclass
import time
from threading import Lock

from .schemas import DetectedObject


@dataclass(frozen=True)
class SceneContext:
    request_id: str
    created_at_ms: int
    objects: list[DetectedObject]
    narration: str
    prompt: str | None


class ContextStore:
    def __init__(self, ttl_s: int = 30 * 60) -> None:
        self.ttl_s = int(ttl_s)
        self._lock = Lock()
        self._by_id: dict[str, SceneContext] = {}

    def set(self, ctx: SceneContext) -> None:
        with self._lock:
            self._by_id[ctx.request_id] = ctx
            self._gc_locked()

    def get(self, request_id: str) -> SceneContext | None:
        with self._lock:
            self._gc_locked()
            return self._by_id.get(request_id)

    def _gc_locked(self) -> None:
        now_s = time.time()
        cutoff_s = now_s - float(self.ttl_s)
        to_delete: list[str] = []
        for rid, ctx in self._by_id.items():
            if (ctx.created_at_ms / 1000.0) < cutoff_s:
                to_delete.append(rid)
        for rid in to_delete:
            self._by_id.pop(rid, None)

