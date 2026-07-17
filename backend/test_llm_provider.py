"""Kiểm thử provider Ollama, Groq, Gemini và chuỗi fallback mà không gọi API thật."""

import json
import os
from urllib.error import URLError

from app.services import llm
from app.services.llm import (
    FallbackProvider,
    GeminiProvider,
    GroqProvider,
    LLMProviderError,
    OllamaProvider,
    get_llm_provider,
)


class _FakeResponse:
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


class _FailingProvider:
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        raise LLMProviderError("primary unavailable")

    def generate_stream(self, system_prompt: str, user_prompt: str):
        raise LLMProviderError("primary unavailable")
        yield


class _WorkingProvider:
    def generate(self, system_prompt: str, user_prompt: str) -> str:
        return "fallback answer"

    def generate_stream(self, system_prompt: str, user_prompt: str):
        yield "fallback "
        yield "stream"


class _EmptyStreamProvider(_WorkingProvider):
    def generate_stream(self, system_prompt: str, user_prompt: str):
        yield from ()


class _PartialFailProvider(_WorkingProvider):
    def generate_stream(self, system_prompt: str, user_prompt: str):
        yield "partial"
        raise LLMProviderError("stream interrupted")


def run_llm_provider_test() -> None:
    original_urlopen = llm.urlopen
    env_names = [
        "LLM_PROVIDER",
        "LLM_FALLBACK_ORDER",
        "LLM_FALLBACK_PROVIDERS",
        "GROQ_API_KEY",
        "GEMINI_API_KEY",
        "GEMINI_MODEL",
    ]
    original_env = {name: os.environ.get(name) for name in env_names}
    try:
        ollama = OllamaProvider()
        llm.urlopen = lambda *a, **k: _FakeResponse(
            body=json.dumps({"message": {"content": "Xin chào"}}).encode()
        )
        assert ollama.generate("system", "hỏi") == "Xin chào"
        llm.urlopen = lambda *a, **k: _FakeResponse(
            body=json.dumps({"message": {"content": ""}}).encode()
        )
        try:
            ollama.generate("system", "hỏi")
            raise AssertionError("Phản hồi rỗng phải sinh LLMProviderError")
        except LLMProviderError:
            pass

        ollama_lines = [
            json.dumps({"message": {"content": "Câu trả lời "}}).encode(),
            json.dumps({"message": {"content": "theo tri thức."}}).encode(),
            json.dumps({"done": True}).encode(),
        ]
        llm.urlopen = lambda *a, **k: _FakeResponse(lines=ollama_lines)
        assert "".join(ollama.generate_stream("system", "hỏi")) == "Câu trả lời theo tri thức."

        os.environ["GROQ_API_KEY"] = "test-groq-key"
        groq = GroqProvider()
        llm.urlopen = lambda *a, **k: _FakeResponse(
            body=json.dumps({"choices": [{"message": {"content": "Groq answer"}}]}).encode()
        )
        assert groq.generate("system", "question") == "Groq answer"

        groq_lines = [
            b'data: {"choices":[{"delta":{"content":"Groq "}}]}\n',
            b'data: {"choices":[{"delta":{"content":"stream"}}]}\n',
            b"data: [DONE]\n",
        ]
        llm.urlopen = lambda *a, **k: _FakeResponse(lines=groq_lines)
        assert "".join(groq.generate_stream("system", "question")) == "Groq stream"

        os.environ["GEMINI_API_KEY"] = "test-gemini-key"
        os.environ.pop("GEMINI_MODEL", None)
        gemini = GeminiProvider()
        assert gemini.model == "gemini-2.5-flash"
        gemini_response = {
            "candidates": [{"content": {"parts": [{"text": "Gemini answer"}]}}]
        }
        llm.urlopen = lambda *a, **k: _FakeResponse(body=json.dumps(gemini_response).encode())
        assert gemini.generate("system", "question") == "Gemini answer"

        gemini_lines = [
            b'data: {"candidates":[{"content":{"parts":[{"text":"Gemini "}]}}]}\n',
            b'data: {"candidates":[{"content":{"parts":[{"text":"stream"}]}}]}\n',
        ]
        llm.urlopen = lambda *a, **k: _FakeResponse(lines=gemini_lines)
        assert "".join(gemini.generate_stream("system", "question")) == "Gemini stream"

        fallback = FallbackProvider([_FailingProvider(), _WorkingProvider()])
        assert fallback.generate("system", "question") == "fallback answer"
        assert "".join(fallback.generate_stream("system", "question")) == "fallback stream"
        empty_fallback = FallbackProvider([_EmptyStreamProvider(), _WorkingProvider()])
        assert "".join(empty_fallback.generate_stream("system", "question")) == "fallback stream"
        try:
            list(FallbackProvider([_PartialFailProvider(), _WorkingProvider()]).generate_stream("s", "u"))
            raise AssertionError("Không được fallback sau khi stream đã phát chunk")
        except LLMProviderError:
            pass

        os.environ["LLM_PROVIDER"] = "auto"
        os.environ["LLM_FALLBACK_ORDER"] = "ollama,groq,gemini"
        selected = get_llm_provider()
        assert isinstance(selected, FallbackProvider)
        assert [type(item) for item in selected.providers] == [
            OllamaProvider,
            GroqProvider,
            GeminiProvider,
        ]

        os.environ["LLM_PROVIDER"] = "openai"
        os.environ.pop("LLM_FALLBACK_PROVIDERS", None)
        try:
            get_llm_provider()
            raise AssertionError("Provider không hỗ trợ phải sinh LLMProviderError")
        except LLMProviderError:
            pass

        def _raise(*args, **kwargs):
            raise URLError("connection refused")

        llm.urlopen = _raise
        try:
            ollama.generate("system", "question")
            raise AssertionError("Mất kết nối phải sinh LLMProviderError")
        except LLMProviderError:
            pass

        print("[SUCCESS] Ollama/Groq/Gemini/fallback provider tests passed.")
    finally:
        llm.urlopen = original_urlopen
        for name, value in original_env.items():
            if value is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = value


if __name__ == "__main__":
    run_llm_provider_test()
