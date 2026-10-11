# StudyAI — AI-Powered Study Assistant

> A full-stack, internship-ready AI study platform that empowers students to upload academic PDFs, perform Retrieval-Augmented Generation (RAG) conversational Q&A, generate automated multiple-choice quizzes with difficulty grading, and track longitudinal study performance through real-time analytics.

---

## Overview

**StudyAI** bridges academic document processing with conversational AI and self-assessment tools. Students frequently struggle to quickly parse dense textbooks, lecture notes, and research papers. StudyAI solves this by:
1. Extracting and indexing textbook content page by page.
2. Generating context-grounded answers with verifiable citations (page number, chunk excerpt, and similarity relevance scores).
3. Synthesizing multiple-choice self-assessment quizzes directly from uploaded documents.
4. Tracking progress across study sessions using database-backed analytics and difficulty-based metrics.

This project was built from scratch to demonstrate production software engineering standards across **React**, **FastAPI**, **SQLite/SQLAlchemy**, **PyPDF text extraction & chunking**, **RAG architecture**, and **responsive UI design**.

---

## Features

- 📄 **PDF Processing & Management**:
  - Secure PDF file validation (enforces `.pdf` format, MIME-type checks, and 25 MB payload limits).
  - Page-by-page text extraction powered by `pypdf`.
  - Sentence-aware semantic chunking (`~500` characters with overlapping context) with persistent chunk metadata (`chunk_index`, `page_number`, `document_id`).
  - Document detail viewer with full-text inspection and safe document deletion.

- 💬 **RAG AI Chat (Retrieval-Augmented Generation)**:
  - Contextual Q&A grounded strictly in the student's uploaded documents.
  - Term-frequency and token-overlap retrieval engine that ranks and filters the top relevant document chunks.
  - LLM integration supporting Google Gemini API with seamless, zero-cost, grounded **Smart Demo Mode** fallback when an API key is not configured.
  - Source citations drawer showing extracted excerpts, exact page numbers, and cosine/TF relevance scores.
  - Pre-seeded academic prompt pills for immediate exploration.

- 📝 **Intelligent Quiz Generator & Test Engine**:
  - Configurable quiz synthesis based on document content across 3 difficulty tiers (**Easy**, **Medium**, **Hard**) and custom question counts.
  - Dynamic distractor generation from adjacent document topics.
  - Interactive quiz runner with progress indicators, option selection, and previous/next question jumping.
  - Immediate grading on submission: calculating score, percentage, and detailed explanations for both correct and incorrect choices.

- 📊 **Real-Time Study Analytics**:
  - Live metrics calculated directly from SQLite database activity.
  - Longitudinal performance KPIs: Documents Uploaded, Questions Asked, Quizzes Completed, and Average Score.
  - Breakdown by difficulty tier (attempts count and average percentage).
  - Chronological score trend chart and event activity log (uploads, chat queries, and quiz completions).

- ⚡ **Full-Stack Decoupled Architecture**:
  - Independent FastAPI REST API backend with modular routers, schemas, services, and models.
  - Fast, responsive React SPA with dark mode, collapsible sidebar, and toast notifications.
  - Unified dev supervisor (`dev-runner.js`) coordinating the Vite frontend and Uvicorn backend concurrently.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide React, Motion |
| **Backend** | Python 3.10+, FastAPI, Uvicorn (ASGI), Pydantic v2 |
| **Database & ORM** | SQLite, SQLAlchemy 2.0 (Declarative Base, Relationship mapping) |
| **Document Processing** | PyPDF 6.x, Python multipart, RegEx tokenization |
| **AI & Retrieval** | Gemini API (Interactions / Flash), TF-ICF Grounded Retrieval, RAG Pipeline |
| **Tooling & Dev** | Node.js, npm, tsx, ESLint, Git |

---

## Architecture

### System Architecture

