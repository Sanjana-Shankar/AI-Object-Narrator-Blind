from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any
import uuid
import time

from PIL import Image


@dataclass(frozen=True)
class YoloDetection:
    id: str
    label: str
    confidence: float
    # Percent-based box: [left, top, width, height]
    box: tuple[float, float, float, float]
    timestamp: int


class YoloDetector:
    def __init__(self, model_path: str, device: str, conf: float, max_det: int) -> None:
        self.model_path = model_path
        self.device = device
        self.conf = conf
        self.max_det = max_det

        # Lazy import so the app can still start without ultralytics installed
        self._model = None

    def _load(self) -> Any:
        if self._model is not None:
            return self._model
        from ultralytics import YOLO  # type: ignore

        self._model = YOLO(self.model_path)
        return self._model

    def detect(self, image_path: Path) -> list[YoloDetection]:
        model = self._load()

        with Image.open(image_path) as im:
            im = im.convert("RGB")
            width, height = im.size

        # Ultralytics accepts file paths directly.
        results = model.predict(
            source=str(image_path),
            conf=self.conf,
            device=self.device,
            verbose=False,
            max_det=self.max_det,
        )
        if not results:
            return []

        r0 = results[0]
        names = getattr(model, "names", None) or getattr(r0, "names", None) or {}

        detections: list[YoloDetection] = []
        now_ms = int(time.time() * 1000)

        boxes = getattr(r0, "boxes", None)
        if boxes is None:
            return []

        # xyxy is Nx4 in pixel units.
        xyxy = getattr(boxes, "xyxy", None)
        confs = getattr(boxes, "conf", None)
        clss = getattr(boxes, "cls", None)
        if xyxy is None or confs is None or clss is None:
            return []

        xyxy_np = xyxy.cpu().numpy()
        conf_np = confs.cpu().numpy()
        cls_np = clss.cpu().numpy()

        for i in range(len(xyxy_np)):
            x1, y1, x2, y2 = [float(v) for v in xyxy_np[i]]
            conf = float(conf_np[i])
            cls_id = int(cls_np[i])
            label = str(names.get(cls_id, cls_id))

            left = max(0.0, min(100.0, (x1 / width) * 100.0))
            top = max(0.0, min(100.0, (y1 / height) * 100.0))
            w = max(0.0, min(100.0, ((x2 - x1) / width) * 100.0))
            h = max(0.0, min(100.0, ((y2 - y1) / height) * 100.0))

            detections.append(
                YoloDetection(
                    id=str(uuid.uuid4()),
                    label=label,
                    confidence=conf,
                    box=(left, top, w, h),
                    timestamp=now_ms,
                )
            )

        # Sort by confidence high -> low.
        detections.sort(key=lambda d: d.confidence, reverse=True)
        return detections[: self.max_det]

