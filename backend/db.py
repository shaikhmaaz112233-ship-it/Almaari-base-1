import sqlite3
import os
from pathlib import Path
from datetime import datetime
import bcrypt

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "almaari.db"


def get_db_connection():
    """Returns a SQLite connection with row factory enabled."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password: str) -> str:
    """Hashes a password using pure secure bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(stored_hash: str, password: str) -> bool:
    """Verifies a password against the stored bcrypt hash using pure bcrypt."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
    except Exception:
        return False


def init_db():
    """Initializes tables and seeds the demo user if not present."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Documents table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE NOT NULL,
            original_name TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            chunk_count INTEGER NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Seed demo user 'admin' with password 'almaari123' using bcrypt
    cursor.execute("SELECT id FROM users WHERE username = ?", ("admin",))
    if not cursor.fetchone():
        demo_hash = hash_password("almaari123")
        cursor.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            ("admin", demo_hash)
        )

    conn.commit()
    conn.close()


def authenticate_user(username: str, password: str):
    """Authenticates username and password against SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if user and verify_password(user["password_hash"], password):
        return dict(user)
    return None


def add_document(filename: str, original_name: str, file_size: int, chunk_count: int) -> int:
    """Adds a document record and returns the new document ID."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Remove existing record with same original_name if re-uploaded
    cursor.execute("DELETE FROM documents WHERE original_name = ?", (original_name,))

    cursor.execute("""
        INSERT INTO documents (filename, original_name, file_size, chunk_count, uploaded_at)
        VALUES (?, ?, ?, ?, ?)
    """, (filename, original_name, file_size, chunk_count, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))

    doc_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return doc_id


def get_all_documents() -> list[dict]:
    """Retrieves all document records ordered by latest upload."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, original_name, file_size, chunk_count, uploaded_at FROM documents ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_document_by_id(doc_id: int):
    """Retrieves single document by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def delete_document_by_id(doc_id: int):
    """Deletes a document record by ID and returns the deleted doc info."""
    doc = get_document_by_id(doc_id)
    if not doc:
        return None

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    conn.close()
    return doc


# Run init on module load
init_db()
