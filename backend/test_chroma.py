import os
import sys

# Đảm bảo có thể import app.db.chroma
sys.path.append(os.path.dirname(__file__))

from app.db.chroma import get_workspace_collection, get_chroma_client

def test_chroma_setup():
    print("1. Connecting to ChromaDB Persistent Client...")
    client = get_chroma_client()
    
    workspace_id = "test_123"
    print(f"2. Getting or creating collection for workspace_id: {workspace_id}")
    collection = get_workspace_collection(workspace_id)
    
    print("3. Inserting a sample document...")
    collection.add(
        documents=["This is a sample document to test RAG Vector Database"],
        metadatas=[{"source": "test_script", "type": "draft"}],
        ids=["doc_1"]
    )
    
    print("4. Querying the inserted document...")
    results = collection.query(
        query_texts=["sample document"],
        n_results=1
    )
    
    print("\n--- ChromaDB Query Results ---")
    print(results)
    print("------------------------------")
    
    # Check directory
    chroma_dir = os.path.join(os.path.dirname(__file__), "chroma_data")
    if os.path.exists(chroma_dir):
        print(f"\n[SUCCESS] Found ChromaDB storage directory at: {chroma_dir}")
        print("Directory size:", sum(f.stat().st_size for f in os.scandir(chroma_dir) if f.is_file()), "bytes")
    else:
        print("\n[ERROR] Persistent storage directory not found!")

if __name__ == "__main__":
    test_chroma_setup()
