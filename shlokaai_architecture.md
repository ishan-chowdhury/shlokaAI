# shlokaAI (ShlokaAI) — System Architecture

A full-stack RAG (Retrieval-Augmented Generation) application that provides grounded life advice from the Bhagavad Gita.

---

## High-Level System Overview

```mermaid
flowchart TD
    User(["👤 User\n(Types a life problem)"])
    UI["🖥️ Frontend\nNext.js + TypeScript\nDevanagari UI"]
    API["⚙️ Backend API\nFastAPI (Python)"]
    QU["🧠 Query Understanding Layer"]
    Classify["🏷️ Zero-Shot Classifier\nfacebook/bart-large-mnli\nTheme: grief / fear / duty..."]
    Embed["📐 Query Embedding\nsentence-transformers"]
    VectorDB[("🗄️ Vector Store\nChromaDB\n700 Gita verses")]
    Retrieve["🔍 Top-K Retrieval\nSemantically similar verses"]
    LLM["✨ LLM Generation\nLangChain RAG Chain\nGrounded in retrieved verses only"]
    Response["📜 Response\nSanskrit + Transliteration\n+ Translation + Explanation\n+ Citation (Chapter.Verse)"]

    User -->|"Describes problem\nin plain English"| UI
    UI -->|"HTTP POST /query"| API
    API --> QU
    QU --> Classify
    QU --> Embed
    Classify -->|"Theme filter"| VectorDB
    Embed -->|"Vector similarity search"| VectorDB
    VectorDB --> Retrieve
    Retrieve -->|"Top 3-5 relevant verses"| LLM
    LLM -->|"Cited, grounded advice"| Response
    Response --> UI
```

---

## Data Pipeline (Offline / One-time Setup)

```mermaid
flowchart LR
    Raw[("📂 Raw Dataset\ngita-dataset/slok/\n719 JSON files")]
    Parse["🐍 ingest_to_chroma.py\nParse JSON files\nExtract translations"]
    Embed2["📐 Embed each verse\nparaphrase-multilingual\n-MiniLM-L12-v2"]
    Store[("🗄️ ChromaDB\nchroma_db/\nVectors + Metadata")]

    Raw --> Parse --> Embed2 --> Store
```

> ✅ **This step is COMPLETE.** 719 verses are embedded and stored.

---

## What Each Layer Does

### 1. 🖥️ Frontend (Not built yet — Phase 5)
| Property | Value |
|---|---|
| Framework | Next.js + TypeScript |
| Styling | Tailwind CSS |
| Fonts | Noto Sans Devanagari |
| Palette | Warm saffron / deep indigo |

---

### 2. ⚙️ Backend API (Not built yet — Phase 4-5)
| Property | Value |
|---|---|
| Framework | FastAPI |
| Language | Python |
| Endpoint | `POST /query` |
| Input | `{ "query": "I feel lost..." }` |
| Output | `{ verse, sanskrit, transliteration, explanation, citation }` |

---

### 3. 🧠 Query Understanding Layer (Phase 3 — In Progress)

```mermaid
flowchart LR
    Q["User Query\n'I am afraid of\nfailure'"]
    C["Zero-Shot Classifier\nbart-large-mnli"]
    T["Theme: fear"]
    E["Embedding Model\nMiniLM-L12-v2"]
    V["Query Vector\n[0.12, -0.45, ...]"]

    Q --> C --> T
    Q --> E --> V
    T -->|"Metadata filter"| Chroma[("ChromaDB")]
    V -->|"Cosine similarity"| Chroma
```

The classifier and embedder work **in parallel**. The theme acts as a pre-filter to narrow the search space before the vector similarity runs.

---

### 4. 🗄️ ChromaDB Vector Store (✅ Complete)

Each document stored in ChromaDB has:

```
Document (searchable text):
  All English translations for a verse combined

Metadata (stored alongside):
  - chapter: 2
  - verse: 47
  - sanskrit: "कर्मण्येवाधिकारस्ते..."
  - transliteration: "karmaṇyevādhikāraste..."

ID:
  "BG2.47"
```

---

### 5. ✨ LLM Generation Layer (Phase 4 — Not built yet)

```mermaid
flowchart TD
    R["Retrieved Verses\n(Top 3-5 from ChromaDB)"]
    P["LangChain Prompt Template\n'Based ONLY on these verses...'"]
    G["LLM\n(GPT-4 / Gemini / Claude)"]
    CG["Confidence Gate\nDoes any verse actually\nmatch the query?"]
    OUT["Final Response\n- Verse citation\n- Sanskrit text\n- Translation\n- Grounded explanation"]
    DECLINE["Graceful Decline\n'No matching verse found'"]

    R --> P --> G --> CG
    CG -->|"High confidence"| OUT
    CG -->|"Low confidence"| DECLINE
```

The **confidence gate** is critical — it prevents the LLM from fabricating Sanskrit or inventing verse citations.

---

## Current Progress

```mermaid
gantt
    title shlokaAI Build Plan
    dateFormat  YYYY-MM-DD
    section Phase 1 - Data Foundation
    Download & parse dataset       :done, p1, 2026-08-15, 1d
    Ingest 719 verses to ChromaDB  :done, p1b, after p1, 1d
    section Phase 2 - NLP Layer
    Embeddings generated           :done, p2, after p1b, 1d
    section Phase 3 - Retrieval
    Test basic retrieval           :done, p3a, after p2, 1d
    Zero-shot theme classifier     :active, p3b, after p3a, 3d
    section Phase 4 - Generation
    LangChain RAG chain            :p4, after p3b, 5d
    Confidence gate                :p4b, after p4, 2d
    section Phase 5 - Frontend
    Next.js UI                     :p5, after p4b, 7d
    section Phase 6 - Evaluation
    Eval set + citation accuracy   :p6, after p5, 3d
```

---

## File Structure (Current + Planned)

```
shlokaAI/
├── gita-dataset/          ✅ Raw data (cloned)
│   ├── slok/              ✅ 719 individual verse JSONs
│   └── chapter/           ✅ 18 chapter metadata JSONs
├── chroma_db/             ✅ ChromaDB local store
├── scripts/
│   ├── ingest_to_chroma.py   ✅ Data ingestion
│   └── test_retreival.py     ✅ Retrieval test
├── venv/                  ✅ Virtual environment
├── requirements.txt       ✅ Dependencies
│
│ -- NOT YET BUILT --
│
├── scripts/
│   └── classify_query.py  🔲 Zero-shot classifier (Phase 3)
├── api/
│   └── main.py            🔲 FastAPI backend (Phase 4-5)
├── frontend/              🔲 Next.js app (Phase 5)
└── eval/                  🔲 Evaluation scripts (Phase 6)
```
