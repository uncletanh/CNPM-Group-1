from app.api.v1.workspaces import get_knowledge_summary
from app.db.chroma import get_chroma_client, get_workspace_collection


def main():
    workspace_id = "999998"
    client = get_chroma_client()
    collection_name = f"workspace_{workspace_id}_knowledge"

    try:
        collection = get_workspace_collection(workspace_id)
        collection.add(
            ids=["knowledge-test-1", "knowledge-test-2"],
            documents=["Noi dung thu nghiem mot", "Noi dung thu nghiem hai"],
            embeddings=[[0.1, 0.2, 0.3], [0.2, 0.3, 0.4]],
            metadatas=[
                {
                    "source_filename": "huong-dan.txt",
                    "chunk_index": 0,
                    "file_size": 2048,
                    "file_type": "txt",
                    "uploaded_at": "2026-07-15T10:00:00+00:00",
                },
                {
                    "source_filename": "huong-dan.txt",
                    "chunk_index": 1,
                    "file_size": 2048,
                    "file_type": "txt",
                    "uploaded_at": "2026-07-15T10:00:00+00:00",
                },
            ],
        )

        summary = get_knowledge_summary(int(workspace_id))
        assert summary.total_documents == 1
        assert summary.total_chunks == 2
        assert summary.documents[0].filename == "huong-dan.txt"
        assert summary.documents[0].file_size == 2048

        matching = collection.get(where={"source_filename": "huong-dan.txt"}, include=[])
        assert len(matching["ids"]) == 2
        collection.delete(ids=matching["ids"])
        assert get_knowledge_summary(int(workspace_id)).total_documents == 0
        print("[SUCCESS] Knowledge listing and deletion test passed.")
    finally:
        try:
            client.delete_collection(collection_name)
        except Exception:
            pass
        try:
            client.delete_collection("workspace_999999_knowledge")
        except Exception:
            pass


if __name__ == "__main__":
    main()
