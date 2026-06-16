# ai-service/core/embeddings.py
#
# FAISS index loading and local sentence-transformer embeddings.
#
# Design decisions:
# - Model and index are loaded lazily on first call, then cached as module-level
#   singletons — one load per process lifetime.
# - INDEX_PATH and METADATA_PATH are read inside _get_index(), NOT at module
#   level, so load_dotenv() in main.py always runs first.
# - If the index file is missing, we log a clear error and return an empty
#   index so the service starts and degrades gracefully (RAG returns nothing,
#   but the LLM still responds without retrieved context).

import os
import json
import logging
import traceback
from typing import List, Tuple

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = "all-MiniLM-L6-v2"   # 384-dim, fast, good quality
DIMENSION       = 384

_model: SentenceTransformer = None
_index: faiss.Index         = None
_metadata: list             = []


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info("[embeddings] Loading embedding model: %s", EMBEDDING_MODEL)
        _model = SentenceTransformer(EMBEDDING_MODEL)
        logger.info("[embeddings] Embedding model loaded")
    return _model


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


def embed(text: str) -> np.ndarray:
    """Return a normalised 384-dim float32 embedding for `text`."""
    model     = _get_model()
    embedding = model.encode([text], normalize_embeddings=True)
    return embedding[0].astype("float32")


def search_faiss(query_embedding: np.ndarray, k: int = 5) -> List[Tuple[dict, float]]:
    """
    Return the k nearest chunks to `query_embedding`.
    Each result is (metadata_dict, l2_distance).
    Returns [] if the index is empty.
    """
    index, metadata = _get_index()

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
    """Eagerly warm up both the model and the index at service startup."""
    _get_model()
    _get_index()
