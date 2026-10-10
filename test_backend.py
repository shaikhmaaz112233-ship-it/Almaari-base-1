import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from main import app
import db

client = TestClient(app)

print("=" * 60)
print(" Almaari Backend API Test (Stage 2)")
print("=" * 60)

# 1. Test Root
r_root = client.get("/")
print(f"[+] GET / status: {r_root.status_code}, response: {r_root.json()}")
assert r_root.status_code == 200

# 2. Test Login (Success)
r_login = client.post("/login", json={"username": "admin", "password": "almaari123"})
print(f"[+] POST /login (success) status: {r_login.status_code}, response: {r_login.json()}")
assert r_login.status_code == 200
assert r_login.json()["success"] is True

# 3. Test Login (Failure)
r_login_bad = client.post("/login", json={"username": "admin", "password": "wrongpassword"})
print(f"[+] POST /login (invalid) status: {r_login_bad.status_code}")
assert r_login_bad.status_code == 401

# 4. Test Upload
test_content = b"Almaari Security Protocol: All employee access cards must be renewed every six months at the front desk."
files = {"file": ("security_protocol.txt", test_content, "text/plain")}
r_upload = client.post("/upload", files=files)
print(f"[+] POST /upload status: {r_upload.status_code}, response: {r_upload.json()}")
assert r_upload.status_code == 200
doc_id = r_upload.json()["id"]

# 5. Test List Documents
r_docs = client.get("/documents")
print(f"[+] GET /documents status: {r_docs.status_code}, total: {r_docs.json()['total']}")
assert r_docs.status_code == 200
assert any(d["id"] == doc_id for d in r_docs.json()["documents"])

# 6. Test Ask Question
r_ask = client.post("/ask", json={"question": "How often do access cards need renewal?"})
print(f"[+] POST /ask status: {r_ask.status_code}")
print(f"    Answer: {r_ask.json()['answer']}")
print(f"    Sources: {r_ask.json().get('sources', [])}")
assert r_ask.status_code == 200

# 7. Test Delete Document
r_del = client.delete(f"/documents/{doc_id}")
print(f"[+] DELETE /documents/{doc_id} status: {r_del.status_code}, response: {r_del.json()}")
assert r_del.status_code == 200

# Verify deleted
r_docs_after = client.get("/documents")
assert not any(d["id"] == doc_id for d in r_docs_after.json()["documents"])
print(f"[+] Verified document deletion. Remaining: {r_docs_after.json()['total']}")

print("=" * 60)
print("All Stage 2 API endpoints verified successfully!")
print("=" * 60)
