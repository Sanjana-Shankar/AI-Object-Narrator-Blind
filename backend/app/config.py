from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path

from dotenv import load_dotenv


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


def _env_bool(name: str, default: bool) -> bool:
    raw = _env(name)
    if raw is None:
        return default
    v = raw.strip().lower()
    if v in ("1", "true", "t", "yes", "y", "on"):
        return True
    if v in ("0", "false", "f", "no", "n", "off"):
        return False
    return default


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
    nemotron_enable_thinking: bool
    nemotron_reasoning_budget: int | None
    nemotron_max_tokens: int
    require_nemotron: bool

    tts_backend: str
    tts_voice: str | None
    tts_rate: int | None


def get_settings() -> Settings:
    # Load backend/.env if present. Do not override actual environment variables.
    dotenv_path = Path(__file__).resolve().parents[1] / ".env"
    load_dotenv(dotenv_path=dotenv_path, override=False)

    # Include local web + Capacitor local origins by default.
    cors_default = "http://localhost:8080,http://localhost,https://localhost,capacitor://localhost"
    cors = _env("CORS_ORIGINS", cors_default) or cors_default
    cors_origins = [o.strip() for o in cors.split(",") if o.strip()]

    return Settings(
        cors_origins=cors_origins,
        yolo_model_path=_env("YOLO_MODEL_PATH", "yolov8n.pt") or "yolov8n.pt",
        yolo_device=_env("YOLO_DEVICE", "cpu") or "cpu",
        yolo_conf=_env_float("YOLO_CONF", 0.25),
        yolo_max_detections=_env_int("YOLO_MAX_DETECTIONS", 20),
        nemotron_base_url=_env("NEMOTRON_BASE_URL", "https://integrate.api.nvidia.com/v1"),
        nemotron_api_key=_env("NVIDIA_API_KEY") or _env("NEMOTRON_API_KEY"),
        nemotron_model=_env("NEMOTRON_MODEL", "nvidia/nemotron-3-super-120b-a12b"),
        nemotron_timeout_s=_env_float("NEMOTRON_TIMEOUT_S", 45.0),
        nemotron_enable_thinking=_env_bool("NEMOTRON_ENABLE_THINKING", True),
        nemotron_reasoning_budget=_env_int_or_none("NEMOTRON_REASONING_BUDGET"),
        nemotron_max_tokens=_env_int("NEMOTRON_MAX_TOKENS", 1024),
        require_nemotron=_env_bool("REQUIRE_NEMOTRON", False),
        tts_backend=(_env("TTS_BACKEND", "auto") or "auto").lower(),
        tts_voice=_env("TTS_VOICE"),
        tts_rate=_env_int_or_none("TTS_RATE"),
    )
