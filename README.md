# NovaChat AI

NovaChat AI là nền tảng chatbot RAG dành cho doanh nghiệp SME. Hệ thống kết hợp kho tri thức riêng theo workspace, mô hình Ollama chạy local, widget nhúng website và quy trình Human Handoff để nhân viên tiếp quản hội thoại khi AI không đủ độ tin cậy.

Ngày đồng bộ tài liệu: **15/07/2026**.

## Trạng thái hiện tại

Các luồng chính đã có trong code:

- Đăng ký, đăng nhập email/mật khẩu, JWT và Google SSO khi có credentials.
- Workspace đa tenant, thành viên `admin`/`agent` và lời mời bằng liên kết.
- Knowledge Base cho PDF, TXT, DOCX và nội dung nhập trực tiếp; có danh sách, preview, sửa text, xóa và thay thế tài liệu trùng tên.
- RAG dùng `all-MiniLM-L6-v2`, ChromaDB, Top-K, ngưỡng khoảng cách, lọc prompt injection và 10 tin nhắn gần nhất.
- Ollama `qwen2.5:3b` trả lời thường hoặc streaming qua SSE.
- Widget lưu session trong LocalStorage, hiển thị nguồn, gọi nhân viên, nhận cập nhật qua WebSocket và fallback polling.
- Omnibox cho Agent xem lịch sử, tiếp quản, trả lời và đóng hội thoại.
- Redis Distributed Lock và Pub/Sub khi có Redis; local có fallback trong một process.
- Dashboard có Tổng quan, Không gian làm việc, Cấu hình Bot AI, Quản lý Tri thức, Hộp thoại, Thống kê và Cài đặt tài khoản.
- GitHub Actions kiểm tra backend, frontend và widget; backend có coverage gate 70% và quét Bandit SAST mức `high`.

Chi tiết và các phần còn thiếu được duy trì tại [Trạng thái triển khai](reengineered_docs/12_Implementation_Status.md).

## Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy, Alembic |
| Dashboard | React 19, TypeScript, Vite, Tailwind CSS |
| Widget | React 19, TypeScript, Vite Library Mode |
| CSDL quan hệ | SQLite khi phát triển; PostgreSQL cho staging/production |
| Vector store | ChromaDB persistent, collection riêng theo workspace |
| Embedding | Hugging Face `all-MiniLM-L6-v2` |
| LLM | Ollama, mặc định `qwen2.5:3b` |
| Realtime | SSE cho token AI; WebSocket + Redis Pub/Sub cho sự kiện hội thoại |

## Yêu cầu

- Python `3.11` hoặc `3.12`.
- Node.js `22` để khớp GitHub Actions.
- Ollama và model `qwen2.5:3b`.
- Redis nếu cần kiểm thử nhiều backend instance; có thể bỏ trống `REDIS_URL` khi phát triển một instance.
- PostgreSQL cho môi trường triển khai thật.

## Chạy local

### 1. Ollama

```powershell
ollama pull qwen2.5:3b
ollama serve
```

Ollama mặc định chạy tại `http://localhost:11434`. Có thể đặt dữ liệu model ở ổ D bằng biến môi trường `OLLAMA_MODELS` trước khi tải model.

### 2. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
alembic upgrade head
python -m uvicorn app.main:app --reload
```

Backend: `http://localhost:8000`

Swagger: `http://localhost:8000/docs`

Health: `http://localhost:8000/health`

Để chạy nhanh bằng SQLite, đổi `DATABASE_URL` trong `backend/.env` thành:

```env
DATABASE_URL=sqlite:///./sql_app.db
REDIS_URL=
```

### 3. Dashboard

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Dashboard: `http://localhost:5173`. API mặc định là `http://localhost:8000/api/v1`; có thể ghi đè bằng `VITE_API_URL`.

### 4. Widget

```powershell
cd widget
Copy-Item .env.example .env.local
npm.cmd ci
npm.cmd run dev
```

Điền `VITE_WORKSPACE_ID` và `VITE_WIDGET_TOKEN` trong `.env.local`. Hướng dẫn build và mã nhúng nằm tại [widget/README.md](widget/README.md).

### Docker Compose

```powershell
docker compose up --build
```

Compose hiện khởi động backend, Redis và dashboard. Ollama chạy trên host và backend truy cập qua `host.docker.internal:11434`.

## Kiểm thử

```powershell
cd backend
.\venv\Scripts\python.exe -m compileall app
.\venv\Scripts\python.exe test_chat_api.py
.\venv\Scripts\python.exe test_knowledge_listing.py
.\venv\Scripts\python.exe test_phase4_chat.py
.\venv\Scripts\python.exe test_workspace_rbac.py
.\venv\Scripts\python.exe test_auth_users.py
.\venv\Scripts\python.exe test_llm_provider.py
.\venv\Scripts\python.exe test_workspace_crud.py
```

```powershell
cd frontend
npm.cmd ci
npm.cmd run lint
npm.cmd run build

cd ..\widget
npm.cmd ci
npm.cmd run lint
npm.cmd run build
```

GitHub Actions chạy các test backend bằng `coverage`, yêu cầu tổng coverage tối thiểu 70%, quét `bandit -r app --severity-level high`, và kiểm tra lint/build cho frontend lẫn widget. Workflow chạy trên mọi push vào `main`, `feature/**` và Pull Request vào `main`.

## Cấu trúc tài liệu

- [Hướng dẫn triển khai](DEPLOYMENT.md)
- [Test case Knowledge Base](PHASE2_TEST_CASES.md)
- [Backend README](backend/README.md)
- [Dashboard README](frontend/README.md)
- [Widget README](widget/README.md)
- [Bộ tài liệu sản phẩm và kiến trúc](reengineered_docs/01_Product_Introduction.md)
- [Trạng thái triển khai](reengineered_docs/12_Implementation_Status.md)

## Quy trình Git

Không push trực tiếp lên `main`.

1. Tạo branch `feature/<ten-cong-viec>` từ `main` mới nhất.
2. Commit thay đổi có phạm vi rõ ràng.
3. Push branch và mở Pull Request vào `main`.
4. Chỉ merge khi conflict đã được resolve và checks đều xanh.
