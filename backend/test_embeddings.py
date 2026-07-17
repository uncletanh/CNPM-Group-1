import math

import pytest

from app.services.embeddings import EMBEDDING_DIMENSION, FeatureHashEmbeddings


def cosine_similarity(left: list[float], right: list[float]) -> float:
    return sum(a * b for a, b in zip(left, right))


def test_feature_hash_embeddings_are_normalized_and_deterministic():
    model = FeatureHashEmbeddings()

    first = model.embed_query("Chính sách bảo hành NovaChat")
    second = model.embed_query("Chính sách bảo hành NovaChat")

    assert first == second
    assert len(first) == EMBEDDING_DIMENSION
    assert math.sqrt(sum(value * value for value in first)) == pytest.approx(1.0)


def test_feature_hash_embeddings_match_vietnamese_without_accents():
    model = FeatureHashEmbeddings()
    document = model.embed_query("Chính sách bảo hành sản phẩm NovaChat")
    related = model.embed_query("chinh sach bao hanh NovaChat")
    unrelated = model.embed_query("thời tiết hôm nay có mưa không")

    assert cosine_similarity(document, related) > cosine_similarity(document, unrelated)


def test_feature_hash_embeddings_batch_documents():
    model = FeatureHashEmbeddings(dimension=64)

    result = model.embed_documents(["tài liệu một", "tài liệu hai", ""])

    assert len(result) == 3
    assert all(len(vector) == 64 for vector in result)
    assert result[2] == [0.0] * 64


def test_feature_hash_embeddings_reject_tiny_dimension():
    with pytest.raises(ValueError, match="at least 32"):
        FeatureHashEmbeddings(dimension=16)
