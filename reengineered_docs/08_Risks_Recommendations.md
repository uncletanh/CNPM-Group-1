# 8. Rủi ro và khuyến nghị

## Rủi ro đã có biện pháp giảm thiểu

### Handoff không có Agent nhận

- **Đã có:** trạng thái `waiting_human`, system fallback sau 60 giây, WebSocket và poll.
- **Còn lại:** task chạy trong process có thể mất khi restart. Poll chỉ bù khi widget tiếp tục gọi.
- **Khuyến nghị:** chuyển timeout sang durable job queue và đo handoff wait time.

### Hai Agent takeover cùng lúc

- **Đã có:** Redis lock, local lock fallback và conditional SQL update.
- **Còn lại:** khi nhiều instance nhưng Redis down, lock local không đảm bảo toàn cụm.
- **Khuyến nghị:** coi Redis là dependency bắt buộc production và alert khi fallback.

### Hallucination và prompt injection

- **Đã có:** system prompt, Top-K 1–5, `RAG_MAX_DISTANCE`, mẫu injection Việt/Anh, handoff khi không đủ context, citation.
- **Còn lại:** regex không phải phòng thủ prompt injection hoàn chỉnh; threshold chưa được đánh giá trên dữ liệu thật.
- **Khuyến nghị:** xây evaluation set, đo retrieval/groundedness và review source trước release.

### Cross-tenant data leak

- **Đã có:** workspace authorization trong SQL và collection Chroma riêng.
- **Còn lại:** widget token là public credential nằm trong script; origin chỉ là lớp bổ sung và có thể giả mạo ngoài browser.
- **Khuyến nghị:** rotation token, audit log, quota/rate limit và security test tenant isolation.

## Rủi ro còn mở

### ChromaDB local khi scale ngang

Mỗi backend instance dùng filesystem riêng sẽ thấy vector data khác nhau.

**Khuyến nghị:** dùng Chroma server/shared persistent volume có semantics rõ ràng hoặc chọn managed vector database trước khi scale.

### Ingestion đồng bộ

File tối đa 50 MB được parse/embed trong HTTP request, có thể gây timeout và tốn RAM/CPU.

**Khuyến nghị:** upload object storage, tạo ingestion job, worker xử lý và progress theo job state.

### Rate limiting không phân tán

Limiter hiện lưu deque trong memory theo IP/path của từng process.

**Khuyến nghị:** Redis-backed limiter, phân biệt widget/workspace/token và thêm quota.

### Notification không chạy nền

Browser Notification chỉ được tạo khi Omnibox đang mở.

**Khuyến nghị:** Service Worker, VAPID, lưu push subscription và permission UX rõ ràng.

### Quản lý dữ liệu và secrets

- `/metrics` chưa có auth trong application.
- Chưa có audit log, retention policy và export/delete request.
- Google/Ollama/DB/Redis secrets phụ thuộc cấu hình thủ công.

**Khuyến nghị:** bảo vệ metrics ở proxy, secret manager, backup/restore drill và data retention policy.

### Alembic mới là baseline

Runtime vẫn gọi `create_all()` và `ensure_*_schema()` để hỗ trợ database cũ.

**Khuyến nghị:** tạo migration cho mọi thay đổi tiếp theo, kiểm thử upgrade/rollback và dần bỏ schema mutation runtime.

## Kết luận

Kiến trúc hiện tại phù hợp MVP và học tập, nhưng chưa nên gọi là enterprise-grade trước khi hoàn thiện persistent vector architecture, durable jobs, distributed rate limit, E2E/security/load test và vận hành production có monitoring/backup.
