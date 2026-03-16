from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from openai import OpenAI


@dataclass(frozen=True)
class NemotronConfig:
    base_url: str
    api_key: str
    model: str
    timeout_s: float
    enable_thinking: bool
    reasoning_budget: int | None
    max_tokens: int


class NemotronClient:
    """
    NVIDIA Nemotron via NVIDIA Integrate (OpenAI-compatible).

    This intentionally follows the NVIDIA sample pattern:
      client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key="...")
      client.chat.completions.create(..., stream=True, extra_body={...})
    """

    def __init__(self, cfg: NemotronConfig) -> None:
        self.cfg = cfg
        self.client = OpenAI(base_url=cfg.base_url, api_key=cfg.api_key, timeout=cfg.timeout_s)

    def narrate(self, *, messages: list[dict[str, str]]) -> str:
        extra_body: dict[str, object] = {}
        if self.cfg.enable_thinking:
            chat_template_kwargs: dict[str, object] = {"enable_thinking": True}
            extra_body["chat_template_kwargs"] = chat_template_kwargs
            if self.cfg.reasoning_budget is not None:
                extra_body["reasoning_budget"] = int(self.cfg.reasoning_budget)

        stream = self.client.chat.completions.create(
            model=self.cfg.model,
            messages=messages,
            temperature=1,
            top_p=0.95,
            max_tokens=int(self.cfg.max_tokens),
            extra_body=extra_body or None,
            stream=True,
        )

        out_parts: list[str] = []
        for chunk in stream:
            if not getattr(chunk, "choices", None):
                continue
            delta = chunk.choices[0].delta
            content = getattr(delta, "content", None)
            if content is not None:
                out_parts.append(str(content))
        return "".join(out_parts).strip()

