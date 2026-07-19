import os
import re
import time
from fastapi import FastAPI, Request
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.api.v1 import admin, users, auth, workspaces, chat
from app.db.session import (
    Base,
    DATABASE_BACKEND,
    DATABASE_IS_PERSISTENT,
    engine,
    ensure_chat_session_schema,
    ensure_user_schema,
    ensure_workspace_schema,
)
from app.models.license import LicenseKey  # noqa: F401
from app.models.workspace import WorkspaceInvitation, WorkspaceMember  # noqa: F401
from app.services.embeddings import get_embedding_collection_suffix
from app.services.observability import (
    OperationsMiddleware,
    configure_logging,
    metrics_response,
)

configure_logging()

# Tạo tất cả các bảng trong Database (Tạm thời dùng cách này để dễ setup cho sinh viên)
Base.metadata.create_all(bind=engine)
ensure_workspace_schema()
ensure_user_schema()
ensure_chat_session_schema()

app = FastAPI(
    title="NovaChat AI Backend",
    version="0.1.0",
    description="Backend API for NovaChat AI Platform"
)

_STARTED_AT = time.time()

# Dashboard admin (frontend) chỉ được gọi từ các origin cố định dưới đây.
ADMIN_ORIGINS = {"http://localhost:5173", "http://127.0.0.1:5173"}
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    ADMIN_ORIGINS.add(frontend_url)


# Chi dung path thuc te widget goi tu domain khach hang (khong the biet truoc origin).
# Cac sub-path con lai duoi /api/v1/chat/ (sessions/stats/reply/takeover/resolve...) chi
# danh cho Agent dang nhap dashboard, khong duoc reflect origin bat ky - truoc day dieu
# kien nay dua vao "request co header X-Widget-Token khong" (client tu khai, khong xac
# thuc gia tri), nen ke tan cong tu them header do la lam CORS nghi day la request cong
# khai cho ca nhung endpoint chi-Agent. Chuyen sang whitelist theo dung path.
_PUBLIC_CHAT_PATH = re.compile(
    r"^/api/v1/chat/\d+(/widget-config|/stream|/request-human|/history|/poll)?$"
)


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    """
    Cac path trong _PUBLIC_CHAT_PATH la endpoint cong khai duoc Widget goi tu domain cua
    khach hang, nen phai chap nhan moi origin o do. Cac endpoint con lai (auth/workspaces/
    users, va ca cac sub-path quan tri duoi /api/v1/chat/ nhu sessions/reply/takeover) chi
    chap nhan origin trong ADMIN_ORIGINS va co gui cookie/credentials.
    """

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        is_public_chat = bool(_PUBLIC_CHAT_PATH.match(request.url.path))

        if request.method == "OPTIONS":
            headers = {
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "*",
            }
            if is_public_chat and origin:
                headers["Access-Control-Allow-Origin"] = origin
            elif origin in ADMIN_ORIGINS:
                headers["Access-Control-Allow-Origin"] = origin
                headers["Access-Control-Allow-Credentials"] = "true"
            return Response(status_code=200, headers=headers)

        response = await call_next(request)
        if is_public_chat and origin:
            response.headers["Access-Control-Allow-Origin"] = origin
        elif origin in ADMIN_ORIGINS:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        return response


app.add_middleware(DynamicCORSMiddleware)
app.add_middleware(OperationsMiddleware)
try:
    from starlette.middleware.sessions import SessionMiddleware

    app.add_middleware(
        SessionMiddleware,
        secret_key=os.getenv("SECRET_KEY", "development-secret"),
    )
except ModuleNotFoundError:
    # OAuth Google sẽ hoạt động sau khi cài đầy đủ requirements.
    pass

# Đăng ký các router
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(workspaces.router, prefix="/api/v1/workspaces", tags=["Workspaces"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])


@app.get("/")
def read_root():
    return {"message": "Welcome to NovaChat AI API"}


@app.get("/health", tags=["Operations"])
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        database_connected = True
    except Exception:
        database_connected = False

    return {
        "status": "ok" if database_connected else "degraded",
        "service": "novachat-backend",
        "uptime_seconds": round(time.time() - _STARTED_AT),
        "database_backend": DATABASE_BACKEND,
        "database_persistent": DATABASE_IS_PERSISTENT,
        "database_connected": database_connected,
        "embedding_backend": get_embedding_collection_suffix(),
        "llm_provider": os.getenv("LLM_PROVIDER", "ollama"),
        "groq_model": os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
        "gemini_model": os.getenv("GEMINI_MODEL", "gemini-3.5-flash"),
    }


@app.get("/metrics", include_in_schema=False)
def metrics():
    return metrics_response()
