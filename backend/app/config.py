from __future__ import annotations

from dataclasses import dataclass
import os


def _env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name)
    if value is None:
        return default
    value = value.strip()
    return value if value else default


def _env_float(name: str, default: float) -> float:
    raw = _env(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _env_int(name: str, default: int) -> int:
    raw = _env(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _env_int_or_none(name: str) -> int | None:
    raw = _env(name)
    if raw is None:
        return None
    try:
        return int(raw)
    except ValueError:
        return None


@dataclass(frozen=True)
class Settings:
    cors_origins: list[str]

    yolo_model_path: str
    yolo_device: str
    yolo_conf: float
    yolo_max_detections: int

    nemotron_base_url: str | None
    nemotron_api_key: str | None
    nemotron_model: str | None
    nemotron_timeout_s: float

    tts_backend: str
    tts_voice: str | None
    tts_rate: int | None


def get_settings() -> Settings:
    # Vite dev server in this repo defaults to http://localhost:8080
    cors = _env("CORS_ORIGINS", "http://localhost:8080") or "http://localhost:8080"
    cors_origins = [o.strip() for o in cors.split(",") if o.strip()]

    return Settings(
        cors_origins=cors_origins,
        yolo_model_path=_env("YOLO_MODEL_PATH", "yolov8n.pt") or "yolov8n.pt",
        yolo_device=_env("YOLO_DEVICE", "cpu") or "cpu",
        yolo_conf=_env_float("YOLO_CONF", 0.25),
        yolo_max_detections=_env_int("YOLO_MAX_DETECTIONS", 20),
        nemotron_base_url=_env("NEMOTRON_BASE_URL"),
        nemotron_api_key=_env("NEMOTRON_API_KEY"),
        nemotron_model=_env("NEMOTRON_MODEL"),
        nemotron_timeout_s=_env_float("NEMOTRON_TIMEOUT_S", 45.0),
        tts_backend=(_env("TTS_BACKEND", "auto") or "auto").lower(),
        tts_voice=_env("TTS_VOICE"),
        tts_rate=_env_int_or_none("TTS_RATE"),
    )
