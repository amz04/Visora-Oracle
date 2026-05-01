# Visora

> **vi** (as in *vision*) · **sor** (as in *sore*) · **a**

*From Latin: **vis** — vision + **ora** — knowledge*

Visora is an AI-powered industrial knowledge platform that gives factory workers and trainees a single place to understand their machines, watch expert repair recordings, and review full maintenance histories — all without leaving the floor.

Built as a proof-of-concept for the **BRIDGE x UAE Ministry of Industry & Advanced Technology** innovation challenge: *AI for Smart & Resilient Industrial Workforce*, presented at the Make It In The Emirates Forum, ADNEC — May 7th, 2025.

---

## Overview

In industrial and defense environments, critical operational knowledge disappears when experienced workers leave. New trainees struggle to learn complex machine repairs quickly, and workers in the field cannot stop what they are doing to dig through thick manuals.

Visora solves this by combining an AR-recorded expert knowledge base with a per-machine AI assistant, giving trainees instant, hands-free access to the right information at the right time.

---

## Pages

### Homepage — Machine Grid
Browse all available machines in a card-based grid. Each card shows the machine name, department, last service date, and live operational status (green / yellow / red). Click a card to see full details in a popup, or hit **Ask AI** directly to jump straight into a conversation about that machine.

### Machine Details Page
The core of the platform. Three panels working together:

- **Left — Maintenance Log:** A scrollable history of every maintenance session recorded for this machine, grouped by month. Each session shows the title, date, technician, and severity. Click any session to open a full detail overlay covering the trigger, outcome, downtime duration, step-by-step summary, tools used, parts replaced, and the attached video recording.

- **Middle — AI Chatbot (RAG):** The hero of the page. A machine-specialized AI assistant powered by a full RAG pipeline backed by a FastAPI server. It reads the machine's PDF manual and maintenance reports, chunks and embeds them into a vector database, then answers questions by retrieving the most relevant passages and generating a grounded response via an LLM. Answers include a collapsible **References** section listing every source used — each reference card shows the document, page number, and a preview excerpt. Clicking a card opens the actual PDF at that exact page in an inline viewer.

- **Right — Video Recordings:** A library of all expert repair videos for this machine. Each card shows a thumbnail, session title, recording technician, duration, and date. Grouped by month to stay navigable as the library grows.

### Video Preview Overlay
Opens on top of the machine page without losing your place. The video player occupies the left side with a custom dark-themed control bar and AI-generated chapter markers on the timeline — click any chapter dot to jump to that moment. The right side has three tabs: **Overview** (AI summary, outcome, downtime), **Steps** (timestamped steps that seek the video when clicked), and **Resources** (tools, parts, and manual references). Related sessions sit at the bottom for natural continuation.

---

## AI — RAG Pipeline

The chatbot is backed by a FastAPI server that runs a full server-side Retrieval-Augmented Generation pipeline.

| Step | What happens |
| ---- | ------------ |
| **1. Parse** | PyMuPDF extracts text from each PDF page on the server |
| **2. Chunk** | Text is split into overlapping 600-character segments (200-char overlap) using LangChain's `RecursiveCharacterTextSplitter` |
| **3. Embed** | `sentence-transformers/all-MiniLM-L6-v2` converts chunks to dense vectors locally (no API call) |
| **4. Store** | Vectors are persisted in a ChromaDB collection, keyed by machine ID and source path |
| **5. Query** | The user's question is embedded with the same model |
| **6. Retrieve** | ChromaDB cosine similarity search returns the top 12 candidate chunks (similarity threshold: 0.35) |
| **7. Re-rank** | A `cross-encoder/ms-marco-MiniLM-L-6-v2` model scores each (question, chunk) pair together and keeps the top 3 most relevant, with page-level deduplication |
| **8. Generate** | Groq (`llama-3.3-70b-versatile`) produces a grounded answer from those 3 chunks |
| **9. Cite** | All source chunks are returned as citations — the frontend shows a collapsible References dropdown; each card is clickable to open the PDF at that page |

Documents indexed per machine:
- **Machine 1 — CNC Milling Machine:** Haas Mill Operator Manual 2023 + 2 maintenance reports
- **Machine 2 — Belt Conveyor System:** Orthman Belt Conveyor Manual 2022 + 1 maintenance report

---

## Design

Visora uses a dark industrial dashboard aesthetic — precise, technical, and built for serious environments.

| Token | Value |
| ----- | ----- |
| Background | `#0A0C10` |
| Surface | `#161A22` |
| Accent | `#F59E0B` (amber) |
| Text primary | `#F1F5F9` |
| Text muted | `#94A3B8` |
| Fonts | Syne (headings) · DM Sans (body) · JetBrains Mono (timestamps) |

