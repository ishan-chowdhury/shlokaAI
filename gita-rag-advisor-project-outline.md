# GitaVaani — A Sanskrit-Grounded RAG Advisor Based on the Bhagavad Gita

**Project Outline & Technical Specification**
Prepared for: Ishan Chowdhury (B.Tech CSE, KIIT, 2027)

---

## 1. Concept Summary

GitaVaani is a full-stack AI application that lets a user describe a real-life problem (stress, career doubt, relationship conflict, fear of failure, etc.) in plain English, and responds with grounded advice drawn from specific verses (śloka) of the Bhagavad Gita — showing the original Sanskrit, a transliteration, an English translation, and a short contextual explanation of how that verse applies to the user's situation. The system is retrieval-grounded (RAG), not a model that "makes up" Gita-sounding text — every piece of advice is traceable to a real, cited verse. The frontend is a calm, Indic-aesthetic interface (Devanagari typography, warm saffron/indigo palette, verse-of-the-day style layout).

## 2. A Necessary Scoping Decision (read this first)

Your original framing mentions "make our own model to parse [Sanskrit] and translate it to English." Worth being upfront about scope here, because it changes how strong the project actually is:

- **Training a Sanskrit→English translation model from scratch** is a genuinely hard NLP research problem — Sanskrit is a low-resource, highly inflected language, and even well-funded academic labs (see ByT5-Sanskrit, Digital Corpus of Sanskrit) are still working on core tasks like word segmentation and lemmatization. Attempting this from zero as a resume project would eat months and likely produce a weaker translator than what already exists — not a good use of your time relative to payoff.
- **The stronger, more resume-relevant version of this project** is a *hybrid* approach: use existing, scholar-verified Sanskrit verses and translations (Swami Sivananda, A.C. Bhaktivedanta Prabhupada, Dr. S. Radhakrishnan, etc. — all in the public-domain datasets below) as your **ground-truth corpus**, and put your engineering effort into the parts that are genuinely yours to build: the Sanskrit NLP preprocessing layer, the retrieval system, the query-understanding/classification layer, the grounded-generation pipeline, and the product itself. You still get to say you "worked with Sanskrit NLP" (transliteration, lemmatization, verse segmentation) — just not "invented an MT model," which nobody would expect from a 2-3 month solo/small-team project anyway and which recruiters can't easily verify was real.

This write-up is built around that hybrid approach — it's the version that's actually shippable and that maps cleanly onto your existing resume skills (RAG, zero-shot classification, LangChain, OCR, fuzzy matching, Next.js/FastAPI).

## 3. Objectives

1. Build a verse-accurate retrieval corpus of all 700 Bhagavad Gita verses (Sanskrit + IAST transliteration + multiple English translations + commentary).
2. Build a Sanskrit text-processing layer (segmentation, transliteration normalization, verse indexing).
3. Build a RAG pipeline that retrieves the most relevant verse(s) for a user's stated problem and generates grounded, cited advice — not hallucinated scripture.
4. Classify user queries into life-themes (grief, duty, anger, fear, attachment, purpose, etc.) to improve retrieval precision, reusing the zero-shot classification pattern from your Splitora project.
5. Ship a polished, Indic-themed web frontend.
6. Produce a defensible, demo-able, resume-ready artifact — not a research paper.

## 4. System Architecture

```
                     ┌─────────────────────────┐
                     │   Data Layer (offline)   │
                     │  700 verses: Sanskrit +  │
                     │  IAST + multi-translation│
                     │  + commentary (MongoDB)  │
                     └────────────┬─────────────┘
                                  │
                     ┌────────────▼─────────────┐
                     │ Sanskrit NLP Preprocessing│
                     │ - Devanagari→IAST         │
                     │ - Word segmentation        │
                     │ - Verse-level embeddings   │
                     └────────────┬─────────────┘
                                  │
                     ┌────────────▼─────────────┐
                     │   Vector Store (FAISS /   │
                     │   Chroma) — verse chunks   │
                     └────────────┬─────────────┘
                                  │
User query ──► Query Understanding Layer
               - Zero-shot theme classifier (BART-large-MNLI)
               - Embedding of user query
                                  │
                     ┌────────────▼─────────────┐
                     │   Retrieval (top-k verses)│
                     └────────────┬─────────────┘
                                  │
                     ┌────────────▼─────────────┐
                     │  Grounded Generation (LLM  │
                     │  via LangChain) — advice   │
                     │  citing retrieved verses    │
                     │  only, with confidence gate │
                     └────────────┬─────────────┘
                                  │
                     ┌────────────▼─────────────┐
                     │  Next.js / TypeScript UI   │
                     │  Devanagari + translation   │
                     │  + citation + explanation   │
                     └────────────────────────────┘
```

