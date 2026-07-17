import hashlib
import json
import math
import os
import re
import time
import unicodedata
from functools import lru_cache
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from langchain_core.embeddings import Embeddings

LOCAL_EMBEDDING_DIMENSION = 384
GEMINI_EMBEDDING_API = "https://generativelanguage.googleapis.com/v1beta/models"
_WORD_PATTERN = re.compile(r"\w+", re.UNICODE)


class EmbeddingServiceError(RuntimeError):
    pass


def _fold_accents(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    return "".join(character for character in decomposed if not unicodedata.combining(character))


def _normalize(vector: list[float]) -> list[float]:
    norm = math.sqrt(sum(value * value for value in vector))
    if not norm:
        return vector
    return [value / norm for value in vector]


class FeatureHashEmbeddings(Embeddings):
    """Deterministic fallback for tests and offline development."""

    collection_suffix = "local384-v1"
    default_max_distance = 1.3

    def __init__(self, dimension: int = LOCAL_EMBEDDING_DIMENSION) -> None:
        if dimension < 32:
            raise ValueError("Embedding dimension must be at least 32.")
        self.dimension = dimension

    def _add_feature(self, vector: list[float], feature: str, weight: float) -> None:
        digest = hashlib.blake2b(feature.encode("utf-8"), digest_size=8).digest()
        value = int.from_bytes(digest, "little")
        vector[value % self.dimension] += weight if value & (1 << 63) else -weight

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
        return _normalize(vector)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [self._embed(text) for text in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._embed(text)


class GeminiEmbeddings(Embeddings):
    default_max_distance = 0.9

    def __init__(
        self,
        api_key: str,
        model: str = "gemini-embedding-001",
        dimension: int = 768,
        timeout: int = 30,
        batch_size: int = 32,
    ) -> None:
        if not api_key:
            raise EmbeddingServiceError("GEMINI_API_KEY chưa được cấu hình.")
        self.api_key = api_key
        self.model = model
        self.dimension = dimension
        self.timeout = timeout
        self.batch_size = batch_size
        model_slug = re.sub(r"[^a-z0-9]+", "", model.casefold())
        self.collection_suffix = f"{model_slug}-{dimension}-v1"

    def _post(self, method: str, payload: dict) -> dict:
        request = Request(
            f"{GEMINI_EMBEDDING_API}/{self.model}:{method}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "x-goog-api-key": self.api_key},
            method="POST",
        )
        for attempt in range(3):
            try:
                with urlopen(request, timeout=self.timeout) as response:
                    return json.loads(response.read().decode("utf-8"))
            except HTTPError as exc:
                retryable = exc.code == 429 or exc.code >= 500
                if retryable and attempt < 2:
                    time.sleep(2**attempt)
                    continue
                raise EmbeddingServiceError(f"Gemini Embedding trả về HTTP {exc.code}.") from exc
            except (URLError, TimeoutError) as exc:
                if attempt < 2:
                    time.sleep(2**attempt)
                    continue
                raise EmbeddingServiceError("Không thể kết nối Gemini Embedding.") from exc
        raise EmbeddingServiceError("Gemini Embedding không phản hồi.")

    def _request_item(self, text: str, task_type: str) -> dict:
        return {
            "model": f"models/{self.model}",
            "content": {"parts": [{"text": text}]},
            "taskType": task_type,
            "outputDimensionality": self.dimension,
        }

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for start in range(0, len(texts), self.batch_size):
            batch = texts[start : start + self.batch_size]
            payload = {
                "requests": [self._request_item(text, "RETRIEVAL_DOCUMENT") for text in batch]
            }
            response = self._post("batchEmbedContents", payload)
            embeddings = response.get("embeddings") or []
            if len(embeddings) != len(batch):
                raise EmbeddingServiceError("Gemini trả về thiếu embedding cho tài liệu.")
            vectors.extend(_normalize([float(value) for value in item["values"]]) for item in embeddings)
        return vectors

    def embed_query(self, text: str) -> list[float]:
        payload = self._request_item(text, "QUESTION_ANSWERING")
        payload.pop("model")
        response = self._post("embedContent", payload)
        values = (response.get("embedding") or {}).get("values")
        if not values:
            raise EmbeddingServiceError("Gemini không trả về embedding cho câu hỏi.")
        return _normalize([float(value) for value in values])


@lru_cache(maxsize=1)
def get_embedding_model() -> Embeddings:
    provider = os.getenv("EMBEDDING_PROVIDER", "auto").strip().lower()
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if provider == "gemini" or (provider == "auto" and api_key):
        return GeminiEmbeddings(
            api_key=api_key,
            model=os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001"),
            dimension=int(os.getenv("GEMINI_EMBEDDING_DIMENSION", "768")),
            timeout=int(os.getenv("GEMINI_EMBEDDING_TIMEOUT_SECONDS", "30")),
        )
    if provider not in {"auto", "local"}:
        raise EmbeddingServiceError(f"EMBEDDING_PROVIDER không hợp lệ: {provider}")
    return FeatureHashEmbeddings()


def get_embedding_collection_suffix() -> str:
    return str(getattr(get_embedding_model(), "collection_suffix", "unknown-v1"))


def get_default_max_distance() -> float:
    return float(getattr(get_embedding_model(), "default_max_distance", 1.0))