```text
React (Client SPA — Port 3000)
       ↓  (HTTP / JSON REST APIs via Vite Proxy)
FastAPI Backend (Uvicorn — Port 8001)
       ↓
Service Layer (DocumentService, AIService, QuizService)
       ↓
Database & Disk (SQLAlchemy ORM ↔ SQLite DB + File Storage)
```

### AI & RAG Pipeline

```text
PDF Upload
    ↓
Text Extraction (pypdf: page-by-page extraction)
    ↓
Chunking (Sliding window: ~500 chars, 80 char overlap + page mapping)
    ↓
Retrieval (Query tokenization ↔ TF-ICF chunk matching & ranking)
    ↓
Augmented Prompt (System prompt + Top-k grounded chunks + User Question)
    ↓
LLM / Grounded Engine (Google Gemini API or Deterministic Smart Fallback)
    ↓
Answer + Source Citations (Answer text + Page numbers + Excerpts + Scores)
```

---

## Project Structure

```text
studyai/
├── backend/
│   ├── app/
│   │   ├── database/
│   │   │   └── database.py        # SQLAlchemy engine, session provider & Base
│   │   ├── models/
│   │   │   ├── __init__.py        # Re-exports all DB models
│   │   │   ├── document.py        # Document & DocumentChunk models
│   │   │   ├── quiz.py            # Quiz, QuizQuestion, QuizAttempt, QuestionLog
│   │   │   └── user.py            # User, StudySession, Note models
│   │   ├── routes/
│   │   │   ├── api.py             # Root /api router aggregating all endpoints
│   │   │   ├── health.py          # GET /api/health
│   │   │   ├── documents.py       # Document upload, listing, details & deletion
│   │   │   ├── chat.py            # RAG conversation & document chunk queries
│   │   │   └── quiz.py            # Quiz generation, grading & analytics
│   │   ├── schemas/
│   │   │   ├── document.py        # Pydantic schemas for upload & document items
│   │   │   ├── chat.py            # ChatRequest, ChatResponse, SourceChunk
│   │   │   ├── quiz.py            # Quiz generation, submission & analytics schemas
│   │   │   └── health.py          # Health status schema
│   │   ├── services/
│   │   │   ├── document_service.py # PDF extraction, chunking & disk storage
│   │   │   ├── ai_service.py       # RAG retrieval & Gemini / Demo mode LLM execution
│   │   │   └── quiz_service.py     # Quiz question synthesis, scoring & analytics
│   │   ├── utils/
│   │   │   └── logger.py          # Structured application logger
│   │   └── main.py                # FastAPI application entry & CORS configuration
│   ├── uploads/                   # Local storage directory for uploaded PDFs
│   ├── requirements.txt           # Python package dependencies
│   └── run.py                     # Backend bootstrapper with sys.path configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx        # Responsive navigation & status pill
│   │   │   └── DocumentCard.jsx   # Document preview & action card
│   │   ├── pages/
│   │   │   ├── DashboardPage.jsx  # Student workspace overview & quick metrics
│   │   │   ├── DocumentsPage.jsx  # PDF dropzone, upload progress & manager
│   │   │   ├── ChatPage.jsx       # RAG chat interface with source inspection
│   │   │   ├── QuizPage.jsx       # Quiz generator, test runner & results review
│   │   │   ├── AnalyticsPage.jsx  # Study telemetry, score trends & activity log
│   │   │   └── ArchitecturePage.jsx # System health inspection & API docs
│   │   ├── services/
│   │   │   └── api.js             # Client HTTP API client communicating with backend
│   │   └── App.jsx                # Main application controller & router
│   ├── package.json
│   └── vite.config.js
├── dev-runner.js                  # Supervisor script spawning FastAPI & Vite concurrently
├── package.json                   # Root package configuration
├── vite.config.ts                 # Vite bundler configuration with backend proxy
└── .env.example                   # Environment variable template
```

---

## Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **pip**: Python package installer

### 1. Clone the repository
```bash
git clone https://github.com/your-username/studyai.git
cd studyai
```

### 2. Install Backend Dependencies
```bash
cd studyai/backend
pip install -r requirements.txt
cd ../..
```