Cards use a subtle glass effect with backdrop blur. Hover states reveal an amber glow border. Overlays dim the background and slide in with a smooth scale transition.

---

## Tech Stack

**Frontend**

| Layer | Technology |
| ----- | ---------- |
| Structure | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox) |
| Logic | Vanilla JavaScript (ES6+) |
| Icons | Lucide (CDN) |
| Fonts | Google Fonts |
| Video | HTML5 native `<video>` |
| Data | Hardcoded in `data.js` |

**Backend (RAG server)**

| Layer | Technology |
| ----- | ---------- |
| API server | FastAPI + Uvicorn |
| PDF parsing | PyMuPDF |
| Chunking | LangChain `RecursiveCharacterTextSplitter` |
| Bi-encoder embeddings | `sentence-transformers/all-MiniLM-L6-v2` (runs locally) |
| Vector store | ChromaDB (persistent, cosine space) |
| Cross-encoder re-ranker | `cross-encoder/ms-marco-MiniLM-L-6-v2` (runs locally) |
| LLM | Groq API (`llama-3.3-70b-versatile`) |

No frontend frameworks or build tools.

---

## File Structure

```
visora/
├── index.html                  # Homepage — machine grid
├── machine.html                # Machine details — chatbot + sessions + videos
├── style.css                   # Global styles and design tokens
├── main.js                     # Homepage logic and interactions
├── machine.js                  # Machine details page logic
├── rag.js                      # RAG HTTP client (calls FastAPI backend)
├── data.js                     # All hardcoded machines, sessions, and video data
├── config.js                   # RAG_API_BASE and other client-side config (gitignored)
├── .env                        # Server-side secrets: GROQ_API_KEY (gitignored)
├── requirements.txt            # Python dependencies
├── app/
│   ├── main.py                 # FastAPI app — mounts router and serves static files
│   ├── config.py               # Server settings, document registry (machine → PDFs)
│   ├── models.py               # Pydantic request/response models
│   ├── routers/
│   │   └── rag.py              # /rag/query, /rag/ingest, /rag/health endpoints
│   ├── services/
│   │   ├── db.py               # ChromaDB + embedding/reranking model singletons
│   │   ├── ingestion.py        # PDF parsing, chunking, embedding, and storing
│   │   ├── retrieval.py        # Vector search + cross-encoder re-ranking
│   │   └── generation.py      # Groq LLM call and prompt assembly
│   └── data/
│       └── chroma/             # Persisted ChromaDB vector store (gitignored)
├── assets/
│   ├── branding/
│   │   ├── visora-logo.png
│   │   └── visora-favicon.png
│   ├── manuals/
│   │   ├── CNC-Milling-Machine-Manual-2023.pdf
│   │   └── Belt-Conveyor-Manual-2022.pdf
│   └── reports/
│       ├── CNC-Report-1.pdf
│       ├── CNC-Report-2.pdf
│       └── Conveyer-belt-report-1.pdf
├── thumbnails/
│   ├── machine1–5.jpg          # Machine card images (homepage)
│   └── thumb1–5.jpg            # Video thumbnails
└── videos/
    └── video1–4.mp4
```

---

## Running Locally

```bash
git clone https://github.com/amz04/visora.git
cd visora
```

### 1. Install Python dependencies

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
```

### 2. Set your API key

Create a `.env` file in the project root:

```
GROQ_API_KEY=your-groq-key-here
```

Get a free key at [console.groq.com](https://console.groq.com).

### 3. Start the server

```bash
uvicorn app.main:app --reload
```

The FastAPI server serves both the API and the frontend. Open `http://localhost:8000`.

### 4. Ingest documents (first run only)

Before the chatbot can answer questions, the PDFs must be parsed, chunked, and embedded into ChromaDB. Call the ingest endpoint for each machine:

```bash
# Machine 1 — CNC Milling Machine
curl -X POST http://localhost:8000/rag/ingest -H "Content-Type: application/json" -d '{"machine_id": 1}'

# Machine 2 — Belt Conveyor System
curl -X POST http://localhost:8000/rag/ingest -H "Content-Type: application/json" -d '{"machine_id": 2}'
```

This only needs to run once — ChromaDB persists the vectors to disk. To force a full re-ingest (e.g. after changing chunk settings), add `"force": true` to the request body.

### 5. Configure the frontend

Create `config.js` in the project root (it is gitignored):

```js
const RAG_API_BASE = 'http://localhost:8000';
```

---

## Current Scope (MVP)

The following are intentionally out of scope for this version:

- User authentication
- File upload or AR glasses connectivity
- Mobile responsive layout (desktop only, 1280px+)

---

## Built For

**BRIDGE Innovation Challenge — AI for Smart & Resilient Industrial Workforce**
UAE Ministry of Industry & Advanced Technology · Make It In The Emirates Forum · May 2025
