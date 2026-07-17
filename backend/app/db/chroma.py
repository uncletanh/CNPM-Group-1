import os

import chromadb
from chromadb.config import Settings

from app.services.embeddings import get_embedding_collection_suffix

# Thư mục lưu trữ dữ liệu vector, tự động tạo nếu chưa có.
CHROMA_DATA_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "chroma_data",
)
CHROMA_SETTINGS = Settings(
    anonymized_telemetry=False,
    allow_reset=True,
)

# Khởi tạo Persistent Client để dữ liệu không bị mất khi restart server.
chroma_client = chromadb.PersistentClient(
    path=CHROMA_DATA_DIR,
    settings=CHROMA_SETTINGS,
)


def get_chroma_client() -> chromadb.PersistentClient:
    """Trả về client kết nối với Vector DB."""
    return chroma_client


def get_knowledge_collection_name(workspace_id: str | int) -> str:
    return f"workspace_{workspace_id}_knowledge_{get_embedding_collection_suffix()}"


def get_workspace_collection(workspace_id: str):
    """
    Trả về hoặc tự động tạo mới một collection riêng cho workspace_id.
    Logic này đảm bảo dữ liệu vector của các workspace được phân tách.
    """
    collection_name = get_knowledge_collection_name(workspace_id)

    return chroma_client.get_or_create_collection(
        name=collection_name,
        metadata={"description": f"Vector data for Workspace {workspace_id}"},
    )
