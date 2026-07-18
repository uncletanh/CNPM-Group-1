# 12. Trạng thái triển khai NovaChat AI

Ngày cập nhật: **19/07/2026**. Đây là nguồn trạng thái chuẩn của bộ tài liệu.

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
- Chunk size 600, overlap 100; Gemini embedding 768 chiều trên production và feature-hashing fallback local.
- Hybrid retrieval kết hợp semantic search, BM25 local và Reciprocal Rank Fusion.
- **Embedding lưu trực tiếp trong Postgres** (bảng `knowledge_chunks`, cột JSON), similarity
  tính bằng Python — **đã bỏ ChromaDB** vì Render Free có filesystem ephemeral, khiến tri thức
  nạp lên mất sau mỗi lần restart/redeploy (xem `FINAL_REPORT.md` mục 2.2/4).
- Danh sách document/chunk, metadata, preview nội dung/page và xóa.
- Quick edit text và thay thế chunk khi cùng filename.
- Test Bot trên dashboard.
- Xóa workspace xóa toàn bộ `knowledge_chunks` và SQL data liên quan trong Postgres.

### RAG và chat

- Chat response thường và POST SSE streaming.
- Ollama, Groq và Gemini provider; hỗ trợ chọn trực tiếp hoặc fallback `auto`.
- Top-K 1–5; confidence threshold theo embedding provider và `BM25_MIN_SCORE=5.5` mặc định.
- Lọc một số mẫu prompt injection ở question/chunk.
- Tối đa 10 tin nhắn gần nhất trong conversation context.
- Không đủ context sẽ không gọi LLM và chuyển sang handoff.
- API/SSE trả sources: filename, chunk, page, distance, preview.
- Message/session được lưu SQL; widget khôi phục history bằng LocalStorage session key.

### Human Handoff

- Các trạng thái `bot_handling`, `waiting_human`, `human_handling`, `resolved`.
- Widget có nút **Gặp nhân viên** (chỉ hiện khi `status === "bot_handling"`).
- Omnibox xem sessions/history, takeover, reply và resolve.
- Redis distributed lock, conditional SQL assignment và process-local fallback.
- WebSocket cho Agent/widget, Redis Pub/Sub cho nhiều instance và polling fallback.
- System fallback message sau 60 giây (`HUMAN_HANDOFF_TIMEOUT_SECONDS`) bằng scheduled task
  (WebSocket) + poll timeout check (polling) — **cả hai nhánh tự trả `status` về lại
  `bot_handling`** sau khi gửi fallback, kể cả cho phiên đã bị kẹt ở `waiting_human` từ trước
  khi fix tồn tại (self-healing, không cần sửa tay dữ liệu production).
- Âm thanh (Web Audio API) và Browser Notification cho Agent khi khách bấm gọi hỗ trợ — nút
  "Bật thông báo" trên Omnibox, lắng nghe event `handoff_requested` qua WebSocket. Chỉ hoạt
  động khi dashboard đang mở và Agent đã cấp quyền/bật một lần (yêu cầu tương tác người dùng
  trước khi trình duyệt cho phát âm thanh).

### Freemium & License Key

- `User.plan` (`FREE`/`PRO`) và `Workspace.message_count`/`message_count_period` cho hạn mức
  50 tin nhắn/tháng ở gói FREE; `/widget-config` trả `watermark: true` cho workspace FREE.
- `LicenseKey`: sinh bằng `secrets` (CSPRNG, định dạng `NOVA-XXXX-XXXX-XXXX-XXXX`), xác thực
  chỉ đối chiếu DB (không suy luận từ format chuỗi), endpoint kích hoạt rate-limit 5 lần/phút/user
  (sliding window) chống brute-force.
- RBAC toàn cục 2 tầng độc lập với RBAC theo workspace: `User.role` (`USER`/`STAFF`/`ADMIN`) qua
  dependency factory `require_role(*roles)`, quyết định ai vào được Admin Dashboard (quản lý
  License Key, đổi plan, tạo tài khoản Staff) — tách biệt hoàn toàn với `WorkspaceMember.role`
  (`admin`/`agent`, theo từng workspace).
