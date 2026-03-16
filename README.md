# AI-Object-Narrator-Blind
AI Object Narrator is a web application that helps blind and low-vision users understand their surroundings. Using a webcam, YOLO object detection, and NVIDIA-accelerated AI, the system identifies nearby objects and narrates them in real time. It converts visual scenes into clear spoken descriptions, improving accessibility, situational awareness.

## Backend (YOLO + Nemotron + TTS)

The backend lives in `backend/` and exposes `POST /analyze` which accepts an image upload and returns:

- `objects`: YOLO detections (label, confidence, box in % units)
- `transcript`: short narration (Nemotron if configured, otherwise a local fallback)
- `audio_url`: optional synthesized speech audio (served from `GET /static/audio/...`)

Quick start:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[tts]"
uvicorn app.main:app --reload --port 8000
```

Test it with curl:

```bash
curl -s -X POST "http://localhost:8000/analyze" \
  -F "image=@/path/to/photo.jpg" \
  -F "prompt=Describe the scene briefly for a blind user" | jq .
```

Nemotron setup (optional): set `NEMOTRON_BASE_URL`, `NEMOTRON_MODEL`, and `NEMOTRON_API_KEY` in your environment.
