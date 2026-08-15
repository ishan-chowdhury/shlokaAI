
import chromadb
from chromadb.utils import embedding_functions

client = chromadb.PersistentClient(path = "./chroma_db")

emb_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
)   
collection = client.get_collection(name = "gita_verses",
embedding_function= emb_fn)

#Try a sample query and see if this works 

results = collection.query(
    query_texts = ["I am afraid of failure and feeling lost in life"],
    n_results= 3
)

for i, doc in enumerate(results["documents"][0]):
    meta = results["metadatas"][0][i]
    print(f"\n--- Result {i+1} | BG {meta['chapter']}.{meta['verse']} ---")
    print(f"Sanskrit: {meta['sanskrit'][:80]}...")
    print(f"Transliteration: {meta['transliteration'][:80]}...")
    print(f"Translation snippet: {doc[:300]}...")