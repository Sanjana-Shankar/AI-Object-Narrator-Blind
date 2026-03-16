from __future__ import annotations

import json
from pathlib import Path
import uuid

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import get_settings
from .schemas import AnalyzeResponse, DetectedObject
from .storage import get_storage_paths
from .yolo_detector import YoloDetector
from .nemotron_client import NemotronClient, NemotronConfig
from .tts import TtsSynthesizer, TtsConfig


settings = get_settings()
storage = get_storage_paths()

app = FastAPI(title="AI Object Narrator Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Only expose synthesized audio, not raw uploads.
app.mount("/static/audio", StaticFiles(directory=str(storage.audio)), name="audio")

yolo = YoloDetector(
    model_path=settings.yolo_model_path,
    device=settings.yolo_device,
    conf=settings.yolo_conf,
    max_det=settings.yolo_max_detections,
)

tts = TtsSynthesizer(
    cfg=TtsConfig(
        backend=settings.tts_backend,
        voice=settings.tts_voice,
        rate=settings.tts_rate,
    ),
    out_dir=storage.audio,
)

nemotron: NemotronClient | None = None
if settings.nemotron_base_url and settings.nemotron_model:
    nemotron = NemotronClient(
        NemotronConfig(
            base_url=settings.nemotron_base_url,
            api_key=settings.nemotron_api_key,
            model=settings.nemotron_model,
            timeout_s=settings.nemotron_timeout_s,
        )
    )


def _bucket_position(left_pct: float, top_pct: float, w_pct: float, h_pct: float) -> str:
    cx = left_pct + (w_pct / 2.0)
    cy = top_pct + (h_pct / 2.0)
    horiz = "left" if cx < 33.0 else "right" if cx > 66.0 else "center"
    vert = "top" if cy < 33.0 else "bottom" if cy > 66.0 else "middle"
    return f"{vert}-{horiz}"


def _fallback_transcript(objs: list[DetectedObject], user_prompt: str | None) -> str:
    if not objs:
        base = "I don't see any clear objects in this image."
    else:
        parts: list[str] = []
        for o in objs[:8]:
            pos = _bucket_position(*o.box)
            parts.append(f"{o.label} ({int(o.confidence * 100)}%) at {pos}")
        base = "I see " + ", ".join(parts) + "."
    if user_prompt:
        return base + f" You asked: {user_prompt.strip()}"
    return base


def _build_narration_prompt(objs: list[DetectedObject], user_prompt: str | None) -> tuple[str, str]:
    system = (
        "You are an assistive narrator for blind and low-vision users. "
        "Given object detections from an image, produce a single, clear spoken narration. "
        "Keep it under 2-3 short sentences, avoid jargon, and do not invent objects not in the detections. "
        "If detections are sparse or uncertain, say so plainly."
    )
    detections = [
        {
            "label": o.label,
            "confidence": round(o.confidence, 3),
            "box_percent": [round(v, 2) for v in o.box],
            "position_bucket": _bucket_position(*o.box),
        }
        for o in objs
    ]
    user = {
        "task": "Narrate the scene for the user.",
        "user_prompt": (user_prompt or "").strip() or None,
        "detections": detections,
    }
    return system, json.dumps(user, ensure_ascii=True)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    image: UploadFile = File(...),
    prompt: str | None = Form(default=None),
) -> AnalyzeResponse:
    if not image.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    # Basic content-type guard; still attempt processing if missing.
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    upload_id = str(uuid.uuid4())
    ext = Path(image.filename).suffix or ".jpg"
    upload_path = storage.uploads / f"{upload_id}{ext}"

    data = await image.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    upload_path.write_bytes(data)

    try:
        detections = yolo.detect(upload_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YOLO detection failed: {e}")

    objects = [
        DetectedObject(
            id=d.id,
            label=d.label,
            confidence=d.confidence,
            box=d.box,
            timestamp=d.timestamp,
        )
        for d in detections
    ]

    transcript = ""
    if nemotron is not None:
        system, user = _build_narration_prompt(objects, prompt)
        try:
            transcript = await nemotron.narrate(system=system, user=user)
        except Exception:
            transcript = ""
    if not transcript:
        transcript = _fallback_transcript(objects, prompt)

    audio_url: str | None = None
    try:
        audio_name = tts.synthesize(transcript)
        if audio_name:
            audio_url = f"/static/audio/{audio_name}"
    except Exception:
        audio_url = None

    return AnalyzeResponse(objects=objects, transcript=transcript, audio_url=audio_url)
