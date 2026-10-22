import httpx
import json
from config.settings import GROQ_API_KEY, LLM_MODEL, CHAT_TEMP, EXTRACT_TEMP, MAX_TOKENS

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {GROQ_API_KEY}",
    "Content-Type": "application/json",
}

# Fallback models when the primary model is rate-limited
FALLBACK_MODELS = ["llama-3.1-8b-instant", "gemma-2-9b-it"]


async def _try_stream(client, model, messages):
    """Attempt a streaming call with a given model. Returns (response, error)."""
    payload = {
        "model": model,
        "messages": messages,
        "temperature": CHAT_TEMP,
        "max_tokens": MAX_TOKENS,
        "stream": True,
    }
    resp = await client.send(client.build_request("POST", GROQ_URL, headers=HEADERS, json=payload), stream=True)
    if resp.status_code == 429:
        await resp.aclose()
        return None
    return resp


async def stream_chat(messages: list):
    """Stream tokens from Groq for normal chat responses."""
    models_to_try = [LLM_MODEL] + FALLBACK_MODELS

    async with httpx.AsyncClient(timeout=60, verify=True) as client:
        resp = None
        for model in models_to_try:
            resp = await _try_stream(client, model, messages)
            if resp is not None:
                break

        if resp is None:
            yield "AI service is temporarily at capacity. Please try again in a few minutes."
            return

        try:
            if resp.status_code != 200:
                body = await resp.aread()
                try:
                    err = json.loads(body)
                    msg = err.get("error", {}).get("message", "AI service error")
                except Exception:
                    msg = f"AI service returned status {resp.status_code}"
                yield msg
                return
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                data = line[6:]
                if data == "[DONE]":
                    break
                try:
                    chunk = json.loads(data)
                    token = chunk["choices"][0]["delta"].get("content", "")
                    if token:
                        yield token
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue
        finally:
            await resp.aclose()


async def call_sync(messages: list) -> str:
    """Non-streaming call for structured extraction (JSON parsing)."""
    models_to_try = [LLM_MODEL] + FALLBACK_MODELS

    async with httpx.AsyncClient(timeout=30, verify=True) as client:
        for model in models_to_try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": EXTRACT_TEMP,
                "max_tokens": MAX_TOKENS,
                "stream": False,
            }
            resp = await client.post(GROQ_URL, headers=HEADERS, json=payload)
            if resp.status_code == 429:
                continue
            if resp.status_code != 200:
                raise Exception(f"Groq API error ({resp.status_code}): {resp.text[:200]}")
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    raise Exception("All models are rate-limited. Please try again later.")
