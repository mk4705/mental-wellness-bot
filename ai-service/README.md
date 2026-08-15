# AI service deployment

## Render Free (CPU-only)

Set **Root Directory** to `ai-service`. Leave Render's build command as:

```text
pip install -r requirements.txt
```

`requirements.txt` deliberately excludes PyTorch, Transformers, and
SentenceTransformer. Query embeddings are generated remotely by Hugging Face;
the committed FAISS index and BM25 retrieval stay local.

Use this start command:

```text
uvicorn main:app --host 0.0.0.0 --port $PORT
```

The service loads the checked-in FAISS index and metadata at startup. It calls
Hugging Face for query embeddings and emotion classification, so configure
`HF_API_TOKEN` in Render with a token that has Inference Providers permission.

## Verification after deploy

The startup log should contain both of these lines:

```text
[embeddings] Loading FAISS index from data/faiss_index/index.faiss
FAISS index loaded. AI service ready.
```

It must not contain local model-loading messages, or installs/imports of
`torch`, `sentence-transformers`, `transformers`, `nvidia-*`, `triton`, or
`cudnn`. The committed FAISS index is about 1.6 MB and its metadata is about
0.45 MB.
