import json
from pathlib import Path

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.services.embeddings import FeatureHashEmbeddings
from app.services.retrieval import bm25_scores, hybrid_rank, tokenize


def document(content: str, index: int) -> Document:
    return Document(
        page_content=content,
        metadata={"source_filename": "policy.txt", "chunk_index": index},
    )


def test_bm25_supports_vietnamese_and_domain_aliases():
    documents = [
        "Đơn từ 800.000 đồng được miễn phí vận chuyển.",
        "Sản phẩm Premium được bảo hành 24 tháng.",
    ]

    scores = bm25_scores(documents, "Đơn 900 nghìn có được free ship không?")

    assert scores[0] > scores[1]
    assert "van" in tokenize("ship")
    assert "chuyen" in tokenize("ship")


def test_hybrid_rank_fuses_semantic_and_bm25_results(monkeypatch):
    warranty = document("Sản phẩm Premium được bảo hành 24 tháng.", 0)
    shipping = document("Đơn từ 800.000 đồng được miễn phí vận chuyển.", 1)
    unrelated = document("Trung tâm hỗ trợ nghỉ Chủ nhật.", 2)
    monkeypatch.setenv("BM25_MIN_SCORE", "0.5")

    ranked = hybrid_rank(
        semantic_results=[(shipping, 0.4), (unrelated, 1.5)],
        all_documents=[warranty, shipping, unrelated],
        query="Đơn 900 nghìn có được free ship không?",
        top_k=2,
        max_distance=0.9,
    )

    assert ranked[0].document == shipping
    assert all(item.document != unrelated for item in ranked)


def test_hybrid_rank_accepts_strong_lexical_result_without_semantic_hit(monkeypatch):
    warranty = document("Sản phẩm Premium được bảo hành 24 tháng.", 0)
    monkeypatch.setenv("BM25_MIN_SCORE", "0.1")

    ranked = hybrid_rank([], [warranty], "Premium bảo hành bao lâu?", 1, 0.9)

    assert ranked[0].document == warranty
    assert ranked[0].distance is None


def test_local_hybrid_baseline_preserves_out_of_scope_handoff(monkeypatch):
    evaluation_dir = Path(__file__).resolve().parents[1] / "evaluation"
    policy = (evaluation_dir / "minh_an_support_policy.txt").read_text(encoding="utf-8")
    cases = json.loads(
        (evaluation_dir / "rag_evaluation_50.json").read_text(encoding="utf-8")
    )["cases"]
    chunks = RecursiveCharacterTextSplitter(
        chunk_size=600,
        chunk_overlap=100,
        separators=["\n\n", "\n", ". ", " ", ""],
    ).split_documents(
        [Document(page_content=policy, metadata={"source_filename": "minh_an_support_policy.txt"})]
    )
    for index, chunk in enumerate(chunks):
        chunk.metadata["chunk_index"] = index

    model = FeatureHashEmbeddings()
    chunk_vectors = model.embed_documents([chunk.page_content for chunk in chunks])
    monkeypatch.setenv("BM25_MIN_SCORE", "5.5")
    answer_hits = 0
    handoff_hits = 0

    for case in cases:
        if case["category"] == "prompt_injection":
            continue
        history = "\n".join(
            turn["content"]
            for turn in case.get("conversation", [])
            if turn.get("role") == "user"
        )
        query = (
            f"Ngữ cảnh trước đó:\n{history}\nCâu hỏi hiện tại:\n{case['question']}"
            if history
            else case["question"]
        )
        query_vector = model.embed_query(query)
        distances = [
            sum((left - right) ** 2 for left, right in zip(query_vector, vector))
            for vector in chunk_vectors
        ]
        semantic = sorted(zip(chunks, distances), key=lambda item: item[1])[:10]
        actual = "answer" if hybrid_rank(
            semantic,
            chunks,
            query,
            top_k=3,
            max_distance=model.default_max_distance,
        ) else "handoff"
        if case["expected_behavior"] == "answer" and actual == "answer":
            answer_hits += 1
        if case["expected_behavior"] == "handoff" and actual == "handoff":
            handoff_hits += 1

    assert answer_hits >= 30
    assert handoff_hits == 6
