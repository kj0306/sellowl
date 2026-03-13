"""
ai_provider.py — AI Provider Abstraction

To swap providers: change AI_PROVIDER in your environment variables.
  AI_PROVIDER=groq          ← current (free)
  AI_PROVIDER=aws_bedrock   ← future AWS Bedrock

The provider is instantiated lazily (on first use), so a missing API key
causes a clean 503 error response — NOT a server crash on startup.
"""

import os
import json
import requests

CATEGORIES = ["Furniture", "Electronics", "Books", "Clothing", "Kitchen", "Sports", "Other"]
CONDITIONS  = ["Like New", "Good", "Fair"]

def _strip_fences(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1] if len(parts) >= 2 else text
        if text.startswith("json"):
            text = text[4:]
    return text.strip()

def _parse_json(raw: str) -> dict:
    return json.loads(_strip_fences(raw))


# ── Groq (free, default) ─────────────────────────────────────────

class GroqProvider:
    BASE_URL     = "https://api.groq.com/openai/v1/chat/completions"
    VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
    TEXT_MODEL   = "llama-3.1-8b-instant"

    def _key(self):
        key = os.environ.get("GROQ_API_KEY")
        if not key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. "
                "Add it in Render → your service → Environment."
            )
        return key

    def _call(self, model, messages, max_tokens=400):
        resp = requests.post(
            self.BASE_URL,
            headers={"Authorization": f"Bearer {self._key()}", "Content-Type": "application/json"},
            json={"model": model, "messages": messages, "max_tokens": max_tokens, "temperature": 0.3},
            timeout=25,
        )
        if not resp.ok:
            err = resp.json().get("error", {}).get("message", resp.text)
            raise RuntimeError(f"Groq API error: {err}")
        return resp.json()["choices"][0]["message"]["content"]

    def scan_image(self, image_url: str) -> dict:
        prompt = (
            "Look at this image and return ONLY a JSON object — no markdown, no extra text:\n"
            '{"title":"short catchy title, max 60 chars",'
            '"description":"2-3 sentences about the item, condition, and features",'
            f'"category":"one of: {", ".join(CATEGORIES)}",'
            f'"condition":"one of: {", ".join(CONDITIONS)}"}}'
        )
        raw = self._call(self.VISION_MODEL, [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": image_url}},
            ],
        }])
        return _parse_json(raw)

    def suggest_price(self, title, description, category, condition) -> dict:
        prompt = (
            "University student secondhand marketplace pricing.\n"
            f"Item: {title}\nDescription: {description or 'not provided'}\n"
            f"Category: {category}\nCondition: {condition}\n\n"
            "Return ONLY JSON, no markdown:\n"
            '{"price_range":{"min":N,"max":N},"suggested_price":N,"reasoning":"one short sentence"}\n'
            "Rules: 30-60% of retail; Like New→near max, Fair→near min; "
            "round to nearest $5 if over $20."
        )
        raw = self._call(self.TEXT_MODEL, [{"role": "user", "content": prompt}], max_tokens=200)
        return _parse_json(raw)


# ── AWS Bedrock (future) ─────────────────────────────────────────
# To activate:
#   1. Set AI_PROVIDER=aws_bedrock
#   2. Add AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION to Render env
#   3. Add boto3>=1.34.0 to requirements.txt and uncomment below
#
# class AWSBedrockProvider:
#     VISION_MODEL = "us.amazon.nova-pro-v1:0"
#     TEXT_MODEL   = "us.amazon.nova-lite-v1:0"
#
#     def __init__(self):
#         import boto3
#         self.client = boto3.client(
#             "bedrock-runtime",
#             region_name=os.environ.get("AWS_REGION", "us-east-1"),
#             aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
#             aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
#         )
#     def scan_image(self, image_url): ...
#     def suggest_price(self, title, description, category, condition): ...


# ── Registry ─────────────────────────────────────────────────────

_REGISTRY = {
    "groq": GroqProvider,
    # "aws_bedrock": AWSBedrockProvider,
}


class _LazyProvider:
    """
    Wraps the real provider with lazy instantiation.
    The server starts fine even if GROQ_API_KEY is missing.
    The error only surfaces when an AI route is actually called.
    """
    def __init__(self, provider_key):
        self._key = provider_key
        self._instance = None

    def _get(self):
        if self._instance is None:
            if self._key not in _REGISTRY:
                raise RuntimeError(
                    f"Unknown AI_PROVIDER: '{self._key}'. "
                    f"Valid options: {list(_REGISTRY.keys())}"
                )
            self._instance = _REGISTRY[self._key]()
        return self._instance

    def scan_image(self, image_url):
        return self._get().scan_image(image_url)

    def suggest_price(self, title, description, category, condition):
        return self._get().suggest_price(title, description, category, condition)


_provider_key = os.environ.get("AI_PROVIDER", "groq").lower()
ai = _LazyProvider(_provider_key)
