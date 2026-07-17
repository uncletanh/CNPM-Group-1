import math

import pytest

from app.services import embeddings
from app.services.embeddings import (
    LOCAL_EMBEDDING_DIMENSION,
    EmbeddingServiceError,
    FeatureHashEmbeddings,
    GeminiEmbeddings,
)


def cosine_similarity(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right))


def test_feature_hash_embeddings_are_normalized_and_deterministic():
    model = FeatureHashEmbeddings()
    first = model.embed_query("Chính sách bảo hành NovaChat")

    assert first == model.embed_query("Chính sách bảo hành NovaChat")
    assert len(first) == LOCAL_EMBEDDING_DIMENSION
    assert math.sqrt(sum(value * value for value in first)) == pytest.approx(1.0)


def test_feature_hash_embeddings_match_vietnamese_without_accents():
    model = FeatureHashEmbeddings()
    document = model.embed_query("Chính sách bảo hành sản phẩm NovaChat")
    related = model.embed_query("chinh sach bao hanh NovaChat")
    unrelated = model.embed_query("thời tiết hôm nay có mưa không")

    assert cosine_similarity(document, related) > cosine_similarity(document, unrelated)


def test_feature_hash_embeddings_batch_and_validation():
    model = FeatureHashEmbeddings(dimension=64)
    result = model.embed_documents(["tài liệu một", "tài liệu hai", ""])

    assert len(result) == 3
    assert all(len(vector) == 64 for vector in result)
    assert result[2] == [0.0] * 64
    with pytest.raises(ValueError, match="at least 32"):
        FeatureHashEmbeddings(dimension=16)


def test_gemini_embeddings_use_retrieval_task_types(monkeypatch):
    model = GeminiEmbeddings(api_key="test-key", dimension=3, batch_size=2)
    calls = []

    def fake_post(method, payload):
        calls.append((method, payload))
        if method == "batchEmbedContents":
            return {"embeddings": [{"values": [3, 0, 0]} for _ in payload["requests"]]}
        return {"embedding": {"values": [0, 4, 0]}}

    monkeypatch.setattr(model, "_post", fake_post)

    assert model.embed_documents(["a", "b", "c"]) == [[1.0, 0.0, 0.0]] * 3
    assert model.embed_query("question") == [0.0, 1.0, 0.0]
    assert calls[0][1]["requests"][0]["taskType"] == "RETRIEVAL_DOCUMENT"
    assert calls[-1][1]["taskType"] == "QUESTION_ANSWERING"
    assert calls[-1][1]["outputDimensionality"] == 3


def test_embedding_provider_selection(monkeypatch):
    embeddings.get_embedding_model.cache_clear()
    monkeypatch.setenv("EMBEDDING_PROVIDER", "gemini")
    monkeypatch.setenv("GEMINI_API_KEY", "configured")
    assert isinstance(embeddings.get_embedding_model(), GeminiEmbeddings)

    embeddings.get_embedding_model.cache_clear()
    monkeypatch.setenv("EMBEDDING_PROVIDER", "local")
    assert isinstance(embeddings.get_embedding_model(), FeatureHashEmbeddings)
    embeddings.get_embedding_model.cache_clear()


def test_gemini_provider_requires_api_key():
    with pytest.raises(EmbeddingServiceError, match="GEMINI_API_KEY"):
        GeminiEmbeddings(api_key="")
