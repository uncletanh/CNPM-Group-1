# 8. Rủi ro và khuyến nghị

## Rủi ro đã có biện pháp giảm thiểu

### Handoff không có Agent nhận

- **Đã có:** trạng thái `waiting_human`, system fallback sau 60 giây (WebSocket + poll), và
  session tự trả về `bot_handling` sau fallback — kể cả phiên đã bị kẹt ở `waiting_human` từ
  trước khi cơ chế tự trả tồn tại (self-heal không điều kiện theo cờ "đã gửi fallback", xem
  `AI_ENGINEERING_REFLECTION.md` mục 3.4).
- **Còn lại:** task chạy trong process có thể mất khi restart (chỉ nhánh WebSocket; nhánh poll
  vẫn tự bù vì kiểm tra lại timeout mỗi lần gọi). Poll chỉ bù khi widget tiếp tục gọi (widget
  đóng hoàn toàn thì không có gì trigger cho tới khi mở lại).
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

- **Đã có:** workspace authorization trong SQL, và embedding tri thức lưu trong Postgres luôn
  lọc theo `workspace_id` ngay trong câu query truy hồi (không có tầng vector DB tách biệt cần
  đồng bộ theo, nên không có nguy cơ "quên filter ở tầng khác").
- **Còn lại:** widget token là public credential nằm trong script; `allowed_domains` (Origin
  header) chỉ là lớp bổ sung và có thể giả mạo ngoài browser.
- **Khuyến nghị:** rotation token, audit log, quota/rate limit và security test tenant isolation.

## Rủi ro còn mở

### Widget bị ảnh hưởng bởi CSS của trang host

Widget không dùng Shadow DOM/iframe (chủ đích, nhẹ + tương thích rộng), nên nội dung bot render
qua `ReactMarkdown` ra thẻ HTML thường (`<p>/<li>/<h1-6>`) có thể bị CSS toàn cục của trang host
đè lên — đã gặp thật trên một site khách có typography riêng cho đọc thơ.

**Đã giảm nhẹ:** CSS scope theo `#novachat-widget-root` với `!important` cho các thẻ markdown.
**Còn lại:** đây là giảm nhẹ theo từng loại thẻ đã biết, không phải cách ly tuyệt đối — một CSS
host đủ lạ (ví dụ `!important` trùng, hoặc target qua thuộc tính khác ngoài thẻ/class) vẫn có
thể xuyên qua.

**Khuyến nghị:** nếu gặp lại, kiểm tra bằng cách tải thử HTML/CSS thật của site khách trước khi
đoán nguyên nhân — lưu ý riêng: đơn vị `rem` trong CSS luôn tính theo font-size của `<html>` của
toàn bộ document theo spec, nên kể cả đặt widget trong Shadow DOM cũng **không** tự cách ly được
kích thước tính bằng `rem`; phải chủ động đổi sang đơn vị `px`/`em` có mốc cục bộ riêng nếu muốn
cách ly thật.

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

Kiến trúc hiện tại phù hợp MVP và học tập, nhưng chưa nên gọi là enterprise-grade trước khi hoàn thiện durable jobs, distributed rate limit, E2E/security/load test và vận hành production có monitoring/backup.
