import json
import os
from typing import Iterator
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class LLMProviderError(RuntimeError):
    pass


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
        response = self._post_json("/api/chat", payload)
        message = response.get("message", {})
        content = message.get("content")
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
        except (HTTPError, URLError, TimeoutError) as exc:
            raise LLMProviderError(
                "Không thể kết nối Ollama. Hãy kiểm tra Ollama đang chạy và model đã được tải."
            ) from exc

    def _post_json(self, path: str, payload: dict) -> dict:
        request = self._build_request(path, payload)
        try:
            with urlopen(request, timeout=self.timeout) as response:
                return json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError) as exc:
            raise LLMProviderError(
                "Không thể kết nối Ollama. Hãy kiểm tra Ollama đang chạy và model đã được tải."
            ) from exc

    def _build_request(self, path: str, payload: dict) -> Request:
        body = json.dumps(payload).encode("utf-8")
        return Request(
            f"{self.base_url}{path}",
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )


def get_llm_provider() -> OllamaProvider:
    provider = os.getenv("LLM_PROVIDER", "ollama").lower()
    if provider != "ollama":
        raise LLMProviderError(f"LLM_PROVIDER '{provider}' chưa được hỗ trợ.")
    return OllamaProvider()
