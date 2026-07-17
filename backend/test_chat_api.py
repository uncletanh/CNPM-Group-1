import json
from uuid import uuid4
from fastapi.testclient import TestClient
from langchain_chroma import Chroma

from app.api.v1 import chat as chat_api
from app.db.chroma import CHROMA_DATA_DIR, CHROMA_SETTINGS, get_knowledge_collection_name
from app.db.session import SessionLocal
from app.main import app
from app.models.chat import ChatSession, Message
from app.models.workspace import Workspace


class FakeEmbeddings:
    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._embed(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._embed(text)

    def _embed(self, text: str) -> list[float]:
        lowered = text.lower()
        return [
            1.0 if "nova" in lowered or "pricing" in lowered or "giá" in lowered else 0.0,
            1.0 if "support" in lowered or "hỗ trợ" in lowered else 0.0,
            float(len(text) % 10) / 10.0,
        ]


class FakeLLMProvider:
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        assert "NovaChat có gói miễn phí" in user_prompt
        return "NovaChat có gói miễn phí cho workspace thử nghiệm."

    def generate_stream(self, system_prompt: str, user_prompt: str):
        assert "NovaChat có gói miễn phí" in user_prompt
        yield "NovaChat có gói miễn phí cho workspace thử nghiệm."


def run_chat_api_test() -> None:
    chat_api.get_embedding_model = lambda: FakeEmbeddings()
    chat_api.get_llm_provider = lambda: FakeLLMProvider()

    db = SessionLocal()
    workspace = Workspace(
        name=f"Chat API Test {uuid4()}",
        system_prompt="Bạn là trợ lý NovaChat. Chỉ trả lời dựa trên context.",
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    collection_name = get_knowledge_collection_name(workspace.id)
    vector_store = None
    try:
        vector_store = Chroma(
            collection_name=collection_name,
            embedding_function=FakeEmbeddings(),
            persist_directory=CHROMA_DATA_DIR,
            client_settings=CHROMA_SETTINGS,
        )
        vector_store.add_texts(
            texts=["NovaChat có gói miễn phí cho workspace thử nghiệm."],
            metadatas=[{"source_filename": "pricing.md", "chunk_index": 0}],
            ids=[f"chat-api-test-{workspace.id}-0"],
        )

        client = TestClient(app)

        # /chat yeu cau xac thuc: goi thieu widget_token phai bi tu choi 401.
        unauthorized = client.post(
            f"/api/v1/chat/{workspace.id}",
            json={"message": "NovaChat có gói giá miễn phí không?", "top_k": 1},
        )
        assert unauthorized.status_code == 401, unauthorized.text

        response = client.post(
            f"/api/v1/chat/{workspace.id}",
            json={"message": "NovaChat có gói giá miễn phí không?", "top_k": 1},
            headers={"X-Widget-Token": workspace.widget_token},
        )

        assert response.status_code == 200, response.text
        payload = response.json()
        assert payload["workspace_id"] == workspace.id
        assert payload["session_key"]
        assert payload["context_chunks"] == 1
        assert payload["answer"] == "NovaChat có gói miễn phí cho workspace thử nghiệm."
        assert payload["sources"][0]["source_filename"] == "pricing.md"
        assert payload["sources"][0]["chunk_index"] == 0
        print("[SUCCESS] Chat API RAG test passed.")
        print(json.dumps(payload, ensure_ascii=True))

        with client.stream(
            "POST",
            f"/api/v1/chat/{workspace.id}/stream",
            json={"message": "NovaChat có gói giá miễn phí không?", "top_k": 1},
            headers={
                "Accept": "text/event-stream",
                "X-Widget-Token": workspace.widget_token,
            },
        ) as stream_response:
            assert stream_response.status_code == 200, stream_response.text
            assert stream_response.headers["content-type"].startswith("text/event-stream")

            chunks = []
            for raw_line in stream_response.iter_lines():
                if raw_line.startswith("data:"):
                    chunks.append(json.loads(raw_line[len("data:"):].strip()))

        assert "NovaChat có gói miễn phí cho workspace thử nghiệm." in chunks
        assert any(
            isinstance(chunk, dict) and chunk.get("context_chunks") == 1
            for chunk in chunks
        )
        print("[SUCCESS] Chat API streaming SSE test passed.")
    finally:
        if vector_store is not None:
            vector_store.delete_collection()
        # Xoa cac phien chat + tin nhan da tao trong luc test (tranh de rac trong DB).
        sessions = db.query(ChatSession).filter(ChatSession.workspace_id == workspace.id).all()
        for session in sessions:
            db.query(Message).filter(Message.session_id == session.id).delete()
            db.delete(session)
        db.delete(workspace)
        db.commit()
        db.close()


if __name__ == "__main__":
    run_chat_api_test()
