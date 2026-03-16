from __future__ import annotations

from pydantic import BaseModel, Field


class DetectedObject(BaseModel):
    id: str
    label: str
    confidence: float = Field(ge=0.0, le=1.0)
    # Percent-based box: [left, top, width, height]
    box: tuple[float, float, float, float]
    timestamp: int


class AnalyzeResponse(BaseModel):
    objects: list[DetectedObject]
    transcript: str
    audio_url: str | None = None

