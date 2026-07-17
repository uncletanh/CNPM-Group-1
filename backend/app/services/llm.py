import json
import os
from typing import Iterator, Protocol
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class LLMProviderError(RuntimeError):
    pass


class LLMProvider(Protocol):
    def generate(self, system_prompt: str, user_prompt: str) -> str: ...

    def generate_stream(self, system_prompt: str, user_prompt: str) -> Iterator[str]: ...


def _read_json(request: Request, timeout: int, provider_name: str) -> dict:
    try:
        with urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise LLMProviderError(f"Không thể kết nối hoặc đọc phản hồi từ {provider_name}.") from exc


class OllamaProvider:
    def __init__(self) -> None:
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
        self.model = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
        self.timeout = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        payload = {
            "model": self.model,
            "stream": False,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        response = _read_json(self._build_request("/api/chat", payload), self.timeout, "Ollama")
        content = response.get("message", {}).get("content")
        if not content:
            raise LLMProviderError("Ollama không trả về nội dung phản hồi.")
        return content.strip()

    def generate_stream(self, system_prompt: str, user_prompt: str) -> Iterator[str]:
        payload = {
            "model": self.model,
            "stream": True,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }
        request = self._build_request("/api/chat", payload)
        try:
            with urlopen(request, timeout=self.timeout) as response:
                for raw_line in response:
                    if not raw_line.strip():
                        continue
                    data = json.loads(raw_line.decode("utf-8"))
                    if data.get("done"):
                        break
                    content = data.get("message", {}).get("content")
                    if content:
                        yield content
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise LLMProviderError("Không thể kết nối hoặc đọc stream từ Ollama.") from exc

    def _build_request(self, path: str, payload: dict) -> Request:
        return Request(
            f"{self.base_url}{path}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )


class GroqProvider:
    def __init__(self) -> None:
        self.api_key = os.getenv("GROQ_API_KEY", "").strip()
        if not self.api_key:
            raise LLMProviderError("GROQ_API_KEY chưa được cấu hình.")
        self.base_url = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
        self.model = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        self.timeout = int(os.getenv("GROQ_TIMEOUT_SECONDS", "60"))

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        response = _read_json(
            self._build_request(self._payload(system_prompt, user_prompt, stream=False)),
            self.timeout,
            "Groq",
        )
        choices = response.get("choices") or []
        content = choices[0].get("message", {}).get("content") if choices else None
        if not content:
            raise LLMProviderError("Groq không trả về nội dung phản hồi.")
        return content.strip()

    def generate_stream(self, system_prompt: str, user_prompt: str) -> Iterator[str]:
        request = self._build_request(self._payload(system_prompt, user_prompt, stream=True))
        try:
            with urlopen(request, timeout=self.timeout) as response:
                for raw_line in response:
                    line = raw_line.decode("utf-8").strip()
                    if not line.startswith("data:"):
                        continue
                    data_text = line[5:].strip()
                    if data_text == "[DONE]":
                        break
                    data = json.loads(data_text)
                    choices = data.get("choices") or []
                    content = choices[0].get("delta", {}).get("content") if choices else None
                    if content:
                        yield content
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise LLMProviderError("Không thể kết nối hoặc đọc stream từ Groq.") from exc

    def _payload(self, system_prompt: str, user_prompt: str, *, stream: bool) -> dict:
        return {
            "model": self.model,
            "stream": stream,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }

    def _build_request(self, payload: dict) -> Request:
        return Request(
            f"{self.base_url}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )


class GeminiProvider:
    def __init__(self) -> None:
        self.api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not self.api_key:
            raise LLMProviderError("GEMINI_API_KEY chưa được cấu hình.")
        self.base_url = os.getenv(
            "GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"
        ).rstrip("/")
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.timeout = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "60"))

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        response = _read_json(
            self._build_request("generateContent", system_prompt, user_prompt),
            self.timeout,
            "Gemini",
        )
        content = self._extract_content(response)
        if not content:
            raise LLMProviderError("Gemini không trả về nội dung phản hồi.")
        return content.strip()

    def generate_stream(self, system_prompt: str, user_prompt: str) -> Iterator[str]:
        request = self._build_request(
            "streamGenerateContent?alt=sse", system_prompt, user_prompt
        )
        try:
            with urlopen(request, timeout=self.timeout) as response:
                for raw_line in response:
                    line = raw_line.decode("utf-8").strip()
                    if not line.startswith("data:"):
                        continue
                    content = self._extract_content(json.loads(line[5:].strip()))
                    if content:
                        yield content
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
            raise LLMProviderError("Không thể kết nối hoặc đọc stream từ Gemini.") from exc

    def _build_request(
        self, operation: str, system_prompt: str, user_prompt: str
    ) -> Request:
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        }
        return Request(
            f"{self.base_url}/models/{self.model}:{operation}",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", "x-goog-api-key": self.api_key},
            method="POST",
        )

    @staticmethod
    def _extract_content(response: dict) -> str:
        candidates = response.get("candidates") or []
        if not candidates:
            return ""
        parts = candidates[0].get("content", {}).get("parts") or []
        return "".join(part.get("text", "") for part in parts)


class FallbackProvider:
    def __init__(self, providers: list[LLMProvider]) -> None:
        if not providers:
            raise LLMProviderError("Không có LLM provider nào đã được cấu hình.")
        self.providers = providers

    def generate(self, system_prompt: str, user_prompt: str) -> str:
        errors = []
        for provider in self.providers:
            try:
                return provider.generate(system_prompt, user_prompt)
            except LLMProviderError as exc:
                errors.append(f"{type(provider).__name__}: {exc}")
        raise LLMProviderError("Tất cả LLM provider đều thất bại: " + "; ".join(errors))

    def generate_stream(self, system_prompt: str, user_prompt: str) -> Iterator[str]:
        errors = []
        for provider in self.providers:
            emitted = False
            try:
                for chunk in provider.generate_stream(system_prompt, user_prompt):
                    emitted = True
                    yield chunk
                if emitted:
                    return
                errors.append(f"{type(provider).__name__}: stream rỗng")
            except LLMProviderError as exc:
                if emitted:
                    raise
                errors.append(f"{type(provider).__name__}: {exc}")
        raise LLMProviderError("Tất cả LLM provider đều thất bại: " + "; ".join(errors))


def _create_provider(name: str) -> LLMProvider:
    factories = {
        "ollama": OllamaProvider,
        "groq": GroqProvider,
        "gemini": GeminiProvider,
    }
    factory = factories.get(name)
    if not factory:
        raise LLMProviderError(f"LLM_PROVIDER '{name}' chưa được hỗ trợ.")
    return factory()


def get_llm_provider() -> LLMProvider:
    selected = os.getenv("LLM_PROVIDER", "ollama").lower().strip()
    if selected == "auto":
        names = os.getenv("LLM_FALLBACK_ORDER", "ollama,groq,gemini").split(",")
    else:
        fallbacks = os.getenv("LLM_FALLBACK_PROVIDERS", "").split(",")
        names = [selected, *fallbacks]

    providers = []
    seen = set()
    errors = []
    for raw_name in names:
        name = raw_name.lower().strip()
        if not name or name in seen:
            continue
        seen.add(name)
        try:
            providers.append(_create_provider(name))
        except LLMProviderError as exc:
            errors.append(str(exc))

    if not providers:
        raise LLMProviderError("; ".join(errors) or "Không có LLM provider nào đã được cấu hình.")
    return providers[0] if len(providers) == 1 else FallbackProvider(providers)
