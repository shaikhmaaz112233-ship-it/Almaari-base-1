import os
import re
from pathlib import Path
from dotenv import load_dotenv
import chromadb
from chromadb.utils import embedding_functions
import google.generativeai as genai
from pypdf import PdfReader

# Load environment variables (.env)
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# ChromaDB persistence directory
CHROMA_DATA_PATH = str(BASE_DIR / "chroma_db")

# Embedding model: sentence-transformers/all-MiniLM-L6-v2
# ChromaDB handles downloading and caching this lightweight model automatically.
embedding_func = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="all-MiniLM-L6-v2"
)


def get_chroma_collection():
    """Initializes and returns the persistent ChromaDB collection."""
    client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)
    collection = client.get_or_create_collection(
        name="almaari_documents",
        embedding_function=embedding_func
    )
    return collection


def extract_text(file_path: str) -> str:
    """Extracts raw text from a TXT or PDF file."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    ext = path.suffix.lower()
    if ext == ".txt":
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

    elif ext == ".pdf":
        reader = PdfReader(str(path))
        pages_text = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                pages_text.append(text)
        return "\n\n".join(pages_text)

    else:
        raise ValueError(f"Unsupported file format '{ext}'. Only .pdf and .txt are supported.")


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Splits text into chunks of roughly ~500 words with a 50-word overlap
    to preserve context across chunk boundaries.
    """
    # Normalize whitespaces
    words = re.findall(r'\S+', text)
    if not words:
        return []

    chunks = []
    step = chunk_size - overlap
    if step <= 0:
        step = chunk_size

    for i in range(0, len(words), step):
        chunk_words = words[i:i + chunk_size]
        chunks.append(" ".join(chunk_words))
        if i + chunk_size >= len(words):
            break

    return chunks


def index_document(file_path: str, doc_name: str = None) -> int:
    """
    Extracts text from the file, splits it into chunks,
    and inserts them into ChromaDB with metadata.
    Returns the number of chunks indexed.
    """
    path = Path(file_path)
    filename = doc_name or path.name

    text = extract_text(file_path)
    chunks = chunk_text(text, chunk_size=500, overlap=50)

    if not chunks:
        return 0

    collection = get_chroma_collection()

    # If this document was previously indexed, clear previous chunks first
    try:
        collection.delete(where={"source": filename})
    except Exception:
        pass

    # Prepare batch data
    ids = [f"{filename}_{idx}" for idx in range(len(chunks))]
    metadatas = [{"source": filename, "chunk_index": idx} for idx in range(len(chunks))]

    collection.add(
        ids=ids,
        documents=chunks,
        metadatas=metadatas
    )

    return len(chunks)


def delete_document(filename: str):
    """Removes all indexed chunks associated with the given file name."""
    collection = get_chroma_collection()
    collection.delete(where={"source": filename})


def query_rag(query: str, top_k: int = 4) -> dict:
    """
    Finds the top 4 relevant chunks from ChromaDB and sends them to Gemini.
    Returns a dict with 'answer', 'sources' list, and 'chunks' used.
    """
    collection = get_chroma_collection()

    count = collection.count()
    if count == 0:
        return {
            "answer": "The cupboard is empty. Please upload some documents first.",
            "sources": [],
            "chunks": []
        }

    # Query ChromaDB for top_k most similar chunks
    results = collection.query(
        query_texts=[query],
        n_results=min(top_k, count)
    )

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]

    if not documents:
        return {
            "answer": "I could not find any relevant information in your uploaded documents.",
            "sources": [],
            "chunks": []
        }

    # Format context for Gemini
    context_blocks = []
    sources = []
    chunks_info = []

    for i, (doc, meta) in enumerate(zip(documents, metadatas)):
        source_name = meta.get("source", "Unknown file")
        context_blocks.append(f"[Document: {source_name}]\n{doc}")
        if source_name not in sources:
            sources.append(source_name)
        chunks_info.append({
            "source": source_name,
            "chunk_index": meta.get("chunk_index", i),
            "text": doc
        })

    combined_context = "\n\n---\n\n".join(context_blocks)

    # Prompt matching exact system instructions:
    # "Answer only from the context below. If the answer is not there, say you don't know."
    prompt = f"""Context:
{combined_context}

Question:
{query}

Instruction:
Answer only from the context below. If the answer is not there, say you don't know."""

    # Generate answer with Gemini
    load_dotenv(BASE_DIR / ".env", override=True)
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return {
            "answer": "Gemini API key is not configured in .env. Please set GEMINI_API_KEY.",
            "sources": sources,
            "chunks": chunks_info
        }

    try:
        genai.configure(api_key=api_key)
        # Use gemini-3.8-flash as recommended by the current Gemini API
        try:
            model = genai.GenerativeModel("gemini-3.8-flash")
            response = model.generate_content(prompt)
            answer = response.text.strip()
        except Exception:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            answer = response.text.strip()
    except Exception as e:
        answer = f"Error generating answer from Gemini: {e}"

    return {
        "answer": answer,
        "sources": sources,
        "chunks": chunks_info
    }
