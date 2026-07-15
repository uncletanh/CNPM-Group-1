import asyncio
import json
import logging
import os
import time
from collections import defaultdict, deque
from datetime import datetime, timezone

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse, Response

try:
    from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
except ImportError:
    CONTENT_TYPE_LATEST = "text/plain"
    Counter = Histogram = None  # type: ignore[assignment,misc]
    generate_latest = None


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False)


def configure_logging() -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(os.getenv("LOG_LEVEL", "INFO").upper())


REQUEST_COUNT = (
    Counter("novachat_http_requests_total", "HTTP requests", ["method", "path", "status"])
    if Counter
    else None
)
REQUEST_DURATION = (
    Histogram("novachat_http_request_duration_seconds", "HTTP request duration", ["path"])
    if Histogram
    else None
)


class OperationsMiddleware(BaseHTTPMiddleware):
    def __init__(self, app) -> None:
        super().__init__(app)
        self.limit = int(os.getenv("RATE_LIMIT_PER_MINUTE", "30"))
        self.requests: dict[str, deque[float]] = defaultdict(deque)
        self.lock = asyncio.Lock()

    async def dispatch(self, request: Request, call_next):
        started = time.perf_counter()
        if request.url.path.startswith("/api/v1/chat/") and request.method == "POST":
            client = request.client.host if request.client else "unknown"
            key = f"{client}:{request.url.path}"
            now = time.monotonic()
            async with self.lock:
                bucket = self.requests[key]
                while bucket and bucket[0] <= now - 60:
                    bucket.popleft()
                if len(bucket) >= self.limit:
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau."},
                        headers={"Retry-After": "60"},
                    )
                bucket.append(now)

        response = await call_next(request)
        duration = time.perf_counter() - started
        route = request.scope.get("route")
        path = getattr(route, "path", request.url.path)
        if REQUEST_COUNT:
            REQUEST_COUNT.labels(request.method, path, response.status_code).inc()
        if REQUEST_DURATION:
            REQUEST_DURATION.labels(path).observe(duration)
        logging.getLogger("novachat.http").info(
            "%s %s %s %.3fs",
            request.method,
            request.url.path,
            response.status_code,
            duration,
        )
        return response


def metrics_response() -> Response:
    if generate_latest is None:
        return Response("prometheus-client is not installed\n", media_type="text/plain")
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
