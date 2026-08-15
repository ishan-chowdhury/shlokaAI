import os
import chromadb
from chromadb.utils import embedding_functions
from transformers import pipeline as hf_pipeline
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

# ── Load environment variables ────────────────────────────────────────────────
load_dotenv()

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(title="shlokaAI", description="Bhagavad Gita RAG Advisor")

class Message(BaseModel):
    role: str
    content: str

class QueryRequest(BaseModel):
    query: str
    history: Optional[List[Message]] = []

class TitleRequest(BaseModel):
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
You are shlokaAI, a compassionate, warm, and wise spiritual guide rooted in the Bhagavad Gita.
You speak like a gentle therapist—understanding, patient, and deeply empathetic. Your goal is to explain complicated spiritual and philosophical concepts in a very simple, easy-to-understand manner, avoiding robotic or overly academic language.

A person has shared their feelings with you:
"{user_query}"

The detected life theme is: {theme}

Using ONLY the following verses from the Bhagavad Gita, provide grounded advice. 
- Speak directly to the person with warmth.
- Explain the verses simply and practically, as if you are a wise friend holding their hand.
- Always cite the verse (e.g., BG 2.47) for every point.
- Do NOT invent scripture or add verses not provided below.
- Take into account the conversation history below to provide a continuous, contextual response.

--- CONVERSATION HISTORY ---
{history}
----------------------------

--- RETRIEVED VERSES ---
{retrieved_verses}
------------------------

Your response:
"""

# ── Core pipeline logic ───────────────────────────────────────────────────────
def run_rag_pipeline(user_query: str, history: List[Message]) -> dict:
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

    # Format history
    history_text = ""
    if history:
        for msg in history[-4:]: # Only take last 4 messages for context window management
            role_name = "User" if msg.role == "user" else "shlokaAI"
            history_text += f"{role_name}: {msg.content}\n"
    if not history_text:
        history_text = "No prior history."

    # 4. Build the prompt and call the LLM
    prompt = PROMPT_TEMPLATE.format(
        user_query=user_query,
        theme=top_theme,
        history=history_text,
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
    return run_rag_pipeline(request.query, request.history or [])

@app.get("/")
def root():
    return {"message": "shlokaAI is running. POST to /ask with {'query': '...', 'history': []}."}

@app.post("/generate-title")
def generate_title(request: TitleRequest):
    if not request.query.strip():
        return {"title": "New Chat"}
    
    prompt = f"Generate a short, 3-4 word spiritual title for a conversation that starts with this message. Only output the title, nothing else: '{request.query}'"
    response = llm.invoke(prompt)
    title = response.content.strip().replace('"', '')
    return {"title": title}
