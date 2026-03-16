# AI Object Narrator for the Blind

AI Object Narrator is an accessibility-focused web application designed to help **blind and low-vision users understand their surroundings**. The system uses a webcam feed, **YOLO-based object detection**, and **AI-generated narration** to convert visual scenes into **clear spoken descriptions in real time**.

By identifying nearby objects and narrating them through speech, the application improves **situational awareness and environmental understanding** for visually impaired users.

---

# Features

- Real-time **Object Detection** using YOLO
- **Scene narration generation** using NVIDIA Nemotron (with a fallback narration system if Nemotron is not configured)
- **Text-to-Speech (TTS)** audio narration
- **Accessible audio output** for visually impaired users
- **REST API backend** for image analysis
- **GPU acceleration support** when available

---

# System Architecture

The system follows a pipeline that converts visual input into narrated audio.


Webcam / Image Input
│
▼
YOLO Object Detection
│
▼
Detected Objects + Scene Context
│
▼
Nemotron LLM (Scene Description Generation)
│
▼
Text-to-Speech (TTS)
│
▼
Spoken Narration Output


---

# Backend Overview

The backend is located in:


backend/


It exposes a REST API endpoint that processes images and returns detected objects along with a generated narration.

## Endpoint


POST /analyze


## Request

The endpoint accepts **multipart form data**.

| Field | Type | Description |
|------|------|-------------|
| image | file | Image captured from webcam or uploaded by the user |
| prompt | string | Optional instruction for narration generation |

Example prompt:


Describe the scene briefly for a blind user.

---

# API Response

The API returns a JSON response containing detected objects and narration.

```json
{
  "objects": [
    {
      "label": "chair",
      "confidence": 0.93,
      "box": [0.21, 0.32, 0.45, 0.62]
    }
  ],
  "transcript": "There is a chair in front of you and a table slightly to the left.",
  "audio_url": "/static/audio/output_123.wav"
}
Response Fields
Field	Description
objects	YOLO detected objects with bounding boxes
transcript	Generated natural language description of the scene
audio_url	Optional synthesized speech file

Bounding boxes are returned in percentage units relative to the image size.

Logic Flow

The user captures an image from a webcam or uploads a photo.

The image is sent to the backend via POST /analyze.

The backend runs YOLO object detection to identify objects in the scene.

The detected objects are formatted and passed into Nemotron (if configured).

Nemotron generates a short, natural language scene description designed for blind or low-vision users.

The generated text is optionally converted into speech using a TTS engine.

The API returns:

detected objects

narration transcript

generated audio file URL.

If Nemotron is not configured, the system falls back to a local narration generator.

Setup Instructions
1. Navigate to the backend
cd backend
2. Create a virtual environment
python3 -m venv .venv
3. Activate the environment

Mac / Linux:

source .venv/bin/activate

Windows:

.venv\Scripts\activate
4. Install dependencies
pip install -e ".[tts]"
5. Start the server
uvicorn app.main:app --reload --port 8000

The API will be available at:

http://localhost:8000
Testing the API

You can test the endpoint using curl.

curl -s -X POST "http://localhost:8000/analyze" \
  -F "image=@/path/to/photo.jpg" \
  -F "prompt=Describe the scene briefly for a blind user" | jq .
Nemotron Setup (Optional)

Nemotron is used to generate higher-quality scene descriptions.

Set the following environment variables:

export NEMOTRON_BASE_URL=<nemotron_endpoint>
export NEMOTRON_MODEL=<model_name>
export NEMOTRON_API_KEY=<your_api_key>

If these variables are not set, the backend will automatically use a local fallback narration generator.

Technologies Used

Python

FastAPI

YOLO Object Detection

NVIDIA Nemotron LLM

Text-to-Speech (TTS)

Uvicorn

Computer Vision and AI pipelines

Accessibility Goal

The goal of this project is to explore how computer vision and generative AI can improve accessibility for blind and low-vision individuals by transforming visual information into natural language audio descriptions.
