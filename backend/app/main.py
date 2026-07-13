import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# Cấu hình CORS để Frontend gọi API không bị lỗi
origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký các router
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(workspaces.router, prefix="/api/v1/workspaces", tags=["Workspaces"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["Chat"])


@app.get("/")
def read_root():
    return {"message": "Welcome to NovaChat AI API"}
