from __future__ import annotations

import json
from pathlib import Path
import uuid
import logging

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
logger = logging.getLogger("ai_object_narrator")

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
if settings.nemotron_base_url and settings.nemotron_model and settings.nemotron_api_key:
    nemotron = NemotronClient(
        NemotronConfig(
            base_url=settings.nemotron_base_url,
            api_key=settings.nemotron_api_key,
            model=settings.nemotron_model,
            timeout_s=settings.nemotron_timeout_s,
            enable_thinking=settings.nemotron_enable_thinking,
            reasoning_budget=settings.nemotron_reasoning_budget,
            max_tokens=settings.nemotron_max_tokens,
        )
    )


def _bucket_position(left_pct: float, top_pct: float, w_pct: float, h_pct: float) -> str:
    cx = left_pct + (w_pct / 2.0)
    cy = top_pct + (h_pct / 2.0)
    horiz = "left" if cx < 33.0 else "right" if cx > 66.0 else "center"
    vert = "top" if cy < 33.0 else "bottom" if cy > 66.0 else "middle"
    return f"{vert}-{horiz}"


def _relative_direction(left_pct: float, top_pct: float, w_pct: float, h_pct: float) -> str:
    """
    Turn screen-space box into user-facing direction cues.
    Assumption: user is seated facing the camera/device.
    """
    cx = left_pct + (w_pct / 2.0)
    cy = top_pct + (h_pct / 2.0)

    if cx < 35.0:
        lr = "to your left"
    elif cx > 65.0:
        lr = "to your right"
    else:
        lr = "in front of you"

    if cy < 33.0:
        ud = "higher up"
    elif cy > 70.0:
        ud = "lower down"
    else:
        ud = ""

    return f"{lr}{', ' + ud if ud else ''}"


def _distance_hint(w_pct: float, h_pct: float) -> str:
    """
    Very rough distance proxy from box area.
    Larger boxes are likely closer; smaller boxes likely farther.
    """
    area = max(0.0, w_pct) * max(0.0, h_pct)
    if area >= 900.0:
        return "very close"
    if area >= 450.0:
        return "close"
    if area >= 180.0:
        return "a bit farther"
    return "farther away"


def _fallback_transcript(objs: list[DetectedObject], user_prompt: str | None) -> str:
    if not objs:
        base = "I don't see any clear objects in front of you right now."
    else:
        lines: list[str] = []
        for o in objs[:8]:
            left, top, w, h = o.box
            direction = _relative_direction(left, top, w, h)
            dist = _distance_hint(w, h)
            lines.append(f"{o.label} {direction}, {dist}.")
        base = "Here is what I notice around you: " + " ".join(lines)
    if user_prompt:
        return base + f" You asked: {user_prompt.strip()}"
    return base


def _build_narration_prompt(objs: list[DetectedObject], user_prompt: str | None) -> tuple[str, str]:
    system = (
        "You are an assistive narrator for blind and low-vision users. "
        "The user is seated facing a laptop or device camera. "
        "Given object detections from a camera frame, produce a clear spoken narration that helps the user navigate. "
        "Describe objects relative to the user (for example: in front of you, to your left, to your right, higher up, lower down, close, farther away). "
        "Do NOT say 'on the screen' or reference pixel coordinates. "
        "Keep it under 2-3 short sentences, avoid jargon, and do not invent objects not in the detections. "
        "If detections are sparse or uncertain, say so plainly. "
        "If multiple instances of the same label exist, summarize."
    )
    detections = [
        {
            "label": o.label,
            "confidence": round(o.confidence, 3),
            "box_percent": [round(v, 2) for v in o.box],
            "relative_direction": _relative_direction(*o.box),
            "distance_hint": _distance_hint(o.box[2], o.box[3]),
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
    language: str | None = Form(default=None),
) -> AnalyzeResponse:
    if not image.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    # Basic content-type guard; still attempt processing if missing.
    if image.content_type and not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    upload_id = str(uuid.uuid4())
    request_id = upload_id
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
    narration_source = "fallback"
    if nemotron is None and settings.require_nemotron:
        raise HTTPException(status_code=500, detail="Nemotron is required but not configured (set NVIDIA_API_KEY).")

    if nemotron is not None:
        system, user = _build_narration_prompt(objects, prompt)
        lang = (language or "").strip()
        if lang:
            system = system + f" Respond in {lang}."
        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        try:
            # OpenAI SDK streaming is synchronous; run it in a thread.
            import anyio

            transcript = await anyio.to_thread.run_sync(lambda: nemotron.narrate(messages=messages))
            if transcript:
                narration_source = "nemotron"
        except Exception as e:
            transcript = ""
            if settings.require_nemotron:
                raise HTTPException(status_code=502, detail=f"Nemotron call failed: {e}")
    elif settings.require_nemotron:
        # Redundant safety net: if Nemotron is required, we should never be here.
        raise HTTPException(status_code=500, detail="Nemotron is required but not available.")

    if settings.require_nemotron and not transcript:
        raise HTTPException(status_code=502, detail="Nemotron returned empty narration.")
    if not transcript:
        transcript = _fallback_transcript(objects, prompt)

    audio_url: str | None = None
    try:
        audio_name = tts.synthesize(transcript)
        if audio_name:
            audio_url = f"/static/audio/{audio_name}"
    except Exception:
        audio_url = None

    logger.info(
        "analyze request_id=%s objects=%d narration_source=%s nemotron=%s",
        request_id,
        len(objects),
        narration_source,
        settings.nemotron_model if narration_source == "nemotron" else "none",
    )

    return AnalyzeResponse(
        objects=objects,
        transcript=transcript,
        audio_url=audio_url,
        narration_source=narration_source,
        nemotron_model=settings.nemotron_model if narration_source == "nemotron" else None,
        request_id=request_id,
    )
