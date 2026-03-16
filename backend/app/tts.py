from __future__ import annotations
from dataclasses import dataclass
from pathlib import Path
import shutil
import subprocess
import uuid


@dataclass(frozen=True)
class TtsConfig:
    backend: str  # auto|say|pyttsx3|none
    voice: str | None
    rate: int | None


class TtsSynthesizer:
    def __init__(self, cfg: TtsConfig, out_dir: Path) -> None:
        self.cfg = cfg
        self.out_dir = out_dir

    def _pick_backend(self) -> str:
        b = (self.cfg.backend or "auto").lower()
        if b in ("none", "say", "pyttsx3"):
            return b
        # auto
        if shutil.which("say"):
            return "say"
        try:
            import pyttsx3  # noqa: F401

            return "pyttsx3"
        except Exception:
            return "none"

    def synthesize(self, text: str) -> str | None:
        backend = self._pick_backend()
        if backend == "none":
            return None

        # Keep audio short and safe for repeated calls.
        text = (text or "").strip()
        if not text:
            return None
        if len(text) > 800:
            text = text[:800].rsplit(" ", 1)[0] + "..."

        file_id = str(uuid.uuid4())

        if backend == "say":
            out_name = f"{file_id}.aiff"
            out_path = self.out_dir / out_name
            cmd = ["say", "-o", str(out_path)]
            if self.cfg.voice:
                cmd.extend(["-v", self.cfg.voice])
            cmd.append(text)
            subprocess.run(cmd, check=True)
            return out_name

        # pyttsx3
        out_name = f"{file_id}.wav"
        out_path = self.out_dir / out_name
        try:
            import pyttsx3  # type: ignore

            engine = pyttsx3.init()
            if self.cfg.voice:
                engine.setProperty("voice", self.cfg.voice)
            if self.cfg.rate is not None:
                engine.setProperty("rate", int(self.cfg.rate))
            engine.save_to_file(text, str(out_path))
            engine.runAndWait()
            return out_name
        except Exception:
            # If pyttsx3 fails for any reason, don’t fail the whole request.
            try:
                if out_path.exists():
                    out_path.unlink()
            except Exception:
                pass
            return None
