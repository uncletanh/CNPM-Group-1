import hashlib
import math
import re
import unicodedata

from langchain_core.embeddings import Embeddings

EMBEDDING_BACKEND = "feature-hashing-v1"
EMBEDDING_DIMENSION = 384
_WORD_PATTERN = re.compile(r"\w+", re.UNICODE)


def _fold_accents(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    return "".join(character for character in decomposed if not unicodedata.combining(character))


class FeatureHashEmbeddings(Embeddings):
    """Fast deterministic embeddings for small, CPU-constrained deployments."""

    def __init__(self, dimension: int = EMBEDDING_DIMENSION) -> None:
        if dimension < 32:
            raise ValueError("Embedding dimension must be at least 32.")
        self.dimension = dimension

    def _add_feature(self, vector: list[float], feature: str, weight: float) -> None:
        digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=8).digest()
        value = int.from_bytes(digest, "little")
        index = value % self.dimension
        vector[index] += weight if value & (1 << 63) else -weight

    def _embed(self, text: str) -> list[float]:
        normalized = unicodedata.normalize("NFKC", text).casefold()
        words = _WORD_PATTERN.findall(normalized)
        vector = [0.0] * self.dimension

        for index, word in enumerate(words):
            self._add_feature(vector, f"word:{word}", 1.0)
            folded_word = _fold_accents(word)
            if folded_word != word:
                self._add_feature(vector, f"folded:{folded_word}", 0.8)

            padded_word = f"^{folded_word}$"
            for start in range(max(0, len(padded_word) - 2)):
                self._add_feature(vector, f"char:{padded_word[start:start + 3]}", 0.2)

            if index:
                previous = _fold_accents(words[index - 1])
                self._add_feature(vector, f"bigram:{previous}:{folded_word}", 0.6)

        if not words and normalized.strip():
            self._add_feature(vector, f"text:{normalized.strip()}", 1.0)

        norm = math.sqrt(sum(value * value for value in vector))
        if norm:
            return [value / norm for value in vector]
        return vector

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._embed(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._embed(text)


_embedding_model = FeatureHashEmbeddings()


def get_embedding_model() -> FeatureHashEmbeddings:
    return _embedding_model