## 5. Technology Stack (mapped to what you already know)

| Layer | Technology | Ties to your resume |
|---|---|---|
| Data ingestion | Python, `pandas`, JSON parsing of open verse datasets | Direct — same pattern as your data pipelines at AWL/Adani |
| Sanskrit preprocessing | `indic-transliteration` (Sanskrit Coders), CLTK, IAST normalization | New skill, but small, well-scoped addition |
| OCR (optional, for scanned commentaries) | Tesseract OCR + custom preprocessing | Direct reuse of your Splitora OCR pipeline |
| Verse matching / deduplication | Fuzzy matching (`rapidfuzz`) for aligning verse numbering across sources | Direct reuse of your Kirana-store dedup + Splitora merchant-matching work |
| Embeddings & vector store | `sentence-transformers`, FAISS or Chroma | New but standard, well-documented |
| Query classification | Hugging Face `facebook/bart-large-mnli` zero-shot classification | **Exact same technique** as your Splitora transaction classifier |
| Orchestration | LangChain (RAG chain, prompt templates, retrieval + generation) | Already on your resume under AI Engineering |
| Backend API | Python, FastAPI | Direct reuse from Splitora |
| Database | MongoDB (verse corpus, user query logs, feedback) | Direct reuse from Splitora |
| Frontend | Next.js, TypeScript, Tailwind, Devanagari web fonts (e.g. Noto Sans Devanagari) | Direct reuse of Splitora stack |
| Deployment | Vercel (frontend) + Render/Railway (FastAPI backend) | Consistent with your existing deployment pattern |
| Evaluation | Small human-eval set + citation-accuracy checks | New but straightforward |

## 6. Data Sources (real, publicly available — verified via search)

- **vedicscriptures/bhagavad-gita** (GitHub) — compiled dataset of all 700 verses with Sanskrit, transliteration, and multiple author translations/commentaries (Sivananda, Prabhupada, Radhakrishnan, and others), plus a reference REST API you can pattern your own schema on.
- **Bhagavad Gita Dataset (Kaggle)** — verses in Sanskrit with Hindi and English word-by-word meanings, useful for building your segmentation/glossary layer.
- **AI4Bharat `indicnlp_catalog`** — catalog of open Sanskrit/Indic NLP tools (transliteration libraries, CLTK Sanskrit support) for the preprocessing layer.
- **Sanskrit Wikisource / English Wikisource** — canonical verse text for cross-checking data quality.

All of the above are open datasets — cite them explicitly in your README and give attribution to the original translators/commentators. This matters for a scripture-based project: you are compiling and engineering on top of scholarly work, not claiming authorship of the translations themselves.

## 7. Build Plan (phased)

### Phase 1 — Data Foundation (Week 1-2)
- Pull and merge verse data from the sources above into a single MongoDB schema: `{chapter, verse_number, sanskrit_devanagari, iast_transliteration, translations: [{author, text}], theme_tags}`.
- Use fuzzy matching to reconcile verse numbering differences across sources.
- Manually spot-check a sample against Wikisource for accuracy — scripture accuracy errors are the single biggest credibility risk for this project.

### Phase 2 — Sanskrit NLP Layer (Week 2-3)
- Normalize Devanagari to IAST transliteration for consistent search/display.
- Build verse-level chunks (each verse + its translations = one retrievable unit).
- Generate embeddings for each chunk using a multilingual sentence-transformer model (needs to handle English queries retrieving against verses that include Sanskrit + English text).

