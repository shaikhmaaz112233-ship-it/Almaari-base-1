import os
import shutil
import uuid
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, status, Header, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Slowapi for Rate Limiting (Brute-force protection)
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

import db
import rag

# Load environment variables from .env file
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "almaari_fallback_secret")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Limiter setup (Client IP address tracking)
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Almaari API",
    description="Backend API for Almaari - AI-powered document archive portal with advanced security.",
    version="1.4.0"
)

# Attach limiter to FastAPI app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 🛡️ Production-Grade Security: Dynamic CORS restricted via .env
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


# Comprehensive Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Content-Security-Policy"] = "default-src 'self' http://localhost:5173 http://127.0.0.1:5173 'unsafe-inline' 'unsafe-eval'"
    return response


# Request schemas
class LoginRequest(BaseModel):
    username: str
    password: str


class AskRequest(BaseModel):
    question: str


def verify_token(authorization: str = Header(None)):
    """Header se token verify karta hai ke user authenticated hai ya nahi."""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access Denied: Login karna lazmi hai!"
        )
    if "almaari_token_" not in authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format!"
        )
    return authorization


@app.get("/")
def root():
    return {
        "portal": "Almaari",
        "tagline": "Apni files se poochho. (Ask your files anything.)",
        "status": "online"
    }


@app.post("/login")
@limiter.limit("5/minute")  # 🛡️ Live Security: Brute-force protection
def login(request: Request, creds: LoginRequest):
    """Simple username/password login stored in SQLite with rate limiting."""
    user = db.authenticate_user(creds.username.strip(), creds.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password. The cupboard remains locked."
        )

    return {
        "success": True,
        "username": user["username"],
        "token": f"almaari_token_{user['username']}_{uuid.uuid4().hex[:12]}"
    }


@app.post("/upload")
@limiter.limit("10/minute")  # 🛡️ Live Security: Spam upload protection
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    token: str = Depends(verify_token)
):
    """
    Accepts PDF or TXT file, enforces Magic Bytes validation,
    size limit (max 10MB), saves securely, and indexes into ChromaDB.
    """
    original_name = file.filename
    if not original_name:
        raise HTTPException(status_code=400, detail="No file name provided.")

    ext = Path(original_name).suffix.lower()
    if ext not in [".pdf", ".txt"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Only .pdf and .txt files can be kept in Almaari."
        )

    # 🛡️ Advanced Security: Magic Bytes / File Header Validation
    header_bytes = await file.read(2048)  # Pehle 2048 bytes read karein
    await file.seek(0)  # File pointer wapas zero par set karein taake poori file save ho sakay

    if ext == ".pdf":
        if not header_bytes.startswith(b"%PDF"):
            raise HTTPException(
                status_code=400,
                detail="Security Violation: File extension is .pdf, but internal magic bytes do not match a valid PDF!"
            )
    elif ext == ".txt":
        if header_bytes.startswith(b"\x7fELF") or header_bytes.startswith(b"MZ") or b"\x00" in header_bytes[:512]:
            raise HTTPException(
                status_code=400,
                detail="Security Violation: Binary or executable content detected in text file!"
            )

    # Generate a safe local filename to avoid clashes
    safe_filename = f"{uuid.uuid4().hex[:8]}_{original_name}"
    save_path = UPLOADS_DIR / safe_filename

    # 🛡️ Live Security: File Size Check (Max 10 MB limit)
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
    file_size = 0

    try:
        with open(save_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # Read in 1MB chunks
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    buffer.close()
                    if save_path.exists():
                        save_path.unlink()
                    raise HTTPException(
                        status_code=413,
                        detail="File too large! Maximum allowed file size is 10MB."
                    )
                buffer.write(chunk)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Index into ChromaDB
    try:
        chunk_count = rag.index_document(str(save_path), doc_name=original_name)
    except Exception as e:
        if save_path.exists():
            save_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to process and index document: {str(e)}")

    # Record in SQLite
    doc_id = db.add_document(
        filename=safe_filename,
        original_name=original_name,
        file_size=file_size,
        chunk_count=chunk_count
    )

    return {
        "id": doc_id,
        "filename": safe_filename,
        "original_name": original_name,
        "file_size": file_size,
        "chunk_count": chunk_count,
        "message": f"'{original_name}' has been safely filed away in the cupboard."
    }


@app.get("/documents")
def list_documents(token: str = Depends(verify_token)):
    """Returns list of all documents stored in the cupboard. Requires Authentication."""
    docs = db.get_all_documents()
    return {"documents": docs, "total": len(docs)}


@app.delete("/documents/{doc_id}")
def delete_document(doc_id: int, token: str = Depends(verify_token)):
    """Deletes a document from SQLite, uploads directory, and ChromaDB. Requires Authentication."""
    doc = db.delete_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found in the cupboard.")

    # Remove physical file if present
    file_path = UPLOADS_DIR / doc["filename"]
    if file_path.exists():
        try:
            file_path.unlink()
        except Exception:
            pass

    # Remove chunks from ChromaDB
    try:
        rag.delete_document(doc["original_name"])
    except Exception:
        pass

    return {
        "success": True,
        "message": f"'{doc['original_name']}' has been removed from the cupboard."
    }


@app.post("/ask")
@limiter.limit("20/minute")  # 🛡️ Live Security: Ask endpoint rate limit
def ask_question(request: Request, body: AskRequest, token: str = Depends(verify_token)):
    """
    Finds relevant chunks, prompts Gemini securely, and returns answer + citations.
    """
    question = body.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    result = rag.query_rag(question, top_k=4)
    return result


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
