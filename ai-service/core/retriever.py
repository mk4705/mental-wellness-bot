# ai-service/core/retriever.py
# Hybrid RAG: FAISS dense search + BM25 sparse search fused with Reciprocal Rank Fusion (RRF).
# Prepend the detected emotion to the dense query to bias retrieval toward emotionally relevant content.

import logging
import os
import traceback
from typing import List, Dict

from rank_bm25 import BM25Okapi

from .embeddings import embed, search_faiss, _get_index

logger = logging.getLogger(__name__)

RRF_K       = 60   # RRF constant (original paper value)
RETRIEVAL_K = 8    # candidates from each retriever before fusion
TOP_N       = 3    # final chunks returned after fusion


def format_source_name(source: str) -> str:
    """Convert a knowledge filename into a user-friendly source label."""
    filename = os.path.basename(str(source or "").strip())
    stem, _ = os.path.splitext(filename)
    words = stem.replace("-", " ").replace("_", " ").split()
    return " ".join(word.upper() if word.lower() == "cbt" else word.title() for word in words) or "Unknown Source"


def _get_all_chunks() -> List[Dict]:
    """Return all metadata chunks loaded with the FAISS index."""
    _, metadata = _get_index()
    return metadata


def _dense_search(query: str, k: int) -> List[Dict]:
    """FAISS cosine-similarity search. Returns ranked list of chunk dicts."""
    try:
        query_embedding = embed(query)
        raw_results     = search_faiss(query_embedding, k=k)
    except Exception:
        logger.error("[retriever] Dense search failed:\n%s", traceback.format_exc())
        return []

    results = []
    for rank, (chunk, distance) in enumerate(raw_results):
        source = chunk.get("source", "unknown")
        results.append({
            "source":      source,
            "source_name": format_source_name(source),
            "content":     chunk.get("content", ""),
            "rank":        rank,
            "score":       1.0 / (1.0 + distance),   # L2 distance → similarity
        })
    return results


def _sparse_search(query: str, k: int) -> List[Dict]:
    """
    BM25 keyword search over all knowledge-base chunks.
    Re-initialises BM25Okapi each call — fine for our small KB (~50 chunks).
    For 10 K+ chunks, cache the BM25 object as a module-level singleton.
    """
    chunks = _get_all_chunks()
    if not chunks:
        return []

    try:
        tokenized_corpus = [chunk["content"].lower().split() for chunk in chunks]
        bm25             = BM25Okapi(tokenized_corpus)
        scores           = bm25.get_scores(query.lower().split())
    except Exception:
        logger.error("[retriever] Sparse search failed:\n%s", traceback.format_exc())
        return []

    top_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]

    results = []
    for rank, idx in enumerate(top_indices):
        if scores[idx] > 0:
            source = chunks[idx].get("source", "unknown")
            results.append({
                "source":      source,
                "source_name": format_source_name(source),
                "content":     chunks[idx].get("content", ""),
                "rank":        rank,
                "score":       float(scores[idx]),
            })
    return results


def _rrf_fusion(dense: List[Dict], sparse: List[Dict]) -> List[Dict]:
    """
    Merge two ranked lists with Reciprocal Rank Fusion.
    Uses the first 100 chars of content as the deduplication key.
    """
    fused_scores: Dict[str, float] = {}
    chunk_map:    Dict[str, Dict]  = {}

    for result_list in (dense, sparse):
        for item in result_list:
            key       = item["content"][:100]
            rrf_score = 1.0 / (RRF_K + item["rank"] + 1)
            fused_scores[key]  = fused_scores.get(key, 0.0) + rrf_score
            chunk_map[key]     = item

    sorted_keys = sorted(fused_scores, key=lambda k: fused_scores[k], reverse=True)

    fused = []
    for key in sorted_keys:
        entry              = chunk_map[key].copy()
        entry["rrf_score"] = round(fused_scores[key], 6)
        fused.append(entry)
    return fused


def retrieve(query: str, emotion: str = None, top_n: int = TOP_N) -> List[Dict]:
    """
    Main retrieval entry point.

    Args:
        query:   raw user message
        emotion: detected emotion label (optional); used to augment dense query
        top_n:   number of chunks to return

    Returns:
        List of chunk dicts: {source, source_name, content, rrf_score, ...}
    """
    augmented = f"{emotion}: {query}" if emotion and emotion != "neutral" else query

    logger.debug("[retriever] Dense query: '%s'", augmented[:80])

    dense  = _dense_search(augmented, k=RETRIEVAL_K)
    sparse = _sparse_search(query, k=RETRIEVAL_K)

    logger.debug("[retriever] Dense=%d  Sparse=%d", len(dense), len(sparse))

    fused = _rrf_fusion(dense, sparse)
    top   = fused[:top_n]

    logger.debug("[retriever] Returning %d fused chunks", len(top))
    return top
