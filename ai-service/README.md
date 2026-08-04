# AI service deployment

## Render Free (CPU-only)

Set **Root Directory** to `ai-service`. Leave Render's build command as:

```text
pip install -r requirements.txt
```

`requirements.txt` selects the official PyTorch CPU wheel index and pins
`torch==2.3.1+cpu`. Do not replace the build command with a plain PyPI-only
install, and do not remove the `--extra-index-url` line: PyPI's Linux
`torch==2.3.1` wheel declares CUDA/NVIDIA dependencies, whereas the `+cpu`
wheel does not.

Use this start command:

```text
uvicorn main:app --host 0.0.0.0 --port $PORT
```

The service loads the checked-in FAISS index and metadata, then downloads and
caches `sentence-transformers/all-MiniLM-L6-v2` on its first start. Ensure the
service can reach Hugging Face during that initial download.

## Verification after deploy

The startup log should contain both of these lines:

```text
[embeddings] Loading FAISS index from data/faiss_index/index.faiss
[embeddings] Loading local embedding model: all-MiniLM-L6-v2
```

It must not contain installs or imports of `nvidia-*`, `triton`, `cudnn`, or
other CUDA packages. The committed FAISS index is about 1.6 MB and its metadata
is about 0.45 MB; the `all-MiniLM-L6-v2` model is roughly 90 MB on disk.
