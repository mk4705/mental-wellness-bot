# ai-service/main.py
# FastAPI application for the Python AI microservice.

import os
import time
import logging
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv

# load_dotenv must be called before importing core modules that read environment variables
load_dotenv(override=True)

from schemas import (
    ChatRequest, ChatResponse, EmotionResult, RetrievedChunk,
    MemoryExtractionRequest, MemoryExtractionResponse, MemoryFact,
)
from core.emotion import classify_emotion, preload_emotion_model
from core.retriever import retrieve
from core.llm import generate_response, extract_memory
from core.embeddings import preload

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# Startup and shutdown lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI service starting - preloading models...")
    try:
        preload()
        preload_emotion_model()
        logger.info("All models loaded. AI service ready.")
    except Exception:
        logger.error("Model preload failed:\n%s", traceback.format_exc())
    yield
    logger.info("AI service shutting down.")


app = FastAPI(
    title="Mental Wellness Bot — AI Service",
    description="Emotion detection · Hybrid RAG · LLM response generation",
    version="2.0.0",
    lifespan=lifespan,
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service", "version": "2.0.0"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    start = time.time()
    logger.info("[/chat] user_message='%s'", request.user_message[:80])

    emotion_raw = classify_emotion(request.user_message)
    emotion = EmotionResult(
        label=emotion_raw["label"],
        score=emotion_raw["score"],
        raw_scores=emotion_raw.get("raw_scores", {}),
    )
    logger.info("[/chat] emotion=%s (%.2f)", emotion.label, emotion.score)

    chunks = retrieve(query=request.user_message, emotion=emotion.label, top_n=3)
    rag_context = "\n\n".join(
        f"[Source: {c['source_name']}]\n{c['content']}" for c in chunks
    ) if chunks else ""
    retrieved_chunks = [
        RetrievedChunk(
            source=c.get("source", "unknown"),
            source_name=c.get("source_name", "Unknown Source"),
            content=c["content"],
            score=c.get("rrf_score", 0.0),
        )
        for c in chunks
    ]
    logger.info("[/chat] retrieved %d chunks", len(retrieved_chunks))

    reply = generate_response(
        user_message=request.user_message,
        session_history=[m.model_dump() for m in request.session_history],
        rag_context=rag_context,
        long_term_context=request.long_term_context,
        emotion=emotion_raw,
    )

    elapsed_ms = int((time.time() - start) * 1000)
    logger.info("[/chat] completed in %dms", elapsed_ms)

    return ChatResponse(
        reply=reply,
        emotion=emotion,
        retrieved_chunks=retrieved_chunks,
        crisis_flag=False,
        response_time_ms=elapsed_ms,
    )


@app.post("/extract-memory", response_model=MemoryExtractionResponse)
async def memory_extraction(request: MemoryExtractionRequest):
    logger.info(
        "[/extract-memory] session=%s  messages=%d",
        request.session_id,
        len(request.messages),
    )

    messages  = [m.model_dump() for m in request.messages]
    raw_facts = extract_memory(messages)

    facts = [
        MemoryFact(
            memory_type=f["memory_type"],
            content=f["content"],
            confidence=f["confidence"],
        )
        for f in raw_facts
    ]

    logger.info("[/extract-memory] extracted %d facts", len(facts))
    return MemoryExtractionResponse(facts=facts, session_id=request.session_id)
