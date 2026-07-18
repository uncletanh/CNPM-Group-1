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
| `GROQ_API_KEY`, `GROQ_MODEL` | Bật Groq cloud, mặc định `openai/gpt-oss-20b` |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Bật Gemini cloud, mặc định stable `gemini-3.5-flash` |
| `REDIS_URL` | Lock takeover và Pub/Sub nhiều instance; để trống khi chạy local một instance |
| `EMBEDDING_PROVIDER` | `gemini`, `local` hoặc `auto`; production dùng `gemini` |
| `GEMINI_EMBEDDING_MODEL` | Mặc định `gemini-embedding-001` |
| `GEMINI_EMBEDDING_DIMENSION` | Mặc định `768` |
| `RAG_MAX_DISTANCE` | Để trống để dùng mặc định theo provider: Gemini `0.9`, local `1.3` |
| `BM25_MIN_SCORE` | Điểm BM25 mạnh tối thiểu để cứu kết quả semantic yếu, mặc định `5.5` |
| `HYBRID_SEMANTIC_WEIGHT` | Trọng số semantic trong RRF, mặc định `0.7` |
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

Tri thức/embedding lưu trong bảng `knowledge_chunks` của CSDL quan hệ (cùng DB với các bảng khác), không còn phụ thuộc filesystem riêng nên bền qua restart/redeploy.

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
- `/api/v1/workspaces`: workspace, prompt, widget settings, thành viên (kể cả đổi role qua
  `PUT /{id}/members/{user_id}/role`), lời mời và Knowledge Base.
- `/api/v1/chat`: chat thường/SSE, lịch sử, poll, thống kê, handoff, kích hoạt License Key và WebSocket.
- `/api/v1/admin`: Admin Dashboard — quản lý License Key, đổi plan `FREE`/`PRO`, tạo tài khoản
  Staff; chỉ role toàn cục `ADMIN` (enforce bằng `require_role`, `api/deps.py`).

Widget public phải gửi `X-Widget-Token`; nếu workspace có `allowed_domains`, backend kiểm tra
header `Origin` khớp một trong các domain đã lưu. Dashboard dùng JWT Bearer.

RBAC có **2 tầng độc lập**: `WorkspaceMember.role` (`admin`/`agent`, theo từng workspace) quyết
định ai sửa được cấu hình/thành viên/tri thức của workspace đó; `User.role`
(`USER`/`STAFF`/`ADMIN`, toàn cục) quyết định ai vào được `/api/v1/admin`. Hai tầng không giao
nhau — một user có thể là `agent` ở workspace này nhưng `ADMIN` toàn cục.

## Knowledge Base và RAG

- Định dạng: PDF, TXT, DOCX.
- Giới hạn: 50 MB/file.
- Chunk: 600 ký tự, overlap 100 và ưu tiên ranh giới đoạn/tiêu đề.
- Embedding production: Gemini `gemini-embedding-001`, task type `RETRIEVAL_DOCUMENT` và `QUESTION_ANSWERING`, 768 chiều.
- Retrieval: semantic Top-K kết hợp BM25 local bằng Reciprocal Rank Fusion.
- Truy vấn retrieval ghép tối đa hai tin nhắn user gần nhất để hiểu câu hỏi phụ thuộc lịch sử.
- Feature-hashing 384 chiều chỉ là fallback khi chạy local/test không có API key.
- Collection có version theo provider; sau khi đổi provider/model cần nạp lại tài liệu.
- Upload lại cùng `source_filename` sẽ xóa chunk cũ trước khi thêm chunk mới.
- Chat lọc chunk vượt `RAG_MAX_DISTANCE` hoặc chứa mẫu prompt injection.
- Không có context đủ tin cậy sẽ chuyển session sang `waiting_human`.

## Realtime và Handoff

- SSE stream token từ Ollama/Groq/Gemini cho widget.
- WebSocket truyền sự kiện tới Agent và widget.
- Redis Pub/Sub đồng bộ nhiều backend instance.
- Redis lock và cập nhật SQL có điều kiện chống hai Agent tiếp quản cùng lúc.
- Không có Redis sẽ dùng lock nội bộ một process.
- Fallback sau 60 giây được lập lịch trong process (WebSocket) và được kiểm tra lại ở endpoint
  poll. Cả hai nhánh trả `status` về lại `bot_handling` sau khi gửi fallback — không điều kiện
  theo cờ "đã gửi fallback", nên một session bị kẹt ở `waiting_human` từ trước khi cơ chế này
  tồn tại cũng tự lành ở lần poll kế tiếp.

## Freemium & License Key

- `User.plan` (`FREE`/`PRO`); workspace FREE giới hạn 50 tin/tháng (`message_count`/
  `message_count_period`) và `/widget-config` trả `watermark: true`.
- `LicenseKey` sinh bằng `secrets` (CSPRNG, định dạng `NOVA-XXXX-XXXX-XXXX-XXXX`); xác thực chỉ
  đối chiếu DB, không suy luận từ format chuỗi.
- Endpoint kích hoạt rate-limit 5 lần/phút/user (sliding window) chống brute-force đoán mã.

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
.\venv\Scripts\python.exe test_licensing.py
.\venv\Scripts\python.exe -m pytest test_embeddings.py test_retrieval.py
```

Trong CI, tám script chính và unit test embedding/retrieval được chạy qua `coverage`, gộp kết quả và yêu cầu tối thiểu 70% (thực tế 78%). Bandit cũng quét thư mục `app` với ngưỡng severity `high` (thực tế 0 High).
