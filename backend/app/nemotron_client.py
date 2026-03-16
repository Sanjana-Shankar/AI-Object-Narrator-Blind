from __future__ import annotations

import json
from dataclasses import dataclass

import httpx


@dataclass(frozen=True)
class NemotronConfig:
    base_url: str
    api_key: str | None
    model: str
    timeout_s: float


class NemotronClient:
    """
    Minimal OpenAI-compatible Chat Completions client.

    Many NVIDIA NIM deployments expose an OpenAI-compatible surface at:
      POST {base_url}/v1/chat/completions
    """

    def __init__(self, cfg: NemotronConfig) -> None:
        self.cfg = cfg

    async def narrate(self, *, system: str, user: str) -> str:
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self.cfg.api_key:
            headers["Authorization"] = f"Bearer {self.cfg.api_key}"

        payload = {
            "model": self.cfg.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "temperature": 0.4,
            "max_tokens": 220,
        }

        base = self.cfg.base_url.rstrip("/")
        # Accept either ".../v1" or root base URLs.
        if base.endswith("/v1"):
            url = base + "/chat/completions"
        else:
            url = base + "/v1/chat/completions"
        timeout = httpx.Timeout(self.cfg.timeout_s)

        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, headers=headers, content=json.dumps(payload))
            resp.raise_for_status()
            data = resp.json()

        choices = data.get("choices") or []
        if not choices:
            return ""
        msg = choices[0].get("message") or {}
        content = msg.get("content")
        return content.strip() if isinstance(content, str) else ""
