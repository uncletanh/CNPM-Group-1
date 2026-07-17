import math
import os
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass

from langchain_core.documents import Document

_TOKEN_PATTERN = re.compile(r"[a-z0-9]+", re.IGNORECASE)
_STOP_WORDS = {
    "ai", "anh", "bao", "bi", "cac", "can", "chi", "cho", "co", "cua", "duoc",
    "gi", "hay", "khi", "khong", "la", "lam", "mot", "nao", "nay", "nhung", "o",
    "phai", "the", "thi", "toi", "trong", "va", "ve", "voi",
}
_PHRASE_ALIASES = {
    "ship": "van chuyen",
    "seal": "niem phong",
    "tong dai": "hotline",
    "tra tien khi nhan hang": "cod",
    "tra tien luc nhan hang": "cod",
}


def normalize_text(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text.casefold())
    folded = "".join(character for character in decomposed if not unicodedata.combining(character))
    for phrase, replacement in _PHRASE_ALIASES.items():
        folded = folded.replace(phrase, replacement)
    return folded


def tokenize(text: str) -> list[str]:
    return [
        token
        for token in _TOKEN_PATTERN.findall(normalize_text(text))
        if len(token) > 1 and token not in _STOP_WORDS
    ]


def bm25_scores(documents: list[str], query: str, k1: float = 1.5, b: float = 0.75) -> list[float]:
    if not documents:
        return []
    corpus = [tokenize(document) for document in documents]
    query_tokens = tokenize(query)
    if not query_tokens:
        return [0.0] * len(documents)

    document_count = len(corpus)
    average_length = sum(len(tokens) for tokens in corpus) / max(document_count, 1)
    document_frequency = Counter()
    for tokens in corpus:
        document_frequency.update(set(tokens))

    scores = []
    for tokens in corpus:
        frequencies = Counter(tokens)
        score = 0.0
        for token in query_tokens:
            frequency = frequencies[token]
            if not frequency:
                continue
            df = document_frequency[token]
            inverse_frequency = math.log(1 + (document_count - df + 0.5) / (df + 0.5))
            length_factor = 1 - b + b * len(tokens) / max(average_length, 1)
            score += inverse_frequency * (frequency * (k1 + 1)) / (frequency + k1 * length_factor)
        scores.append(score)
    return scores


def _document_key(document: Document) -> tuple:
    metadata = document.metadata or {}
    return (
        metadata.get("source_filename") or metadata.get("source"),
        metadata.get("chunk_index"),
        document.page_content,
    )


@dataclass
class HybridResult:
    document: Document
    distance: float | None
    bm25_score: float
    fusion_score: float


def hybrid_rank(
    semantic_results: list[tuple[Document, float]],
    all_documents: list[Document],
    query: str,
    top_k: int,
    max_distance: float,
) -> list[HybridResult]:
    bm25_min_score = float(os.getenv("BM25_MIN_SCORE", "5.5"))
    semantic_weight = float(os.getenv("HYBRID_SEMANTIC_WEIGHT", "0.7"))
    lexical_weight = 1.0 - semantic_weight
    rrf_k = int(os.getenv("HYBRID_RRF_K", "60"))

    candidates: dict[tuple, HybridResult] = {}
    semantic_ranks: dict[tuple, int] = {}
    for rank, (document, distance) in enumerate(semantic_results, start=1):
        key = _document_key(document)
        semantic_ranks[key] = rank
        candidates[key] = HybridResult(document, float(distance), 0.0, 0.0)

    lexical_scores = bm25_scores([document.page_content for document in all_documents], query)
    lexical_order = sorted(range(len(all_documents)), key=lambda index: lexical_scores[index], reverse=True)
    lexical_ranks: dict[tuple, int] = {}
    for rank, index in enumerate(lexical_order, start=1):
        score = lexical_scores[index]
        if score <= 0:
            continue
        document = all_documents[index]
        key = _document_key(document)
        lexical_ranks[key] = rank
        candidate = candidates.setdefault(key, HybridResult(document, None, 0.0, 0.0))
        candidate.bm25_score = score

    accepted = []
    for key, candidate in candidates.items():
        semantic_ok = candidate.distance is not None and candidate.distance <= max_distance
        lexical_ok = candidate.bm25_score >= bm25_min_score
        if not semantic_ok and not lexical_ok:
            continue
        semantic_rank = semantic_ranks.get(key)
        lexical_rank = lexical_ranks.get(key)
        candidate.fusion_score = (
            semantic_weight / (rrf_k + semantic_rank) if semantic_rank else 0.0
        ) + (
            lexical_weight / (rrf_k + lexical_rank) if lexical_rank else 0.0
        )
        accepted.append(candidate)

    accepted.sort(key=lambda item: item.fusion_score, reverse=True)
    return accepted[:top_k]
