# ai-service/core/emotion.py
#
# Emotion classification — LOCAL inference using transformers pipeline.
#
# Model execution: local inference using the transformers library is used instead
# of a remote HuggingFace Inference API to eliminate external network dependencies,
# DNS resolution issues, and network latency.
#
# Model: j-hartmann/emotion-english-distilroberta-base
#   - 7 emotion labels: joy, sadness, anger, fear, surprise, disgust, neutral
#   - ~125 MB download, cached in ~/.cache/huggingface after first run
#   - CPU inference: ~30–80 ms per message (acceptable)

import os
import logging
import traceback
import requests
from typing import Dict

logger = logging.getLogger(__name__)

MODEL_NAME = "j-hartmann/emotion-english-distilroberta-base"
NEUTRAL_EMOTION: Dict = {"label": "neutral", "score": 0.5, "raw_scores": {}}


def classify_emotion(text: str) -> Dict:
    """
    Classify the dominant emotion in a text string using Hugging Face Inference API.

    Returns:
        {
            "label":      str,          # e.g. "sadness"
            "score":      float,        # confidence 0.0–1.0
            "raw_scores": dict[str, float]
        }

    Falls back to NEUTRAL_EMOTION on any failure so the chat pipeline
    always continues even if emotion classification is unavailable.
    """
    hf_token = os.getenv("HF_API_TOKEN", "").strip()
    if not hf_token:
        # Fallback to HF_API_KEY
        hf_token = os.getenv("HF_API_KEY", "").strip()

    if not hf_token:
        logger.warning("[emotion] HF_API_TOKEN is not set — defaulting to neutral")
        return NEUTRAL_EMOTION

    url = f"https://router.huggingface.co/hf-inference/models/{MODEL_NAME}"
    headers = {"Authorization": f"Bearer {hf_token}"}
    payload = {
        "inputs": text,
        "options": {"wait_for_model": True}
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        if response.status_code != 200:
            logger.warning(
                "[emotion] HF API returned status %d: %s — defaulting to neutral",
                response.status_code,
                response.text,
            )
            return NEUTRAL_EMOTION

        results = response.json()

        # Hugging Face Inference API returns [[{"label": "joy", "score": 0.92}, ...]]
        if isinstance(results, list) and results and isinstance(results[0], list):
            results = results[0]

        if not isinstance(results, list) or not results:
            logger.warning("[emotion] Unexpected empty result format from HF API — defaulting to neutral")
            return NEUTRAL_EMOTION

        # Filter valid items
        valid_results = []
        for item in results:
            if isinstance(item, dict) and "label" in item and "score" in item:
                valid_results.append(item)

        if not valid_results:
            return NEUTRAL_EMOTION

        # Sort by score descending; pick dominant
        valid_results.sort(key=lambda x: x["score"], reverse=True)
        dominant = valid_results[0]

        raw_scores = {
            item["label"].lower(): round(item["score"], 4)
            for item in valid_results
        }

        return {
            "label":      dominant["label"].lower(),
            "score":      round(dominant["score"], 4),
            "raw_scores": raw_scores,
        }

    except Exception:
        logger.error("[emotion] classify_emotion failed:\n%s", traceback.format_exc())
        return NEUTRAL_EMOTION


def preload_emotion_model() -> None:
    """No-op because the model is served remotely via Hugging Face Inference API."""
    pass
