import os
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.api.v1 import users, auth, workspaces, chat
from app.db.session import Base, engine, ensure_workspace_schema

# Tạo tất cả các bảng trong Database (Tạm thời dùng cách này để dễ setup cho sinh viên)
Base.metadata.create_all(bind=engine)
ensure_workspace_schema()

app = FastAPI(
    title="NovaChat AI Backend",
    version="0.1.0",
    description="Backend API for NovaChat AI Platform"
)

# Dashboard admin (frontend) chỉ được gọi từ các origin cố định dưới đây.
ADMIN_ORIGINS = {"http://localhost:5173", "http://127.0.0.1:5173"}
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    ADMIN_ORIGINS.add(frontend_url)


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    """
    /api/v1/chat/* là endpoint công khai được Widget gọi từ domain của khách hàng
    (không biết trước origin nào), nên phải chấp nhận mọi origin ở đó.
    Các endpoint admin khác (auth/workspaces/users) chỉ chấp nhận origin trong ADMIN_ORIGINS
    và có gửi cookie/credentials.
    """

    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin")
        is_public_chat = request.url.path.startswith("/api/v1/chat")

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

# Đăng ký các router
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(workspaces.router, prefix="/api/v1/workspaces", tags=["Workspaces"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])


@app.get("/")
def read_root():
    return {"message": "Welcome to NovaChat AI API"}
