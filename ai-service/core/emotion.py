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

import logging
import traceback
from typing import Dict

logger = logging.getLogger(__name__)

# Singleton pipeline loaded once on first call and cached
_pipeline = None
_pipeline_failed = False   # set True if loading fails; avoids retry spam

MODEL_NAME = "j-hartmann/emotion-english-distilroberta-base"
NEUTRAL_EMOTION: Dict = {"label": "neutral", "score": 0.5, "raw_scores": {}}


def _get_pipeline():
    """
    Load the transformers text-classification pipeline on first call.
    Returns None if loading fails (caller falls back to neutral).
    """
    global _pipeline, _pipeline_failed

    if _pipeline is not None:
        return _pipeline

    if _pipeline_failed:
        return None   # don't retry after a hard failure

    try:
        # Import here so a missing `transformers` package doesn't crash
        # the whole service — it degrades gracefully to neutral emotion.
        from transformers import pipeline as hf_pipeline

        logger.info("[emotion] Loading local model: %s", MODEL_NAME)
        _pipeline = hf_pipeline(
            task="text-classification",
            model=MODEL_NAME,
            top_k=None,
            truncation=True,
        )
        logger.info("[emotion] Model loaded")
        return _pipeline

    except Exception:
        _pipeline_failed = True
        logger.error(
            "[emotion] Failed to load local model — emotion will default to neutral.\n%s",
            traceback.format_exc(),
        )
        return None


def classify_emotion(text: str) -> Dict:
    """
    Classify the dominant emotion in a text string.

    Returns:
        {
            "label":      str,          # e.g. "sadness"
            "score":      float,        # confidence 0.0–1.0
            "raw_scores": dict[str, float]
        }

    Falls back to NEUTRAL_EMOTION on any failure so the chat pipeline
    always continues even if emotion classification is unavailable.
    """
    pipe = _get_pipeline()
    if pipe is None:
        logger.warning("[emotion] Pipeline unavailable — returning neutral fallback")
        return NEUTRAL_EMOTION

    try:
        # pipeline() returns [[{"label": "joy", "score": 0.92}, ...]]
        results = pipe(text)

        # Unwrap nested list
        if isinstance(results, list) and results and isinstance(results[0], list):
            results = results[0]

        if not results:
            return NEUTRAL_EMOTION

        # Sort by score descending; pick dominant
        results.sort(key=lambda x: x["score"], reverse=True)
        dominant = results[0]

        raw_scores = {
            item["label"].lower(): round(item["score"], 4)
            for item in results
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
    """
    Eagerly load the emotion model during service startup.
    Called from main.py lifespan so the first request isn't slow.
    """
    _get_pipeline()
