"""Kiem thu OllamaProvider: generate, generate_stream, xu ly loi va lua chon provider."""
import io
import json
from urllib.error import URLError

from app.services import llm
from app.services.llm import (
    LLMProviderError,
    OllamaProvider,
    get_llm_provider,
)


class _FakeResponse:
    """Gia lap doi tuong tra ve tu urlopen (ho tro context manager + iterate + read)."""

    def __init__(self, *, body: bytes = b"", lines=None):
        self._body = body
        self._lines = lines or []

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self):
        return self._body

    def __iter__(self):
        return iter(self._lines)


def run_llm_provider_test() -> None:
    original_urlopen = llm.urlopen
    try:
        provider = OllamaProvider()

        # --- generate() happy path ---
        llm.urlopen = lambda *a, **k: _FakeResponse(
            body=json.dumps({"message": {"content": "Xin chao"}}).encode("utf-8")
        )
        assert provider.generate("system", "hoi") == "Xin chao"

        # --- generate() khi model tra ve rong -> LLMProviderError ---
        llm.urlopen = lambda *a, **k: _FakeResponse(
            body=json.dumps({"message": {"content": ""}}).encode("utf-8")
        )
        try:
            provider.generate("system", "hoi")
            raise AssertionError("Phai raise LLMProviderError khi noi dung rong")
        except LLMProviderError:
            pass

        # --- generate() khi khong ket noi duoc Ollama -> LLMProviderError ---
        def _raise(*a, **k):
            raise URLError("connection refused")

        llm.urlopen = _raise
        try:
            provider.generate("system", "hoi")
            raise AssertionError("Phai raise LLMProviderError khi mat ket noi")
        except LLMProviderError:
            pass

        # --- generate_stream() happy path: ghep cac chunk, dung o done ---
        stream_lines = [
            json.dumps({"message": {"content": "Cau tra loi "}}).encode("utf-8"),
            json.dumps({"message": {"content": "theo tri thuc."}}).encode("utf-8"),
            json.dumps({"done": True}).encode("utf-8"),
        ]
        llm.urlopen = lambda *a, **k: _FakeResponse(lines=stream_lines)
        chunks = list(provider.generate_stream("system", "hoi"))
        assert "".join(chunks) == "Cau tra loi theo tri thuc.", chunks

        # --- generate_stream() khi loi ket noi -> LLMProviderError ---
        llm.urlopen = _raise
        try:
            list(provider.generate_stream("system", "hoi"))
            raise AssertionError("Stream phai raise LLMProviderError khi mat ket noi")
        except LLMProviderError:
            pass

        # --- get_llm_provider(): mac dinh la Ollama ---
        import os

        os.environ.pop("LLM_PROVIDER", None)
        assert isinstance(get_llm_provider(), OllamaProvider)

        # --- get_llm_provider(): provider khong ho tro -> LLMProviderError ---
        os.environ["LLM_PROVIDER"] = "openai"
        try:
            get_llm_provider()
            raise AssertionError("Provider khong ho tro phai raise loi")
        except LLMProviderError:
            pass
        finally:
            os.environ.pop("LLM_PROVIDER", None)

        print("[SUCCESS] Ollama LLM provider generate/stream/error/select test passed.")
    finally:
        llm.urlopen = original_urlopen


if __name__ == "__main__":
    run_llm_provider_test()
