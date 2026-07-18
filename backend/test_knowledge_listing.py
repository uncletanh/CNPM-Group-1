from uuid import uuid4

from app.api.v1.workspaces import get_knowledge_preview, get_knowledge_summary
from app.db.session import SessionLocal
from app.models.knowledge import KnowledgeChunk
from app.models.workspace import Workspace
from app.services import knowledge_store


def main():
    db = SessionLocal()
    workspace = Workspace(name=f"Knowledge Listing Test {uuid4()}")
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    embedding_version = knowledge_store.current_embedding_version()
    try:
        db.add_all(
            [
                KnowledgeChunk(
                    workspace_id=workspace.id,
                    filename="huong-dan.txt",
                    chunk_index=0,
                    content="Noi dung thu nghiem mot",
                    embedding=[0.1, 0.2, 0.3],
                    embedding_model=embedding_version,
                    file_size=2048,
                    file_type="txt",
                    uploaded_at="2026-07-15T10:00:00+00:00",
                ),
                KnowledgeChunk(
                    workspace_id=workspace.id,
                    filename="huong-dan.txt",
                    chunk_index=1,
                    content="Noi dung thu nghiem hai",
                    embedding=[0.2, 0.3, 0.4],
                    embedding_model=embedding_version,
                    file_size=2048,
                    file_type="txt",
                    uploaded_at="2026-07-15T10:00:00+00:00",
                ),
            ]
        )
        db.commit()

        summary = get_knowledge_summary(workspace.id, db)
        assert summary.total_documents == 1
        assert summary.total_chunks == 2
        assert summary.documents[0].filename == "huong-dan.txt"
        assert summary.documents[0].file_size == 2048

        preview = get_knowledge_preview(workspace.id, "huong-dan.txt", db)
        assert preview.total_chunks == 2
        assert preview.chunks[0].chunk_index == 0
        assert preview.chunks[0].content == "Noi dung thu nghiem mot"
        assert preview.chunks[1].content == "Noi dung thu nghiem hai"

        deleted = knowledge_store.delete_document(db, workspace.id, "huong-dan.txt")
        assert deleted == 2
        assert get_knowledge_summary(workspace.id, db).total_documents == 0
        print("[SUCCESS] Knowledge listing and deletion test passed.")
    finally:
        db.query(KnowledgeChunk).filter(KnowledgeChunk.workspace_id == workspace.id).delete()
        db.delete(workspace)
        db.commit()
        db.close()


if __name__ == "__main__":
    main()
