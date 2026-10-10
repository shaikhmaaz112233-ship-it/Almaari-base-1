import sys
import os
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))

from rag import index_document, query_rag, get_chroma_collection


def main():
    print("=" * 60)
    print(" Almaari RAG Engine Test (Stage 1)")
    print(" 'Apni files se poochho' / 'Ask your files anything'")
    print("=" * 60)

    # 1. Create a sample document
    uploads_dir = Path(__file__).resolve().parent / "uploads"
    uploads_dir.mkdir(exist_ok=True)
    sample_file = uploads_dir / "office_handbook.txt"

    sample_content = """
Almaari Technologies - Employee Handbook & Office Notes

1. Working Hours & Work from Home
The standard working hours are 10:00 AM to 6:30 PM, Monday through Friday.
Employees are allowed up to two remote work days per week with prior manager intimation.
Core collaboration hours where everyone must be reachable on Slack are 11:30 AM to 4:30 PM.

2. Office Facilities & Pantry
The office pantry on the 2nd floor is stocked with fresh seasonal fruits, tea, filter coffee, and oat milk.
Lunch is served daily at 1:15 PM in the central cafeteria.
Pantry snacks are replenished every Tuesday and Friday morning.

3. Network & Security
The primary Wi-Fi network for team members is 'Almaari-Secure-5G'.
The guest Wi-Fi network is 'Almaari-Guest', and the password is 'ArchiveRoom2026'.
All production database keys must be kept in the 1Password company vault and never committed into Git.

4. Expense Reimbursements
Travel and meal expenses incurred during official client visits must be submitted by the 25th of each month.
Reimbursements above 5,000 INR require prior sign-off from the department head.
Approved claims are processed and disbursed along with the monthly payroll on the 1st of every month.
"""

    with open(sample_file, "w", encoding="utf-8") as f:
        f.write(sample_content.strip())
    print(f"\n[+] Created sample document: {sample_file.name}")

    # 2. Index the document
    print("[*] Indexing document into ChromaDB...")
    num_chunks = index_document(str(sample_file))
    print(f"[+] Successfully indexed {num_chunks} chunk(s) from '{sample_file.name}'")

    collection = get_chroma_collection()
    print(f"[+] Total documents/chunks currently in Almaari cupboard: {collection.count()}")

    # 3. Test Query 1: Information present in document
    query1 = "What is the guest Wi-Fi password and what time is lunch served?"
    print(f"\n" + "-" * 60)
    print(f"Test Query 1: '{query1}'")
    print("-" * 60)

    res1 = query_rag(query1)
    print("\n[AI Answer]:")
    print(res1["answer"])
    print("\n[Source Files]:", res1.get("sources", []))
    print("[Chunks Retrieved]:", len(res1.get("chunks", [])))
    for idx, ch in enumerate(res1.get("chunks", [])):
        print(f"  - Chunk {idx+1} from '{ch.get('source')}': {ch.get('text')[:90]}...")

    # 4. Test Query 2: Information NOT in document (Negative test)
    query2 = "Who is the Prime Minister of Australia?"
    print(f"\n" + "-" * 60)
    print(f"Test Query 2 (Negative / Not in docs): '{query2}'")
    print("-" * 60)

    res2 = query_rag(query2)
    print("\n[AI Answer]:")
    print(res2["answer"])
    print("\n[Source Files]:", res2.get("sources", []))
    print("=" * 60)
    print("Stage 1 RAG test complete.")
    print("=" * 60)


if __name__ == "__main__":
    main()
