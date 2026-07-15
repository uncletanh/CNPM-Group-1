# Triển khai NovaChat AI

## Môi trường staging

1. Tạo PostgreSQL, Redis và một máy chạy Ollama có thể truy cập từ backend.
2. Sao chép các biến trong `backend/.env.example`, dùng khóa bí mật riêng và đặt `FRONTEND_URL` đúng domain staging.
3. Chạy `alembic upgrade head` trước khi khởi động backend.
4. Build dashboard với `VITE_API_URL=https://api-staging.example.com/api/v1`.
5. Kiểm tra `/health`, `/metrics`, Google callback và origin của Widget.

## Môi trường production

- Không dùng SQLite; cấu hình `DATABASE_URL` tới PostgreSQL có backup tự động.
- Redis là bắt buộc khi chạy nhiều backend instance để khóa tiếp quản hội thoại.
- Đặt Ollama trong mạng riêng, không công khai cổng `11434` ra Internet.
- Chỉ cho hệ thống monitoring truy cập `/metrics`; bật HTTPS tại reverse proxy.
- Chạy migration như một release command trước khi chuyển traffic.
- GitHub Actions phải xanh cho backend, dashboard và widget trước khi deploy.

Blueprint `render.yaml` cung cấp backend và dashboard mẫu. Ollama cần máy chủ riêng vì Render không phù hợp để chạy model cục bộ lâu dài.
