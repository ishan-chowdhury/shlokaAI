import os
import json
import chromadb
from chromadb.utils import embedding_functions

#This will be creating a chromadb folder in the project
client = chromadb.PersistentClient(path="./chroma_db")

#Which embedding function to use -> for now we shall use default later can change
emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)

#Create a collection where to store all the tables 
collection = client.get_or_create_collection(
    name="gita_verses", 
    embedding_function=emb_fn
)

# Setup lists to hold our batch data before inserting
documents = []
metadatas = []
ids = []

# Path to the directory containing all the sloka JSON files
# Assumes you run the script from the root folder: python scripts/ingest_to_chroma.py
DATA_DIR = "./gita-dataset/slok/"

print("Reading files and extracting data...")

for filename in os.listdir(DATA_DIR):
    if filename.endswith(".json"):
        filepath = os.path.join(DATA_DIR, filename)
        
        with open(filepath, "r", encoding="utf-8") as f:
            verse_data = json.load(f)
            
            # 1. Extract the English Translations
            translations = []
            for key, val in verse_data.items():
                if isinstance(val, dict) and "et" in val:
                    translations.append(f"{val['author']}: {val['et']}")
            
            # Combine them into one string
            document_text = "\n\n".join(translations)
            
            # 2. Extract metadata fields
            chapter = verse_data.get("chapter")
            verse = verse_data.get("verse")
            sanskrit = verse_data.get("slok", "")
            transliteration = verse_data.get("transliteration", "")
            
            # 3. Create a unique ID
            doc_id = f"BG{chapter}.{verse}"
            
            # 4. Append to our batch lists
            # We skip if somehow there is no document text
            if document_text.strip():
                documents.append(document_text)
            else:
                documents.append(transliteration) # fallback
                
            metadatas.append({
                "chapter": chapter,
                "verse": verse,
                "sanskrit": sanskrit,
                "transliteration": transliteration
            })
            ids.append(doc_id)

# Finally, insert everything into the ChromaDB collection
print(f"Adding {len(documents)} verses to ChromaDB. This might take a bit for embeddings...")

# We can add them all at once since 700 verses is a small dataset
collection.add(
    documents=documents,
    metadatas=metadatas,
    ids=ids
)

print("Ingestion complete!")
