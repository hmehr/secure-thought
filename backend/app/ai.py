
import os, re, httpx
from .op_client import OnePasswordConnect

def _first_sentences(text: str, n: int = 3) -> str:
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return " ".join(sentences[:n]) if sentences else text[:180]

def _get_llm_key() -> str | None:
    op = OnePasswordConnect()
    if op.is_configured():
        try:
            return op.get_secret()
        except Exception:
            pass
    return os.getenv("LLM_API_KEY")

def summarize_text(text: str) -> str:
    key = _get_llm_key()
    if not key:
        return _first_sentences(text, 3)

    model = os.getenv("LLM_MODEL", "gpt-4o-mini")
    max_tokens = int(os.getenv("LLM_MAX_TOKENS", "256"))
    try:
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": f"Summarize the following text in 3-4 concise sentences:\n\n{text}"}],
            "max_tokens": max_tokens,
            "temperature": 0.2,
        }
        headers = {"Authorization": f"Bearer {key}"}
        resp = httpx.post("https://api.openai.com/v1/chat/completions", json=payload, headers=headers, timeout=30.0)
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception:
        return _first_sentences(text, 3)
