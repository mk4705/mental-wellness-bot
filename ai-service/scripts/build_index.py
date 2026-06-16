#!/usr/bin/env python3
# ai-service/scripts/build_index.py
# Builds the FAISS vector index from knowledge base .txt files.
#
# Chunking strategy: sentence-boundary chunking via nltk is used so that chunks
# never cut mid-sentence, ensuring semantically complete blocks for embeddings
# and retrieval.
#
# Usage:
#   cd ai-service
#   python scripts/build_index.py

import os
import sys
import json
import faiss
import numpy as np

# Ensure we can import from the parent directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from core.embeddings import embed
import nltk

# Download NLTK sentence tokenizer (once)
nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)

# Config
KNOWLEDGE_DIR  = "data/knowledge"
OUTPUT_DIR     = "data/faiss_index"
INDEX_PATH     = os.path.join(OUTPUT_DIR, "index.faiss")
METADATA_PATH  = os.path.join(OUTPUT_DIR, "metadata.json")
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Chunk configuration (sentence-based)
SENTENCES_PER_CHUNK = 4   # group 4 sentences per chunk
CHUNK_OVERLAP       = 1   # overlap by 1 sentence between chunks

os.makedirs(OUTPUT_DIR, exist_ok=True)


def sentence_chunk(text: str, sentences_per_chunk: int = 4, overlap: int = 1):
    """
    Split text into overlapping sentence-based chunks.
    Much better than character-based chunking: chunks are semantically complete.

    Example: text with 10 sentences, chunk_size=4, overlap=1:
      Chunk 1: sentences 0-3
      Chunk 2: sentences 3-6  (overlap: sentence 3 repeated)
      Chunk 3: sentences 6-9
    """
    sentences = nltk.sent_tokenize(text.strip())
    sentences = [s.strip() for s in sentences if s.strip()]

    chunks = []
    step = sentences_per_chunk - overlap

    for i in range(0, len(sentences), step):
        chunk_sentences = sentences[i : i + sentences_per_chunk]
        if chunk_sentences:
            chunks.append(" ".join(chunk_sentences))

    return chunks


def main():
    print("Using Hugging Face Inference API for embeddings")

    # Read knowledge files
    print(f"\nReading knowledge files from: {KNOWLEDGE_DIR}/")
    if not os.path.exists(KNOWLEDGE_DIR):
        print(f"   ERROR: {KNOWLEDGE_DIR} directory not found")
        sys.exit(1)

    txt_files = []

    for root, _, files in os.walk(KNOWLEDGE_DIR):
        for file in files:
            if file.endswith(".txt"):
                txt_files.append(os.path.join(root, file))

    if not txt_files:
        print(f"   ERROR: No .txt files found in {KNOWLEDGE_DIR}")
        sys.exit(1)

    all_chunks = []
    metadata   = []

    for filepath in sorted(txt_files):
        filename = os.path.relpath(filepath, KNOWLEDGE_DIR)
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()

        chunks = sentence_chunk(text, SENTENCES_PER_CHUNK, CHUNK_OVERLAP)
        print(f"   {filename}: {len(chunks)} chunks")

        for chunk in chunks:
            all_chunks.append(chunk)
            category = os.path.dirname(filename)
            metadata.append({
                "source": filename,
                "category": category,
                "content": chunk,
            })

    print(f"\n   Total chunks: {len(all_chunks)}")

    # Generate embeddings
    print("\nGenerating embeddings via Hugging Face Inference API...")
    embeddings_list = []
    for i, chunk in enumerate(all_chunks):
        print(f"   Embedding chunk {i+1}/{len(all_chunks)}...", end="\r")
        embeddings_list.append(embed(chunk))
    print()
    embeddings = np.array(embeddings_list).astype("float32")

    # Build FAISS index
    # IndexFlatL2: exact nearest-neighbour search (correct for small KBs)
    # For 1M+ vectors, use IndexIVFFlat (approximate, much faster)
    print("\nBuilding FAISS index...")
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    print(f"   Index built: {index.ntotal} vectors, dim={dimension}")

    # Save
    print(f"\nSaving to {OUTPUT_DIR}/")
    faiss.write_index(index, INDEX_PATH)
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"   index.faiss  — {os.path.getsize(INDEX_PATH) / 1024:.1f} KB")
    print(f"   metadata.json — {len(metadata)} entries")

    print("\nIndex built successfully!")
    print(f"   Start the AI service: uvicorn main:app --reload --port 8000")


if __name__ == "__main__":
    main()