### Phase 3 — Retrieval + Query Understanding (Week 3-4)
- Stand up a vector store (Chroma is easiest to self-host; FAISS if you want more control).
- Build the zero-shot theme classifier: map free-text user problems to a fixed taxonomy (e.g., grief, duty/dharma, anger, fear, attachment, purpose, failure, ego) — this narrows retrieval before the vector search, the same "narrow with a fast classifier, then rank" pattern you already used in Splitora's category classification.
- Combine theme filter + vector similarity for top-k verse retrieval.

### Phase 4 — Grounded Generation (Week 4-5)
- Build a LangChain RAG chain: retrieved verses go into the prompt context; the LLM is instructed to generate advice **only** using the retrieved verses, cite verse numbers explicitly, and decline gracefully if no verse is a good match (rather than inventing one).
- Add a confidence/guardrail gate before returning an answer — same "confidence-scoring gate" concept you already built into your OpsHub AI defect-fix workflow, applied here to prevent scripture hallucination, which is the single biggest risk in a project like this (fabricated Sanskrit or misattributed verses would undermine the whole thing).

### Phase 5 — Frontend (Week 5-6)
- Next.js + TypeScript, same stack as Splitora.
- Design direction: warm, minimal, Indic — Devanagari verse displayed prominently, transliteration and translation beneath it, a short "how this applies to you" explanation, and a citation (chapter.verse).
- Include a simple "ask again differently" flow and a way to browse all 18 chapters directly, independent of the advice feature.

### Phase 6 — Evaluation & Polish (Week 6-7)
- Build a small evaluation set: 20-30 realistic user problems, manually judge whether retrieved verses are actually relevant and whether generated advice stays faithful to the verse (no fabricated content).
- Track a simple citation-accuracy metric — does every claim in the output map to a real cited verse.
- Write the README with clear attribution to source translators/commentators.

## 8. Evaluation Approach

Since there's no ground-truth "correct advice" dataset, evaluate along three axes instead of trying to score "correctness":
- **Retrieval relevance** — human-judged, does the top-k verse set actually relate to the stated problem.
- **Faithfulness** — does the generated explanation only draw on the retrieved verse text and translations, with no invented Sanskrit or invented claims.
- **Citation accuracy** — every generated response should be traceable to a specific chapter.verse in your database.

## 9. Draft Resume Bullets (once built)

- Built GitaVaani, a Retrieval-Augmented Generation system grounding LLM-generated life advice in 700 verses of the Bhagavad Gita, combining a Sanskrit NLP preprocessing pipeline (transliteration, verse segmentation) with a zero-shot classification layer for query understanding.
- Engineered a citation-faithful RAG pipeline using LangChain and a vector store (FAISS/Chroma) with a confidence-gated generation step to prevent hallucinated scripture, achieving [X]% citation accuracy on a manually evaluated test set.
- Designed and shipped a full-stack Next.js/TypeScript/FastAPI/MongoDB application with a custom Indic-themed UI, reusing and extending the OCR and fuzzy-matching techniques from a prior full-stack project.

(Fill in the bracketed metric once you have real eval numbers — don't put a placeholder number on the actual resume.)

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Fabricated/incorrect Sanskrit or mistranslation | Use only verified public-domain translations; never let the LLM generate its own Sanskrit — retrieval only, generation is English explanation grounded in retrieved text |
| Cultural/religious sensitivity — presenting scripture as generic "self-help" | Frame the product clearly as an educational/study companion, keep translations attributed to named scholars, avoid claiming theological authority |
| Low-resource Sanskrit NLP tooling gaps | Scope preprocessing to segmentation/transliteration only; lean on pre-existing verified translations rather than building your own MT model |
| Scope creep into full translation-model research | Time-box Phase 2 hard; the differentiator is the RAG + product layer, not a from-scratch translator |

## 11. Stretch Goals (only after the core is working and demo-able)

- Add Hindi as a second output language (many of the same datasets already include Hindi translations).
- Add audio narration of verses (Sanskrit pronunciation) using TTS.
- Add a "verse of the day" push notification / email digest feature.
- Fine-tune a small classifier on user feedback (thumbs up/down on relevance) to improve retrieval ranking over time.
