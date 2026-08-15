# Currently we have the zero shot classifier of the query text
# And we have the chromadb instance ready of the embeddings of the gita text

# Now we need to get the query, classify the query, retreive the relevant verses from the chromadb and then generate the response using llm

import os
import chromadb
from chromadb.utils import embedding_functions
from transformers import pipeline
from langchain_groq import ChatGroq
from dotenv import load_dotenv

# Load environment variables from .env file
# Note: always run this script from the project root so it finds the .env file
load_dotenv()

llm = ChatGroq(
    model="llama-3.1-8b-instant",
    api_key=os.getenv("GROQ_API_KEY")
)

client = chromadb.PersistentClient(path = "./chroma_db")

emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)

collection = client.get_or_create_collection(
    name="gita_verses",
    embedding_function=emb_fn
)

# Zero shot classifier 
classifier = pipeline(
    "zero-shot-classification",
    model = "facebook/bart-large-mnli"
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


# ── Step 1: Retrieve the most relevant verses from ChromaDB ──────────────────
def retrieve_verses(query: str, n_results: int = 3):
    results = collection.query(
        query_texts=[query],
        n_results=n_results
    )
    return results


# ── Step 2: Prompt template ───────────────────────────────────────────────────
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


# ── Step 3: Full pipeline — classify → retrieve → generate ───────────────────
def run_rag_pipeline(user_query: str):
    # 1. Classify the query into a life theme
    theme_result = classifier(user_query, candidate_labels=THEMES)
    top_theme = theme_result["labels"][0]
    print(f"\n🏷️  Detected theme: {top_theme} ({theme_result['scores'][0]:.2f})")

    # 2. Retrieve relevant verses from ChromaDB
    results = retrieve_verses(user_query)

    # 3. Format the retrieved verses for the prompt
    verse_context = ""
    for i, doc in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i]
        verse_context += f"\nBG {meta['chapter']}.{meta['verse']}:\n{doc}\n"

    print(f"\n📖 Retrieved {len(results['documents'][0])} verses")

    # 4. Build the prompt and call the LLM
    prompt = PROMPT_TEMPLATE.format(
        user_query=user_query,
        theme=top_theme,
        retrieved_verses=verse_context
    )

    response = llm.invoke(prompt)
    print("\n✨ shlokaAI says:\n")
    print(response.content)


# ── Run it ────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    user_query = "I am afraid of failure and feeling lost in life"
    run_rag_pipeline(user_query)