# Triển khai NovaChat AI

Ngày cập nhật: **15/07/2026**.

## Thành phần cần triển khai

1. FastAPI backend.
2. React dashboard dạng static site.
3. Widget UMD/CSS trên CDN hoặc static hosting.
4. PostgreSQL.
5. Redis cho môi trường nhiều backend instance.
6. Ollama trên máy có đủ RAM/CPU và ổ đĩa cho model.
7. Persistent volume cho `backend/chroma_data` hoặc một chiến lược Chroma server riêng.

## Biến môi trường backend

Sao chép `backend/.env.example` và thay toàn bộ giá trị production.

| Biến | Bắt buộc | Ghi chú |
|---|---|---|
| `DATABASE_URL` | Có | PostgreSQL; không dùng SQLite production |
| `SECRET_KEY` | Có | Chuỗi ngẫu nhiên dài, không commit |
| `FRONTEND_URL` | Có | Origin dashboard và OAuth redirect |
| `OLLAMA_BASE_URL` | Có | URL nội bộ tới Ollama |
| `OLLAMA_MODEL` | Có | Mặc định `qwen2.5:3b` |
| `REDIS_URL` | Khi scale | Bắt buộc khi có nhiều backend instance |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Nếu dùng SSO | Callback là `/api/v1/auth/google/callback` |
| `RAG_MAX_DISTANCE` | Nên đặt | Mặc định `1.2`, cần hiệu chỉnh bằng dữ liệu thật |
| `RATE_LIMIT_PER_MINUTE` | Nên đặt | Rate limiter hiện lưu trong memory từng instance |

Frontend cần `VITE_API_URL=https://<backend>/api/v1` tại thời điểm build.

## Quy trình release

1. Chạy GitHub Actions hoặc các lệnh test tương đương.
2. Backup PostgreSQL và Chroma persistent volume.
3. Chạy `cd backend && alembic upgrade head`.
4. Deploy backend và kiểm tra `GET /health`.
5. Kiểm tra `/metrics` trong mạng monitoring; endpoint này chưa có auth riêng.
6. Build/deploy dashboard với đúng `VITE_API_URL`.
7. Build widget, phát hành `script.umd.cjs` và `script.css` lên CDN.
8. Smoke test đăng nhập, upload tài liệu, Test Bot, SSE, handoff và WebSocket.

## Staging

- Dùng PostgreSQL và Redis tách biệt production.
- Dùng workspace/file test riêng để hiệu chỉnh `RAG_MAX_DISTANCE`.
- Cấu hình Google OAuth callback đúng domain staging.
- Kiểm tra `allowed_origin` của widget trên domain staging.
- Kiểm tra restart backend không làm mất PostgreSQL/Chroma data.

## Production

- Đặt Ollama trong mạng riêng; không công khai cổng `11434`.
- Không đặt Ollama lên Render free web service. Cần VM hoặc máy riêng có persistent disk và đủ tài nguyên.
- Gắn persistent disk cho ChromaDB. Nếu backend chạy nhiều instance, Chroma local filesystem không tự đồng bộ giữa các instance; cần shared architecture hoặc Chroma server trước khi scale ngang.
- Redis dùng cho Pub/Sub và distributed lock; Redis down sẽ rơi về lock trong process và không còn đảm bảo cross-instance.
- Rate limiter hiện là in-memory, chưa phải global distributed rate limit.
- Giới hạn quyền truy cập `/metrics` tại reverse proxy/firewall.
- Bật HTTPS và chuyển tiếp đúng header `Origin`/WebSocket.
- Thiết lập backup, log aggregation và cảnh báo Prometheus/Grafana hoặc dịch vụ tương đương.

## Blueprint hiện có

- `render.yaml`: backend Python và dashboard static mẫu.
- `docker-compose.yml`: backend, Redis và dashboard local; Ollama chạy trên host qua `host.docker.internal`.
- `.github/workflows/ci.yml`: Python 3.11, Node 22, backend tests, frontend/widget lint và build.

Các file này là nền tảng triển khai, chưa thay thế cấu hình secrets, persistent storage, domain, monitoring và backup của môi trường thật.
