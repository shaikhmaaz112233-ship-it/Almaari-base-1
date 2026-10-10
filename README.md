# Almaari (अलमारी)

> **"Apni files se poochho."** *(Ask your files anything.)*

Almaari is a private, warm, editorial document search portal designed as an archival cupboard for company documents. Employees upload files (`.pdf`, `.txt`), then ask questions in an archive chatroom. The AI answers strictly from the uploaded documents using RAG, and highlights which file each answer originated from.

---

## Tech Stack

- **Backend**: Python, FastAPI, SQLite (salted SHA-256 password hashing), CORS enabled
- **AI & RAG**: `sentence-transformers` (`all-MiniLM-L6-v2`), ChromaDB (persistent vector storage), Gemini 3.8 Flash
- **Frontend**: React + Vite + Framer Motion + Plain CSS (CSS Variables)
  - **Colors**: Paper (`#EDE6D3`), Ink (`#151A17`), Verdigris (`#2E6B5E`), Vermilion (`#E1452C`), Mustard (`#D8A23A`)
  - **Fonts**: Fraunces (Headings), Instrument Sans (Body), JetBrains Mono (Code & Citations)
  - **Interactions**: Animated cupboard door SVG logo, drag-and-drop file shelf, swipe-to-delete cards, word-by-word typewriter answer, and press-and-hold context preview

---

## Project Structure

```text
├── backend/
│   ├── main.py        # FastAPI routes: /login, /upload, /documents, /ask
│   ├── db.py          # SQLite schema (users, documents) & password verification
│   └── rag.py         # Text extraction, chunking, embeddings, ChromaDB, Gemini Q&A
├── frontend/          # React + Vite frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── CupboardLogo.jsx # Animated cupboard SVG
│   │   │   └── Navbar.jsx       # Archival navigation
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx    # Animated login
│   │   │   ├── DocumentsPage.jsx# Drag-and-drop upload & swipe-to-delete
│   │   │   └── ChatPage.jsx     # Typewriter answer, citations & chunk preview
│   │   ├── api.js               # API client
│   │   ├── App.jsx              # Routes & page transitions
│   │   └── index.css            # Archival design tokens
│   └── vite.config.js
├── uploads/           # Uploaded files
├── requirements.txt   # Python backend dependencies
└── .env.example       # Environment template
```

---

## Getting Started

### 1. Backend Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd Almaari

# Install Python requirements
pip install -r requirements.txt

# Create .env and configure your Gemini API key
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here

# Start backend server
cd backend
python -m uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

**Default Demo Credentials:**
- **Identity:** `admin`
- **Cupboard Key:** `almaari123`

---

## License
Private Student Project. Local only.
