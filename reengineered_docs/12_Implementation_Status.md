# 12. Trạng thái triển khai NovaChat AI

Ngày cập nhật: **18/07/2026**. Đây là nguồn trạng thái chuẩn của bộ tài liệu.

## Tổng quan

NovaChat AI đã hoàn thành luồng MVP từ tạo workspace, nạp tri thức, chat RAG streaming, trích dẫn nguồn đến Human Handoff và tùy chỉnh widget. Code đã merge vào `main`; GitHub Actions kiểm tra backend, dashboard và widget.

## Đã hoàn thiện

### Tài khoản và workspace

- Email/password register/login, JWT và đổi mật khẩu.
- Google OAuth login/callback khi có credentials.
- Account mới mặc định global role `agent`.
- Workspace owner, membership `admin`/`agent` và endpoint authorization.
- Invitation theo email/role/token, hạn 7 ngày, accept và remove member.

### Knowledge Base

- PDF, TXT, DOCX tối đa 50 MB và tri thức text trực tiếp.
- Chunk size 1.000, overlap 200; feature-hashing embedding 384 chiều tối ưu cho Render Free.
- Chroma collection riêng theo workspace.
- Danh sách document/chunk, metadata, preview nội dung/page và xóa.
- Quick edit text và thay thế chunk khi cùng filename.
- Test Bot trên dashboard.
- Xóa workspace xóa collection Chroma và SQL data liên quan.

### RAG và chat

- Chat response thường và POST SSE streaming.
- Ollama, Groq và Gemini provider; hỗ trợ chọn trực tiếp hoặc fallback `auto`.
- Top-K 1–5, `RAG_MAX_DISTANCE=1.2` mặc định.
- Lọc một số mẫu prompt injection ở question/chunk.
- Tối đa 10 tin nhắn gần nhất trong conversation context.
- Không đủ context sẽ không gọi LLM và chuyển sang handoff.
- API/SSE trả sources: filename, chunk, page, distance, preview.
- Message/session được lưu SQL; widget khôi phục history bằng LocalStorage session key.

### Human Handoff

- Các trạng thái `bot_handling`, `waiting_human`, `human_handling`, `resolved`.
- Widget có nút **Gặp nhân viên**.
- Omnibox xem sessions/history, takeover, reply và resolve.
- Redis distributed lock, conditional SQL assignment và process-local fallback.
- WebSocket cho Agent/widget, Redis Pub/Sub cho nhiều instance và polling fallback.
- System fallback message sau 60 giây bằng scheduled task + poll timeout check.
- Âm thanh và Browser Notification khi dashboard đang mở và đã cấp quyền.

### Widget và dashboard

- Widget build UMD/CSS bằng Vite Library Mode.
- Tùy chỉnh màu, tên bot, greeting, avatar URL và vị trí trái/phải.
- Live preview, widget token, allowed origin và mã nhúng.
- Dashboard có 7 khu vực: Tổng quan, Không gian làm việc, Cấu hình Bot AI, Quản lý Tri thức, Hộp thoại, Thống kê & Báo cáo, Cài đặt hệ thống.
- Analytics aggregate theo session status và message sender.

### Vận hành và chất lượng

- Alembic baseline Phase 4.
- `/health`, `/metrics`, JSON HTTP logging.
- In-memory POST chat rate limit theo IP/path.
- Docker Compose cho backend/Redis/dashboard.
- Render blueprint cho backend/dashboard.
- GitHub Actions: Python 3.11 và Node 22.
- Bảy nhóm test backend cho Chat/SSE, Knowledge Base, Phase 4 handoff/RAG, workspace/RBAC, auth/user, LLM provider và workspace CRUD.
- Coverage gate tổng tối thiểu 70% và Bandit SAST chặn lỗi severity `high`.

## Cần cấu hình khi triển khai

- `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` cho Google SSO.
- `FRONTEND_URL` khớp domain dashboard/OAuth.
- `REDIS_URL` khi chạy nhiều backend instance.
- Ollama server/model hoặc API key Groq/Gemini tùy provider triển khai.
- PostgreSQL production và persistent storage cho Chroma.
- `VITE_API_URL` tại build time của dashboard.
- HTTPS/reverse proxy hỗ trợ SSE và WebSocket.

## Chưa hoàn tất

### P0 trước production

- Staging/production deployment đã được smoke test end-to-end.
- Shared/persistent Chroma architecture cho scale ngang.
- Durable job queue cho ingestion và handoff timeout.
- Backup/restore, monitoring dashboard và alerting.
- Automated browser E2E, load test và security/tenant-isolation test.

### P1

- Web Push nền bằng Service Worker/VAPID.
- Email invitation, verify email và reset password.
- Distributed rate limiting và quota.
- Quản trị Agent nâng cao: đổi role, disable, ownership transfer.
- RAG evaluation dataset và tuning threshold trên dữ liệu thật.
- Migration Alembic đầy đủ thay cho `ensure_*_schema()` runtime.

### P2

- Upload/crop avatar và object storage.
- OCR/PDF scan, parser bảng/hình và ingestion progress theo job.
- Analytics theo thời gian, SLA, export và audit log.
- Token rotation cho widget.
- Mã nhúng production-ready lấy URL CDN/API từ cấu hình; snippet hiện còn URL mẫu/localhost.
- Deep link dashboard/session và canned responses.

## Giới hạn cần hiểu đúng

- `RAG_MAX_DISTANCE=1.2` là mặc định kỹ thuật, không bảo đảm chất lượng mọi dữ liệu.
- Regex prompt injection chỉ là một lớp bảo vệ, không phải sandbox hoàn chỉnh.
- Origin check không ngăn client ngoài browser giả mạo; widget token là credential public có phạm vi hẹp.
- Không Redis: realtime/lock chỉ an toàn trong một process.
- Browser Notification không chạy khi dashboard đã đóng.
- Rate limit hiện không dùng chung giữa backend instances.
- `/health` là liveness đơn giản, chưa kiểm tra dependency sâu.
- `render.yaml` là blueprint mẫu; Chroma persistence cần hạ tầng riêng, còn Ollama cần VM nếu không dùng Groq/Gemini.

## Kiểm tra đã có trong CI

```text
python -m compileall app
python test_chat_api.py
python test_knowledge_listing.py
python test_phase4_chat.py
python test_workspace_rbac.py
python test_auth_users.py
python test_llm_provider.py
python test_workspace_crud.py
coverage combine
coverage report --fail-under=70
bandit -r app --severity-level high
npm ci && npm run lint && npm run build  # frontend và widget
```

Khi trạng thái code thay đổi, cập nhật file này trước, sau đó đồng bộ backlog, kiến trúc và README liên quan.