- Chủ workspace/admin-workspace đổi được role của thành viên hiện có
  (`PUT /workspaces/{id}/members/{user_id}/role`) — trước đó role chỉ set được một lần lúc tạo
  invitation, không có cách đổi lại sau khi đã accept.

### Widget và dashboard

- Widget build UMD bằng Vite Library Mode, **CSS tự nhúng thẳng vào file JS**
  (`vite-plugin-css-injected-by-js`) — chỉ cần 1 thẻ `<script>` duy nhất, không cần `<link>`
  CSS riêng (nguyên nhân widget từng "load được nhưng không hiện" trên mọi nền tảng).
  Asset được serve từ **cùng origin với dashboard** (Vercel), không phải CDN riêng.
  Không dùng Shadow DOM/iframe (chủ đích, nhẹ và tương thích rộng) nên nội dung bot render qua
  `ReactMarkdown` có thể bị CSS toàn cục của trang host đè lên — tự vệ bằng CSS scope theo
  `#novachat-widget-root` với `!important`.
- Ô nhập tin nhắn là `<textarea>` tự phình cao tối đa 120px (Enter gửi, Shift+Enter xuống dòng)
  — trước đó dùng `<input type="text">`, không thể xuống dòng theo spec HTML khi gõ dài.
- Tùy chỉnh màu, tên bot, greeting, avatar URL và vị trí trái/phải.
- Live preview, widget token, allowed origin (nhiều domain, `allowed_domains`) và mã nhúng —
  copy-paste-only, không cần chỉnh sửa gì thêm.
- Dashboard có 7 khu vực: Tổng quan (dữ liệu `/health` thật: uptime, DB, LLM provider — không
  còn số liệu hardcode), Không gian làm việc, Cấu hình Bot AI, Quản lý Tri thức, Hộp thoại,
  Thống kê & Báo cáo, Cài đặt hệ thống.
- Analytics aggregate theo session status và message sender.

### Vận hành và chất lượng

- Alembic baseline Phase 4.
- `/health`, `/metrics`, JSON HTTP logging.
- In-memory POST chat rate limit theo IP/path.
- Docker Compose cho backend/Redis/dashboard.
- Render blueprint cho backend/dashboard.
- GitHub Actions: Python 3.11 và Node 22.
- Tám nhóm test backend cho Chat/SSE, Knowledge Base, Phase 4 handoff/RAG (kèm regression cho
  fallback timeout + self-heal phiên kẹt từ trước), workspace/RBAC, auth/user, LLM provider,
  workspace CRUD và Freemium/License Key/Admin RBAC/rate-limit.
- Coverage gate tổng tối thiểu 70% (thực tế **78%**) và Bandit SAST chặn lỗi severity `high`
  (thực tế **0 High**) — số liệu thật xem `EVIDENCE.md`.
- Golden dataset RAG 50 câu gồm factual, paraphrase, history, handoff và prompt injection.

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
- Quản trị Agent nâng cao: disable, ownership transfer (đổi role thành viên hiện có **đã xong**).
- Chạy benchmark 50 câu trên từng model và tuning threshold bằng dữ liệu thật.
- Migration Alembic đầy đủ thay cho `ensure_*_schema()` runtime.

### P2

- Upload/crop avatar và object storage.
- OCR/PDF scan, parser bảng/hình và ingestion progress theo job.
- Analytics theo thời gian, SLA, export và audit log.
- Token rotation cho widget.
- Deep link dashboard/session và canned responses.

## Giới hạn cần hiểu đúng

- Threshold semantic/BM25 là mặc định kỹ thuật, phải benchmark lại theo workspace và tài liệu thật.
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
python test_licensing.py
coverage run -p -m pytest test_embeddings.py test_retrieval.py
coverage combine
coverage report --fail-under=70
bandit -r app --severity-level high
npm ci && npm run lint && npm run build  # frontend và widget
```

Khi trạng thái code thay đổi, cập nhật file này trước, sau đó đồng bộ backlog, kiến trúc và README liên quan.
