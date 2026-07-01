# Mental Wellness Bot

An AI-powered mental wellness companion that provides emotionally aware conversations, evidence-based wellness guidance, long-term memory, and personalized support through Retrieval-Augmented Generation (RAG).

## Live Demo

Frontend: https://mwc-nrvo.onrender.com

---

# Overview

Mental Wellness Bot is a full-stack AI application designed to offer supportive and educational wellness conversations.

The system combines:

* Emotion Detection
* Retrieval-Augmented Generation (RAG)
* Long-Term Memory
* Session-Based Conversations
* Analytics Dashboard
* Knowledge-Grounded Responses

The chatbot is not intended to replace professional support. It focuses on wellness education, emotional reflection, and practical coping strategies.

---

# Features

### User Authentication

* User Registration
* Secure Login
* JWT Authentication
* Protected Routes

### AI-Powered Conversations

* Context-aware responses
* Emotion-aware interactions
* Session-based chat history
* Personalized conversations

### Emotion Detection

The AI detects emotional signals from user messages before generating a response.

Supported emotions include:

* Joy
* Sadness
* Fear
* Anger
* Surprise
* Disgust
* Neutral

### Retrieval-Augmented Generation (RAG)

Responses are grounded in a curated mental wellness knowledge base using BM25 retrieval.

Knowledge categories:

* Cognitive Behavioural Therapy (CBT)
* Anxiety & Stress Management
* Emotional Regulation
* Mindfulness & Sleep

### Long-Term Memory

The system extracts meaningful user information and stores it as structured memories.

Examples:

* Preferences
* Coping strategies
* Recurring concerns
* Emotional patterns

These memories are retrieved and used to personalize future conversations.

### Analytics Dashboard

Users can view:

* Conversation statistics
* Session activity
* Emotional trends
* Memory insights

### Responsive Design

The application is fully responsive and optimized for:

* Desktop
* Tablet
* Mobile Devices

---

# Architecture

```text
User
│
▼
React Frontend
│
▼
Node.js Backend
│
├── MongoDB Atlas
│
└── Python AI Service
       │
       ├── Emotion Detection (Hugging Face)
       ├── BM25 Knowledge Retrieval
       ├── Memory Context Retrieval
       └── OpenAI GPT OSS 120B Response Generation (served by Groq)
```

---

# Technology Stack

## Frontend

* React
* React Router
* Axios
* Tailwind CSS

## Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JWT Authentication
* bcrypt

## AI Service

* FastAPI
* Groq API serving OpenAI GPT OSS 120B
* Hugging Face Inference API
* FAISS
* BM25 Retrieval

## Deployment

* Render
* MongoDB Atlas

---

# Project Structure

```text
mental-wellness-bot/

├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   └── server.js
│
├── ai-service/
│   ├── core/
│   ├── schemas/
│   ├── data/
│   ├── scripts/
│   └── main.py
│
└── README.md
```

---

# Knowledge Base

The AI is grounded using a curated wellness knowledge base containing educational content on:

## CBT

* Cognitive Distortions
* Thought Reframing
* Behavioural Activation
* Thought Records
* Problem Solving

## Anxiety & Stress

* Academic Stress
* Burnout
* Anxiety Management
* Grounding Techniques
* Breathing Exercises

## Emotional Regulation

* Anger Management
* Sadness
* Loneliness
* Guilt & Shame
* Emotional Awareness

## Mindfulness & Sleep

* Meditation
* Mindfulness Basics
* Sleep Hygiene
* Self Compassion
* Relaxation Techniques

---

# Conversation Pipeline

```text
User Message
      │
      ▼
Emotion Detection
      │
      ▼
Knowledge Retrieval
      │
      ▼
Memory Retrieval
      │
      ▼
Prompt Construction
      │
      ▼
OpenAI GPT OSS 120B (served by Groq)
      │
      ▼
Generated Response
```

---

# Security

* JWT Authentication
* Password Hashing (bcrypt)
* Protected API Routes
* Environment Variable Configuration
* CORS Protection
* Input Validation

---

# Deployment

The application is deployed as three independent services:

### Frontend

Render Static Site

### Backend API

Render Web Service

### AI Service

Render Web Service

### Database

MongoDB Atlas

---

# Future Improvements

* Streaming AI Responses
* Voice Interaction
* Multi-Language Support
* Advanced Analytics

---

# Learning Outcomes

This project demonstrates practical experience with:

* Full Stack Development
* REST API Design
* Authentication & Authorization
* AI Application Development
* Retrieval-Augmented Generation
* Conversational Memory Systems
* MongoDB Data Modeling
* Cloud Deployment
* Production Troubleshooting

---

# Disclaimer

This application is intended for educational and wellness-support purposes only. It does not provide medical advice, diagnosis, or treatment and should not be considered a substitute for professional mental health services.
