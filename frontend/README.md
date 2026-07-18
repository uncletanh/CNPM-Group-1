# NovaChat AI Admin Dashboard

Dashboard là React 19 + TypeScript + Vite. Ứng dụng dùng JWT trong LocalStorage và gọi backend qua Axios.

## Chạy local

```powershell
npm.cmd ci
npm.cmd run dev
```

Mặc định dashboard chạy tại `http://localhost:5173` và gọi `http://localhost:8000/api/v1`.

Tạo `.env.local` khi cần đổi backend:

```env
VITE_API_URL=https://api.example.com/api/v1
```

## Màn hình hiện có

- **Đăng nhập:** email/mật khẩu, đăng ký và Google SSO.
- **Tổng quan:** số workspace và trạng thái hệ thống đọc trực tiếp từ `GET /health` thật (trạng
  thái bot, uptime tiến trình, kết nối DB/provider) — không còn số liệu hardcode.
- **Không gian làm việc:** tạo/xóa workspace, xem thành viên, đổi role thành viên hiện có
  (dropdown admin/agent), tạo link mời và xóa thành viên.
- **Cấu hình Bot AI:** system prompt, domain widget (nhiều domain), token, mã nhúng, màu, tên bot, lời chào, avatar URL, vị trí và preview.
- **Quản lý Tri thức:** upload PDF/TXT/DOCX, progress, danh sách tài liệu, preview chunk, xóa, thêm/sửa text và Test Bot.
- **Hộp thoại:** danh sách session, lịch sử, takeover, trả lời, resolve, WebSocket, âm thanh (nút "Bật thông báo") và Browser Notification khi khách yêu cầu gặp nhân viên.
- **Thống kê & Báo cáo:** tổng session/tin nhắn và phân nhóm theo trạng thái/người gửi.
- **Cài đặt hệ thống:** thông tin tài khoản và đổi mật khẩu. Đây chưa phải trang cấu hình vận hành toàn hệ thống.
- **Admin Dashboard:** chỉ hiện với role toàn cục `ADMIN` — quản lý License Key (sinh/kích hoạt),
  đổi plan `FREE`/`PRO` của user, tạo tài khoản Staff. Tách biệt hoàn toàn với role theo
  workspace (`admin`/`agent`).

## Kiểm tra chất lượng

```powershell
npm.cmd run lint
npm.cmd run build
```

Build production nằm trong `dist/`. `render.yaml` có blueprint static site mẫu; Vercel cũng có thể deploy thư mục `frontend` với biến `VITE_API_URL`.

## Giới hạn hiện tại

- Browser Notification chỉ hoạt động khi dashboard còn mở và người dùng đã cấp quyền; chưa có Service Worker/VAPID Web Push nền.
- Lời mời workspace hiện tạo link để sao chép, chưa gửi email tự động.
- Avatar widget nhận URL, chưa có upload ảnh.
- Dashboard chỉ có route cấp cao `/login` và `/dashboard`; các tab bên trong chưa có URL riêng.
