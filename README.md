# shlokaAI

shlokaAI is a conversational spiritual guide that uses the wisdom of the Bhagavad Gita to provide practical, empathetic advice for modern life challenges. 

It is designed to feel like speaking with a compassionate therapist. Users can share what is weighing on their mind, and the system will retrieve relevant verses, interpret them simply, and provide contextual guidance while maintaining the history of the conversation.

## Architecture

The project is split into a Python backend and a Next.js frontend.

### Backend (FastAPI & RAG Pipeline)
- Serves as the core logic engine.
- Uses ChromaDB as a local vector store to index and retrieve 719 verses from the Bhagavad Gita.
- Employs HuggingFace sentence-transformers for embedding generation and a zero-shot classifier (BART-large-MNLI) to categorize the user's emotional state or core theme.
- Uses LangChain and the Groq API (running Llama 3.1) to generate the final response. The system prompt is engineered to explain complex scriptural concepts in simple, relatable terms.

### Frontend (Next.js)
- A React-based web application styled with Tailwind CSS.
- Features a light, manuscript-inspired design aesthetic with Devanagari typography support.
- Implements a continuous chat interface with local session storage, allowing users to maintain multiple chat histories completely privately within their browser.

## Local Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- A Groq API key

### 1. Backend Setup

Navigate to the project root and create a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file in the root directory and add your Groq API key:

```text
GROQ_API_KEY=your_key_here
```

Run the FastAPI server:

```bash
./venv/bin/uvicorn api.main:app --reload --port 8000
```

### 2. Frontend Setup

In a new terminal window, navigate to the frontend directory:

```bash
cd frontend
npm install
```

Start the Next.js development server:

```bash
npm run dev -- --port 3000
```

The application will be accessible at http://localhost:3000.