### 3. Install Frontend Dependencies
```bash
npm install
```

---

## Environment Variables

Copy the example environment file to `.env`:
```bash
cp .env.example .env
```

Configuration variables:
```bash
# Optional: Google Gemini API Key for production LLM calls
GEMINI_API_KEY=your_gemini_api_key_here

# When DEMO_MODE=true or no API key is provided, StudyAI uses its 
# grounded retrieval engine to formulate responses without external API costs
DEMO_MODE=true

# Host & Port configuration (defaults to 8001 for backend)
PORT=8001
HOST=127.0.0.1
```

---

## Running Locally

### Option A: Single Command (Recommended)
Run both the FastAPI backend (port 8001) and Vite frontend (port 3000) simultaneously:
```bash
npm run dev
```

### Option B: Independent Terminals

**Terminal 1 — Backend (FastAPI):**
```bash
cd studyai/backend
python run.py
# Backend runs at http://127.0.0.1:8001
# Interactive Swagger docs available at http://127.0.0.1:8001/docs
```

**Terminal 2 — Frontend (Vite):**
```bash
npm run dev
# Frontend runs at http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `GET` | `/api/health` | Service health status and application identification | `200 OK` |
| `GET` | `/api/documents` | Retrieve all uploaded documents | `200 OK` |
| `POST` | `/api/documents/upload` | Upload a PDF (validates MIME & size, extracts text & chunks) | `201 Created` |
| `GET` | `/api/documents/{id}` | Get document metadata and full extracted text | `200 OK` |
| `DELETE` | `/api/documents/{id}` | Delete document record and purge disk file | `200 OK` |
| `POST` | `/api/chat` | Submit question to RAG pipeline for grounded answer | `200 OK` |
| `POST` | `/api/quiz/generate` | Generate multiple-choice quiz from document content | `201 Created` |
| `POST` | `/api/quiz/submit` | Grade submitted answers and log score to database | `200 OK` |
| `GET` | `/api/analytics` | Fetch aggregate study KPIs, difficulty stats & score trends | `200 OK` |

---

## Demo Mode

StudyAI is designed to be **100% runnable without third-party API dependencies**:
- If `GEMINI_API_KEY` is not supplied or if `DEMO_MODE=true` is set, the system seamlessly uses the internal **Grounded Deterministic Engine**.
- It tokenizes user questions, matches the highest-scoring chunks from the selected document, and formats a fact-grounded academic response with complete page numbers and source excerpts.
- This ensures evaluators, interviewers, and offline demonstrations work flawlessly without rate-limit errors or credential setup friction.

---

## Future Improvements

1. **Vector Database Integration**: Migrate from lexical TF-ICF chunk retrieval to persistent dense vector embeddings using **ChromaDB** or **pgvector**.
2. **Multi-Document Synthesis**: Enable cross-document querying to synthesize answers spanning multiple textbooks or lecture decks simultaneously.
3. **Spaced Repetition Flashcards (SM-2 Algorithm)**: Implement Leitner / SuperMemo-2 scheduling for flashcard reviews based on historical quiz difficulty.
4. **User Authentication & Workspaces**: Multi-tenant isolation using JWT authentication and organization workspaces.
5. **Streaming LLM Responses**: Server-Sent Events (SSE) or WebSockets for real-time word-by-word response streaming in the chat interface.

---

## What I Learned

- **Decoupled Architecture**: Structuring a modular backend with distinct route, schema, service, and data access layers for clean separation of concerns.
- **Document Chunking Nuances**: The importance of chunk overlap and sentence boundary preservation to prevent losing semantic context across split chunks.
- **RAG Grounding**: How to avoid LLM hallucination by forcing answer generation to rely strictly on retrieved document excerpts accompanied by citation metadata.
- **Defensive API Engineering**: Implementing strict payload validation, file-type checking, disk sanitation, and error handling for production stability.
- **Responsive State Management**: Building an intuitive, high-performance user interface in React that coordinates asynchronous background tasks with visual user feedback.
