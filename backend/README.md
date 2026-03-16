# Backend (FastAPI)

This backend exposes an image analysis API:

- Runs YOLO object detection on an uploaded image.
- Uses an NVIDIA Nemotron endpoint (OpenAI-compatible) to generate an accessible scene narration.
- Optionally synthesizes narration audio (TTS) and serves it as a static file.

## Run

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[tts]"
uvicorn app.main:app --reload --port 8000
```

Frontend can call `http://localhost:8000/analyze`.

Quick curl check:

```bash
curl -s -X POST "http://localhost:8000/analyze" \
  -F "image=@/path/to/photo.jpg" \
  -F "prompt=Describe this for a blind user" | python -m json.tool
```

## Environment

You can set variables in your shell, or create `backend/.env` (ignored by git).

- `CORS_ORIGINS`: Comma-separated origins. Default: `http://localhost:8080`
- `YOLO_MODEL_PATH`: Path/name for Ultralytics YOLO model. Default: `yolov8n.pt`
- `YOLO_DEVICE`: `cpu`, `0`, `0,1`, etc. Default: `cpu`
- `YOLO_CONF`: Confidence threshold (0-1). Default: `0.25`
- `YOLO_MAX_DETECTIONS`: Max detections to return. Default: `20`

Nemotron (optional):

- `NEMOTRON_BASE_URL`: Default `https://integrate.api.nvidia.com/v1`
- `NVIDIA_API_KEY`: NVIDIA Integrate API key (preferred)
- `NEMOTRON_API_KEY`: Alternate name for the same key
- `NEMOTRON_MODEL`: Default `nvidia/nemotron-3-super-120b-a12b`
- `NEMOTRON_TIMEOUT_S`: Default: `45`
- `NEMOTRON_ENABLE_THINKING`: Default: `true`
- `NEMOTRON_REASONING_BUDGET`: Optional integer
- `NEMOTRON_MAX_TOKENS`: Default: `1024`
- `REQUIRE_NEMOTRON`: If `true`, `/analyze` errors if Nemotron is not configured

TTS (optional):

- `TTS_BACKEND`: `auto`, `say`, `pyttsx3`, `none`. Default: `auto`
- `TTS_VOICE`: Voice name (backend-dependent)
- `TTS_RATE`: Integer words-per-minute or backend-specific rate

## API

`POST /analyze` (multipart/form-data)

- `image`: file (required)
- `prompt`: string (optional, user focus prompt)

Response JSON:

```json
{
  "objects": [
    { "id": "...", "label": "person", "confidence": 0.93, "box": [12.3, 10.1, 33.4, 55.2], "timestamp": 1710000000000 }
  ],
  "transcript": "I see ...",
  "audio_url": "/static/audio/<file>.aiff"
}
```
