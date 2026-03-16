from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class StoragePaths:
    root: Path
    uploads: Path
    audio: Path


def get_storage_paths() -> StoragePaths:
    root = Path(__file__).resolve().parents[1] / "storage"
    uploads = root / "uploads"
    audio = root / "audio"
    uploads.mkdir(parents=True, exist_ok=True)
    audio.mkdir(parents=True, exist_ok=True)
    return StoragePaths(root=root, uploads=uploads, audio=audio)

