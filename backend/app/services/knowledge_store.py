from datetime import datetime, timezone

from langchain_core.documents import Document
from sqlalchemy.orm import Session

from app.models.knowledge import KnowledgeChunk
from app.services.embeddings import get_embedding_model


def current_embedding_version() -> str:
    return str(getattr(get_embedding_model(), "collection_suffix", "unknown-v1"))


def to_document(chunk: KnowledgeChunk) -> Document:
    metadata = {
        "source_filename": chunk.filename,
        "chunk_index": chunk.chunk_index,
        "file_size": chunk.file_size,
        "file_type": chunk.file_type,
        "uploaded_at": chunk.uploaded_at,
    }
    metadata.update(chunk.extra_metadata or {})
    return Document(page_content=chunk.content, metadata=metadata)


def get_workspace_chunks(
    db: Session,
    workspace_id: int,
    embedding_version: str | None = None,
    filename: str | None = None,
) -> list[KnowledgeChunk]:
    query = db.query(KnowledgeChunk).filter(KnowledgeChunk.workspace_id == workspace_id)
    if embedding_version is not None:
        query = query.filter(KnowledgeChunk.embedding_model == embedding_version)
    if filename is not None:
        query = query.filter(KnowledgeChunk.filename == filename)
    return query.order_by(KnowledgeChunk.chunk_index).all()


def replace_document_chunks(
    db: Session,
    workspace_id: int,
    filename: str,
    documents: list[Document],
    file_size: int,
    file_type: str,
) -> tuple[int, str]:
    embedding_model = get_embedding_model()
    embedding_version = str(getattr(embedding_model, "collection_suffix", "unknown-v1"))
    vectors = embedding_model.embed_documents([document.page_content for document in documents])
    uploaded_at = datetime.now(timezone.utc).isoformat()

    db.query(KnowledgeChunk).filter(
        KnowledgeChunk.workspace_id == workspace_id,
        KnowledgeChunk.filename == filename,
    ).delete()

    for index, (document, vector) in enumerate(zip(documents, vectors)):
        extra_metadata = {
            key: value
            for key, value in (document.metadata or {}).items()
            if key
            not in {
                "workspace_id",
                "source_filename",
                "chunk_index",
                "file_size",
                "file_type",
                "uploaded_at",
            }
        }
        db.add(
            KnowledgeChunk(
                workspace_id=workspace_id,
                filename=filename,
                chunk_index=index,
                content=document.page_content,
                embedding=vector,
                embedding_model=embedding_version,
                file_size=file_size,
                file_type=file_type,
                uploaded_at=uploaded_at,
                extra_metadata=extra_metadata or None,
            )
        )
    db.commit()
    return len(documents), embedding_version


def delete_document(db: Session, workspace_id: int, filename: str) -> int:
    deleted = (
        db.query(KnowledgeChunk)
        .filter(
            KnowledgeChunk.workspace_id == workspace_id,
            KnowledgeChunk.filename == filename,
        )
        .delete()
    )
    db.commit()
    return deleted
