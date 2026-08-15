import os
import chromadb
from chromadb.utils import embedding_functions
from transformers import pipeline as hf_pipeline
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# ── Load environment variables ────────────────────────────────────────────────
load_dotenv()

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="shlokaAI", description="Bhagavad Gita RAG Advisor")

class QueryRequest(BaseModel):
    query: str

# ── LLM setup ─────────────────────────────────────────────────────────────────
llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY")
)

# ── ChromaDB setup ────────────────────────────────────────────────────────────
client = chromadb.PersistentClient(path="./chroma_db")

emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)

collection = client.get_or_create_collection(
    name="gita_verses",
    embedding_function=emb_fn
)

# ── Zero-shot classifier ──────────────────────────────────────────────────────
classifier = hf_pipeline(
    "zero-shot-classification",
    model="facebook/bart-large-mnli"
)

THEMES = [
    "grief and sorrow",
    "duty and dharma",
    "fear and anxiety",
    "anger",
    "attachment",
    "purpose and meaning",
    "ego and pride",
    "failure and defeat"
]

# ── Prompt template ───────────────────────────────────────────────────────────
PROMPT_TEMPLATE = """
You are shlokaAI, a compassionate and wise guide rooted in the Bhagavad Gita.

A person has shared this with you:
"{user_query}"

The detected life theme is: {theme}

Using ONLY the following verses from the Bhagavad Gita, provide grounded,
compassionate advice. Always cite the verse (e.g., BG 2.47) for every point.
Do NOT invent scripture or add verses not provided below.
If none of the verses are relevant, say so honestly.

--- RETRIEVED VERSES ---
{retrieved_verses}
------------------------

Your response:
"""

# ── Core pipeline logic ───────────────────────────────────────────────────────
def run_rag_pipeline(user_query: str) -> dict:
    # 1. Classify the query into a life theme
    theme_result = classifier(user_query, candidate_labels=THEMES)
    top_theme = theme_result["labels"][0]
    top_score = round(theme_result["scores"][0], 2)

    # 2. Retrieve relevant verses from ChromaDB
    results = collection.query(query_texts=[user_query], n_results=3)

    # 3. Format the retrieved verses for the prompt
    verse_context = ""
    citations = []
    for i, doc in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i]
        verse_ref = f"BG {meta['chapter']}.{meta['verse']}"
        verse_context += f"\n{verse_ref}:\n{doc}\n"
        citations.append({
            "reference": verse_ref,
            "sanskrit": meta["sanskrit"],
            "transliteration": meta["transliteration"]
        })

    # 4. Build the prompt and call the LLM
    prompt = PROMPT_TEMPLATE.format(
        user_query=user_query,
        theme=top_theme,
        retrieved_verses=verse_context
    )

    response = llm.invoke(prompt)

    return {
        "theme": top_theme,
        "theme_confidence": top_score,
        "response": response.content,
        "citations": citations
    }

# ── API routes ────────────────────────────────────────────────────────────────
@app.post("/ask")
def ask_shloka_ai(request: QueryRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return run_rag_pipeline(request.query)

@app.get("/")
def root():
    return {"message": "shlokaAI is running. POST to /ask with {'query': '...'}."}
