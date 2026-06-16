# Mental Wellness Chatbot V2

A full-stack mental wellness chatbot built as an interview-ready B.Tech final project.

**Stack:** React · Tailwind · Node.js/Express · MongoDB Atlas · Python FastAPI · FAISS · Groq · HuggingFace

---

## Architecture

```
frontend/          React + Tailwind UI
backend/           Node.js + Express REST API (port 5000)
ai-service/        Python FastAPI AI pipeline (port 8000)
```

The Node backend handles auth, sessions, and business logic.  
The Python service handles ML: emotion detection, hybrid RAG, and LLM calls.

---

## Setup — Step by Step

### 1. Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas free cluster (cloud.mongodb.com)
- Groq API key (console.groq.com — free)
- HuggingFace API key (huggingface.co/settings/tokens — free)

---

### 2. Backend

```bash
cd backend
npm install

# Create your .env file
cp .env.example .env
# Edit .env and fill in: MONGODB_URI, JWT_SECRET, AI_SERVICE_URL
```

**Get MongoDB URI:**  
MongoDB Atlas → your cluster → Connect → Drivers → copy the connection string.  
Replace `<password>` with your DB user password.

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

```bash
# Start the backend
npm run dev
# ✅ Server running on port 5000
```

---

### 3. AI Service

```bash
cd ai-service
python -m venv venv

# Mac/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

pip install -r requirements.txt

# Create your .env file
cp .env.example .env
# Edit .env and fill in: GROQ_API_KEY, HF_API_KEY

# Build the FAISS index from knowledge base files (run once)
python scripts/build_index.py

# Start the AI service
uvicorn main:app --reload --port 8000
# ✅ AI service ready at http://localhost:8000
# Swagger docs: http://localhost:8000/docs
```

---

### 4. Frontend (coming next)

```bash
cd frontend
npm install
npm start
# React app at http://localhost:3000
```

---

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Login, get JWT |
| GET | `/api/v1/auth/me` | Get profile (auth required) |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sessions` | List all sessions |
| POST | `/api/v1/sessions` | Create session |
| GET | `/api/v1/sessions/:id` | Get session + messages |
| DELETE | `/api/v1/sessions/:id` | Delete session |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/chat/message` | Send message, get AI reply |
| GET | `/api/v1/chat/:sessionId/history` | Full message history |

### Memory, Analytics, Feedback
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/memory` | User's long-term memory |
| DELETE | `/api/v1/memory/:id` | Delete memory entry |
| GET | `/api/v1/analytics/overview` | Stats summary |
| GET | `/api/v1/analytics/emotions` | Emotion timeline |
| POST | `/api/v1/feedback` | Rate a message |

---

## Key Design Decisions (for interviews)

**Why Node + Python instead of Django monolith?**  
Node handles async I/O (many concurrent chat requests) well. Python has better ML libraries. Each service does what it's best at.

**Why store emotion per message?**  
Enables the analytics dashboard without re-running classification on historical data. Also lets us show users their emotional journey over time.

**Why is long-term memory extracted, not stored raw?**  
Storing full transcripts would be expensive to embed and noisy to retrieve. Extracting structured facts (max 100 chars each) gives the LLM clean, actionable context.

**Why FAISS + BM25 hybrid instead of just FAISS?**  
Dense search misses exact keyword matches (e.g. "5-4-3-2-1 grounding", "CBT"). Sparse BM25 catches these. RRF fusion rewards chunks appearing in both result lists.

**Why sentence-boundary chunking?**  
Character-based chunking (V1) could split "Breathing helps the ner-" / "-vous system". Incomplete sentences produce worse embeddings. Sentence-boundary chunking ensures semantic completeness.

---

## V1 → V2 Key Improvements

| Issue in V1 | Fix in V2 |
|-------------|-----------|
| All logic in one 150-line function | Separated into services + controllers |
| In-RAM FAISS memory (lost on restart, shared across users) | Per-user memory in MongoDB |
| HF API called for embeddings on every message (+500ms) | Local sentence-transformers (milliseconds) |
| Character-based RAG chunking | Sentence-boundary chunking |
| Wrong Groq model name | Correct model in .env |
| `sentence-transformers` not in requirements.txt | Explicit dependency |
| Crisis keywords hardcoded in view | Config file, easy to update |
