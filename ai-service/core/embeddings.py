# ai-service/core/embeddings.py
#
# FAISS index loading and Hugging Face embedding inference.
#
# Design decisions:
# - The FAISS index is loaded lazily on first call, then cached as a module-level
#   singleton — one load per process lifetime.
# - Query embeddings are generated remotely by Hugging Face so Render never
#   imports or loads PyTorch/SentenceTransformer.
# - INDEX_PATH and METADATA_PATH are read inside _get_index(), NOT at module
#   level, so load_dotenv() in main.py always runs first.
# - If the index file is missing, we log a clear error and return an empty
#   index so the service starts and degrades gracefully (RAG returns nothing,
#   but the LLM still responds without retrieved context).

import os
import json
import logging
import traceback
from functools import lru_cache
from typing import List, Tuple

import faiss
import numpy as np
import requests

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
DIMENSION = 384
HF_EMBEDDING_URL = (
    "https://router.huggingface.co/hf-inference/models/"
    f"{EMBEDDING_MODEL}/pipeline/feature-extraction"
)
HF_TIMEOUT_SECONDS = 20
HF_MAX_ATTEMPTS = 2

_index: faiss.Index = None
_metadata: list = []



def _get_index() -> Tuple[faiss.Index, list]:
    """
    Load FAISS index and chunk metadata from disk (once per process).
    Returns (index, metadata_list).

    Paths are read from env here — NOT at module level — so that
    load_dotenv() in main.py has already run before we access them.
    """
    global _index, _metadata

    if _index is not None:
        return _index, _metadata

    index_path    = os.getenv("FAISS_INDEX_PATH",    "data/faiss_index/index.faiss")
    metadata_path = os.getenv("FAISS_METADATA_PATH", "data/faiss_index/metadata.json")

    if not os.path.exists(index_path):
        logger.error(
            "[embeddings] FAISS index not found at '%s'. "
            "Run: python scripts/build_index.py",
            index_path,
        )
        _index    = faiss.IndexFlatL2(DIMENSION)
        _metadata = []
        return _index, _metadata

    try:
        logger.info("[embeddings] Loading FAISS index from %s", index_path)
        _index = faiss.read_index(index_path)

        with open(metadata_path, "r", encoding="utf-8") as f:
            _metadata = json.load(f)

        logger.info(
            "[embeddings] Index loaded: %d vectors, %d chunks",
            _index.ntotal,
            len(_metadata),
        )
    except Exception:
        logger.error("[embeddings] Failed to load index:\n%s", traceback.format_exc())
        _index    = faiss.IndexFlatL2(DIMENSION)
        _metadata = []

    return _index, _metadata


def _get_hf_token() -> str:
    """Return the existing Hugging Face token configuration, if present."""
    return (
        os.getenv("HF_API_TOKEN", "").strip()
        or os.getenv("HF_API_KEY", "").strip()
    )


def _parse_embedding(payload: object) -> np.ndarray:
    """Validate Hugging Face feature-extraction output and return one vector."""
    vector = payload
    if (
        isinstance(payload, list)
        and len(payload) == 1
        and isinstance(payload[0], list)
    ):
        vector = payload[0]

    if not isinstance(vector, list) or len(vector) != DIMENSION:
        raise ValueError(
            "Hugging Face returned an embedding with an unexpected shape; "
            f"expected one {DIMENSION}-dimensional vector."
        )

    try:
        embedding = np.asarray(vector, dtype=np.float32)
    except (TypeError, ValueError) as exc:
        raise ValueError("Hugging Face returned a non-numeric embedding.") from exc

    if embedding.shape != (DIMENSION,) or not np.isfinite(embedding).all():
        raise ValueError(
            "Hugging Face returned an invalid "
            f"{DIMENSION}-dimensional embedding."
        )

    # The committed IndexFlatL2 vectors were built with
    # SentenceTransformer.encode(..., normalize_embeddings=True). Preserve that
    # exact unit-vector retrieval behavior for remote query embeddings.
    norm = float(np.linalg.norm(embedding))
    if norm == 0.0:
        raise ValueError("Hugging Face returned a zero-length embedding.")
    return embedding / norm


@lru_cache(maxsize=256)
def _embed_cached(text: str) -> np.ndarray:
    """Request and validate one embedding, retrying only transient HF failures."""
    token = _get_hf_token()
    if not token:
        raise RuntimeError("HF_API_TOKEN is not set in the environment.")

    headers = {"Authorization": f"Bearer {token}"}
    payload = {"inputs": [text], "normalize": True}
    last_error: Exception | None = None

    for attempt in range(1, HF_MAX_ATTEMPTS + 1):
        try:
            response = requests.post(
                HF_EMBEDDING_URL,
                headers=headers,
                json=payload,
                timeout=HF_TIMEOUT_SECONDS,
            )
            if response.status_code == 200:
                return _parse_embedding(response.json())

            message = (
                f"Hugging Face embedding API returned HTTP {response.status_code}: "
                f"{response.text[:300]}"
            )
            if response.status_code < 500 and response.status_code != 429:
                raise RuntimeError(message)
            last_error = RuntimeError(message)
        except (requests.RequestException, ValueError) as exc:
            last_error = exc

        if attempt < HF_MAX_ATTEMPTS:
            logger.warning(
                "[embeddings] Hugging Face embedding attempt %d/%d failed: %s",
                attempt,
                HF_MAX_ATTEMPTS,
                last_error,
            )

    raise RuntimeError("Hugging Face embedding request failed.") from last_error


def embed(text: str) -> np.ndarray:
    """Return a cached, unit-normalized 384-dim float32 Hugging Face embedding."""
    if not isinstance(text, str) or not text.strip():
        raise ValueError("Cannot embed an empty query.")
    try:
        # Copy so callers cannot mutate the cached vector used by future requests.
        return _embed_cached(text.strip()).copy()
    except Exception as exc:
        logger.error("[embeddings] Remote embed failed: %s", exc)
        raise


def search_faiss(query_embedding: np.ndarray, k: int = 5) -> List[Tuple[dict, float]]:
    """
    Return the k nearest chunks to `query_embedding`.
    Each result is (metadata_dict, l2_distance).
    Returns [] if the index is empty.
    """
    index, metadata = _get_index()

    if query_embedding.shape != (DIMENSION,):
        raise ValueError(
            f"Expected a {DIMENSION}-dimensional query embedding, "
            f"received shape {query_embedding.shape}."
        )

    if index.ntotal == 0:
        logger.warning("[embeddings] FAISS index is empty — no results returned")
        return []

    query_2d              = np.expand_dims(query_embedding, axis=0)
    distances, indices    = index.search(query_2d, min(k, index.ntotal))

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        if 0 <= idx < len(metadata):
            results.append((metadata[idx], float(dist)))

    return results


def preload() -> None:
    """Eagerly load the lightweight FAISS index; embeddings remain remote."""
    _get_index()

