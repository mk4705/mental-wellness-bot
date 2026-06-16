# ai-service/schemas.py
# Pydantic models define the shape of API requests and responses.
# FastAPI uses these for automatic validation AND automatic API documentation.

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Literal


class MessageItem(BaseModel):
    """A single message in the conversation history."""
    role: str               # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    """Request body for POST /chat"""
    user_message: str       = Field(..., min_length=1, max_length=5000)
    session_history: List[MessageItem] = Field(default=[])
    long_term_context: str  = Field(default="")


class EmotionResult(BaseModel):
    """Emotion classification output."""
    label: str              # dominant emotion label
    score: float            # confidence 0.0 – 1.0
    raw_scores: Dict[str, float] = {}


class RetrievedChunk(BaseModel):
    """A knowledge base chunk returned by RAG."""
    source: str             # filename (e.g. "anxiety_guide.txt")
    source_name: str        # display label (e.g. "Anxiety Guide")
    content: str
    score: float            # retrieval relevance score


class ChatResponse(BaseModel):
    """Response from POST /chat"""
    reply: str
    emotion: EmotionResult
    retrieved_chunks: List[RetrievedChunk] = []
    crisis_flag: bool = False
    response_time_ms: Optional[int] = None


# Memory extraction schemas

class MemoryExtractionRequest(BaseModel):
    """Request body for POST /extract-memory"""
    session_id: str
    messages: List[MessageItem]


class MemoryFact(BaseModel):
    """A single extracted memory fact."""
    memory_type: Literal[
        "fact",
        "preference",
        "coping_strategy",
        "recurring_concern",
        "emotional_pattern",
    ]
    content: str = Field(..., min_length=1, max_length=100)
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)


class MemoryExtractionResponse(BaseModel):
    """Response from POST /extract-memory"""
    facts: List[MemoryFact] = []
    session_id: str
