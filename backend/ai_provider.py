"""
ai_provider.py — AI Provider Abstraction

Controls which AI backend powers the two AI features:
  - scan_image(image_url) → dict  (title, description, category, condition)
  - suggest_price(title, description, category, condition) → dict (price_range, suggested_price, reasoning)

To swap providers later, change AI_PROVIDER in your environment:
  AI_PROVIDER=groq          ← current (free)
  AI_PROVIDER=aws_bedrock   ← future AWS Bedrock

To add a new provider: implement a class with scan_image() and suggest_price(),
then register it at the bottom of this file.
"""

import os
import json
import requests

# ─────────────────────────────────────────────────────────────────
#  SHARED UTILITIES
# ─────────────────────────────────────────────────────────────────

CATEGORIES = ["Furniture", "Electronics", "Books", "Clothing", "Kitchen", "Sports", "Other"]
CONDITIONS  = ["Like New", "Good", "Fair"]

def _strip_markdown_fences(text: str) -> str:
    """Remove ```json ... ``` wrappers that some models add."""
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1] if len(parts) >= 2 else text
        if text.startswith("json"):
            text = text[4:]
    return text.strip()


def _parse_json(raw: str) -> dict:
    return json.loads(_strip_markdown_fences(raw))


# ─────────────────────────────────────────────────────────────────
#  PROVIDER: Groq (free, current default)
# ─────────────────────────────────────────────────────────────────

class GroqProvider:
    """
    Uses Groq's free API with Llama models.
    - Vision model for image scanning
    - Text model for price suggestions
    Get a free key at https://console.groq.com
    """

    BASE_URL    = "https://api.groq.com/openai/v1/chat/completions"
    VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"  # vision-capable
    TEXT_MODEL   = "llama-3.1-8b-instant"                       # fast, free text model

    def __init__(self):
        self.api_key = os.environ.get("GROQ_API_KEY")
        if not self.api_key:
            raise RuntimeError("GROQ_API_KEY environment variable not set")

    def _call(self, model: str, messages: list, max_tokens: int = 400) -> str:
        resp = requests.post(
            self.BASE_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
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
            '{"title":"short catchy item title, max 60 chars",'
            '"description":"2-3 sentences describing the item, condition, and notable features",'
            f'"category":"one of: {", ".join(CATEGORIES)}",'
            f'"condition":"one of: {", ".join(CONDITIONS)}"}}'
        )
        raw = self._call(
            model=self.VISION_MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}},
                ],
            }],
        )
        return _parse_json(raw)

    def suggest_price(self, title: str, description: str, category: str, condition: str) -> dict:
        prompt = (
            "You are a pricing assistant for a university student secondhand marketplace.\n"
            f"Item: {title}\n"
            f"Description: {description or 'not provided'}\n"
            f"Category: {category}\nCondition: {condition}\n\n"
            "Return ONLY a JSON object — no markdown:\n"
            '{"price_range":{"min":N,"max":N},"suggested_price":N,"reasoning":"one short sentence"}\n'
            "Rules: student prices are 30-60% of retail; Like New → near max, Fair → near min; "
            "suggested_price should be divisible by 5 if over $20."
        )
        raw = self._call(
            model=self.TEXT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200,
        )
        return _parse_json(raw)


# ─────────────────────────────────────────────────────────────────
#  PROVIDER: AWS Bedrock (future — uncomment when ready)
# ─────────────────────────────────────────────────────────────────
#
# To activate:
#   1. Set AI_PROVIDER=aws_bedrock in Render environment
#   2. Add AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION to env
#   3. pip install boto3  (add to requirements.txt)
#   4. Uncomment the class below
#
# class AWSBedrockProvider:
#     """
#     Uses AWS Bedrock — swap model IDs to use Claude, Llama, Titan, etc.
#     """
#     VISION_MODEL = "us.amazon.nova-pro-v1:0"   # or "anthropic.claude-3-5-sonnet-20241022-v2:0"
#     TEXT_MODEL   = "us.amazon.nova-lite-v1:0"   # cheap and fast
#
#     def __init__(self):
#         import boto3
#         self.client = boto3.client(
#             "bedrock-runtime",
#             region_name=os.environ.get("AWS_REGION", "us-east-1"),
#             aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
#             aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
#         )
#
#     def scan_image(self, image_url: str) -> dict:
#         # Download image bytes from URL for Bedrock (it needs bytes, not URLs)
#         import base64, urllib.request
#         with urllib.request.urlopen(image_url) as r:
#             img_bytes = r.read()
#         img_b64 = base64.b64encode(img_bytes).decode()
#
#         body = json.dumps({
#             "messages": [{
#                 "role": "user",
#                 "content": [
#                     {"image": {"format": "jpeg", "source": {"bytes": img_b64}}},
#                     {"text": 'Return ONLY JSON: {"title":"...","description":"...","category":"...","condition":"..."}'},
#                 ],
#             }],
#             "inferenceConfig": {"max_new_tokens": 400, "temperature": 0.3},
#         })
#         resp = self.client.invoke_model(modelId=self.VISION_MODEL, body=body)
#         raw = json.loads(resp["body"].read())["output"]["message"]["content"][0]["text"]
#         return _parse_json(raw)
#
#     def suggest_price(self, title, description, category, condition) -> dict:
#         prompt = f"Student marketplace pricing. Item: {title}, {category}, {condition}. " \
#                  'Return ONLY JSON: {"price_range":{"min":N,"max":N},"suggested_price":N,"reasoning":"..."}'
#         body = json.dumps({
#             "messages": [{"role": "user", "content": [{"text": prompt}]}],
#             "inferenceConfig": {"max_new_tokens": 200, "temperature": 0.3},
#         })
#         resp = self.client.invoke_model(modelId=self.TEXT_MODEL, body=body)
#         raw = json.loads(resp["body"].read())["output"]["message"]["content"][0]["text"]
#         return _parse_json(raw)


# ─────────────────────────────────────────────────────────────────
#  REGISTRY — maps env var value → provider class
# ─────────────────────────────────────────────────────────────────

_REGISTRY = {
    "groq":         GroqProvider,
    # "aws_bedrock":  AWSBedrockProvider,   # uncomment when ready
}

# ─────────────────────────────────────────────────────────────────
#  PUBLIC API — used by app.py
# ─────────────────────────────────────────────────────────────────

_provider_key = os.environ.get("AI_PROVIDER", "groq").lower()

if _provider_key not in _REGISTRY:
    raise RuntimeError(
        f"Unknown AI_PROVIDER: '{_provider_key}'. "
        f"Valid options: {list(_REGISTRY.keys())}"
    )

# Single shared instance (lazy initialisation on first import)
ai = _REGISTRY[_provider_key]()
