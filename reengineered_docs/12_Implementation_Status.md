# Trạng thái triển khai NovaChat AI

Ngày cập nhật: 15/07/2026

## Đã hoàn thiện

- Human Handoff: nút **Gặp nhân viên**, trạng thái chờ, tiếp quản nguyên tử, Redis Distributed Lock, WebSocket kết hợp Redis Pub/Sub, tự động phản hồi sau 60 giây, âm thanh và Browser Notification.
- RAG Guardrails: ngưỡng khoảng cách vector, lọc prompt injection, tự chuyển Agent khi độ tin cậy thấp, dùng 10 tin nhắn gần nhất làm ngữ cảnh.
- Trích dẫn: API thường và SSE đều trả tên tài liệu, chunk, trang; Widget hiển thị nguồn bên dưới câu trả lời.
- Tài khoản và phân quyền: Google SSO, lời mời workspace, vai trò Admin/Agent và kiểm tra quyền theo endpoint.
- Knowledge Base: PDF/TXT/DOCX, preview, nhập và sửa văn bản, Test Bot, thay thế tài liệu trùng tên và xóa collection Chroma cùng workspace.
- Widget: Color Picker, avatar, tên bot, lời chào, vị trí trái/phải và preview trực tiếp.
- Vận hành: Alembic baseline, rate limiting, logging JSON, health/metrics, Redis Docker, Render staging/production mẫu và GitHub Actions.

## Cấu hình cần cung cấp khi triển khai

- Google SSO chỉ hoạt động sau khi điền `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET`.
- Môi trường nhiều backend instance phải có `REDIS_URL`; local không có Redis sẽ dùng khóa trong process để vẫn phát triển được.
- Browser Notification cần người dùng bấm nút chuông cấp quyền. Thông báo hiện hoạt động khi dashboard đang mở; Web Push chạy nền cần thêm VAPID và Service Worker trong một sprint vận hành riêng.
- Giá trị `RAG_MAX_DISTANCE=1.2` là mặc định ban đầu, cần hiệu chỉnh trên dữ liệu thật của từng doanh nghiệp.
