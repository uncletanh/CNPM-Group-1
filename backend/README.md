# NovaChat AI Backend

Backend là FastAPI modular monolith phụ trách xác thực, workspace/RBAC, Knowledge Base, RAG, hội thoại, Human Handoff và realtime.

## Cài đặt

Yêu cầu Python `3.11` hoặc `3.12`.

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Các biến quan trọng:

| Biến | Mục đích |
|---|---|
| `DATABASE_URL` | SQLite local hoặc PostgreSQL staging/production |
| `SECRET_KEY` | Ký JWT và session OAuth; phải thay ở production |
| `LLM_PROVIDER` | `ollama`, `groq`, `gemini` hoặc `auto` |
| `LLM_FALLBACK_ORDER` | Thứ tự provider khi dùng `auto`, mặc định `ollama,groq,gemini` |
| `OLLAMA_BASE_URL` | Mặc định `http://localhost:11434` |
| `OLLAMA_MODEL` | Mặc định `qwen2.5:3b` |
| `GROQ_API_KEY`, `GROQ_MODEL` | Bật Groq cloud, mặc định `llama-3.1-8b-instant` |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Bật Gemini cloud, mặc định `gemini-2.0-flash` |
| `REDIS_URL` | Lock takeover và Pub/Sub nhiều instance; để trống khi chạy local một instance |
| `RAG_MAX_DISTANCE` | Ngưỡng khoảng cách Chroma, mặc định `1.2` |
| `CHAT_HISTORY_LIMIT` | Số tin nhắn gần nhất đưa vào prompt, mặc định `10` |
| `HUMAN_HANDOFF_TIMEOUT_SECONDS` | Thời gian gửi fallback, mặc định `60` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Bật Google SSO |
| `FRONTEND_URL` | Origin dashboard và URL redirect sau Google OAuth |
| `RATE_LIMIT_PER_MINUTE` | Giới hạn POST chat theo IP/path trong một process |

## Database và migration

```powershell
alembic upgrade head
```

Alembic hiện có một baseline Phase 4. `Base.metadata.create_all()` và các hàm `ensure_*_schema()` vẫn được giữ để tương thích database SQLite cũ; migration tiếp theo nên được quản lý hoàn toàn bằng Alembic.

ChromaDB lưu persistent tại `backend/chroma_data/`. Mỗi workspace dùng collection `workspace_<id>_knowledge`.

## Chạy server

```powershell
python -m uvicorn app.main:app --reload
```

- API: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`
- Health: `GET /health`
- Prometheus metrics: `GET /metrics`

## Nhóm API

- `/api/v1/auth`: đăng ký, đăng nhập, Google OAuth.
- `/api/v1/users`: tài khoản hiện tại, đổi mật khẩu, danh sách user dành cho global admin.
- `/api/v1/workspaces`: workspace, prompt, widget settings, thành viên, lời mời và Knowledge Base.
- `/api/v1/chat`: chat thường/SSE, lịch sử, poll, thống kê, handoff và WebSocket.

Widget public phải gửi `X-Widget-Token`; nếu workspace có `allowed_origin`, backend kiểm tra header `Origin`. Dashboard dùng JWT Bearer.

## Knowledge Base và RAG

- Định dạng: PDF, TXT, DOCX.
- Giới hạn: 50 MB/file.
- Chunk: 1.000 ký tự, overlap 200.
- Embedding: feature-hashing 384 chiều chạy thuần CPU, không tải model ngoài.
- Upload lại cùng `source_filename` sẽ xóa chunk cũ trước khi thêm chunk mới.
- Chat lọc chunk vượt `RAG_MAX_DISTANCE` hoặc chứa mẫu prompt injection.
- Không có context đủ tin cậy sẽ chuyển session sang `waiting_human`.

## Realtime và Handoff

- SSE stream token từ Ollama/Groq/Gemini cho widget.
- WebSocket truyền sự kiện tới Agent và widget.
- Redis Pub/Sub đồng bộ nhiều backend instance.
- Redis lock và cập nhật SQL có điều kiện chống hai Agent tiếp quản cùng lúc.
- Không có Redis sẽ dùng lock nội bộ một process.
- Fallback sau 60 giây được lập lịch trong process và được kiểm tra lại ở endpoint poll.

## Kiểm thử

```powershell
.\venv\Scripts\python.exe -m compileall app
.\venv\Scripts\python.exe test_chat_api.py
.\venv\Scripts\python.exe test_knowledge_listing.py
.\venv\Scripts\python.exe test_phase4_chat.py
.\venv\Scripts\python.exe test_workspace_rbac.py
.\venv\Scripts\python.exe test_auth_users.py
.\venv\Scripts\python.exe test_llm_provider.py
.\venv\Scripts\python.exe test_workspace_crud.py
.\venv\Scripts\python.exe -m pytest test_embeddings.py
```

`test_chroma.py` là smoke test Chroma/embedding riêng.

Trong CI, bảy script chính và unit test embedding được chạy qua `coverage`, gộp kết quả và yêu cầu tối thiểu 70%. Bandit cũng quét thư mục `app` với ngưỡng severity `high`.
