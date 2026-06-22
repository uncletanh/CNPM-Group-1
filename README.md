# 🚀 NovaChat AI - Hệ thống Quản lý Workspace Chatbot

Chào mừng bạn đến với **NovaChat AI** - Đồ án Nhóm 1 môn Công nghệ Phần mềm (CNPM). 
Đây là một hệ thống Web Application Full-Stack hiện đại dùng để khởi tạo và quản lý các Không gian làm việc (Workspace) cho Chatbot AI, được tích hợp kiến trúc UI/UX cao cấp và tính năng bảo mật chuẩn công nghiệp.

![NovaChat Cover](https://via.placeholder.com/1200x400/0f172a/6366f1?text=NovaChat+AI+Workspace+Manager) <!-- Hình ảnh minh họa (có thể thay thế sau) -->

## ✨ Các tính năng nổi bật
* **Đăng nhập & Đăng ký an toàn:** Cơ chế băm mật khẩu `bcrypt` và xác thực phiên đăng nhập bằng `JWT (JSON Web Token)`.
* **Giao diện Kính mờ (Glassmorphism):** Thiết kế giao diện cực kỳ hiện đại, cao cấp với Tailwind CSS v4, bao gồm chế độ Dark Mode mặc định.
* **Quản lý Workspace:** Tạo mới, xem danh sách và xóa các Không gian làm việc.
* **Responsive Design:** Tương thích hiển thị từ màn hình máy tính đến thiết bị di động.
* **Bảo vệ Route (Protected Routes):** Chặn các truy cập trái phép vào trang Dashboard.

## 🛠️ Công nghệ sử dụng (Tech Stack)
* **Frontend:** React 18, Vite, Tailwind CSS v4, Lucide React (Icons), React Router v6.
* **Backend:** FastAPI (Python), SQLAlchemy (ORM), SQLite (Database mặc định).
* **Bảo mật:** Passlib (Bcrypt), Python-Jose (JWT), CORS Middleware.
* **Triển khai:** Docker & Docker Compose.

---

## ⚡ Hướng dẫn cài đặt và chạy dự án

Dự án này đã được đóng gói hoàn chỉnh bằng **Docker**, giúp bạn bỏ qua các bước cài đặt môi trường rườm rà. Máy tính của bạn chỉ cần cài sẵn **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**.

### 🐳 Cách 1: Chạy bằng Docker (Khuyên dùng - Nhanh gọn nhất)
Chỉ với 1 dòng lệnh duy nhất, toàn bộ Frontend, Backend và Database sẽ được tự động cài đặt và kết nối.

1. Clone code về máy và mở Terminal tại thư mục `CNPM-Group-1`.
2. Gõ lệnh sau để khởi chạy:
   ```bash
   docker compose up --build
   ```
3. Chờ một lát để hệ thống tải môi trường. Khi Terminal báo server đã chạy thành công, hãy mở trình duyệt web:
   * **Giao diện Ứng dụng (Frontend):** [http://localhost:5173/login](http://localhost:5173/login)
   * **Tài liệu API (Backend Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)

*Để tắt server, hãy bấm `Ctrl + C` ở Terminal hoặc chạy lệnh `docker compose down`.*

---

### 💻 Cách 2: Chạy thủ công (Dành cho nhà phát triển - Dev Mode)
Nếu bạn muốn đóng góp code hoặc chạy không dùng Docker, hãy làm theo các bước sau:

**1. Khởi động Backend (FastAPI)**
Yêu cầu: Máy đã cài `Python 3.9+`.
```bash
cd backend
python -m venv venv           # Tạo môi trường ảo (Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt # Cài thư viện
uvicorn app.main:app --reload   # Chạy Server Backend (Mặc định ở cổng 8000)
```

**2. Khởi động Frontend (React + Vite)**
Yêu cầu: Máy đã cài `Node.js 18+`. Mở một Terminal mới:
```bash
cd frontend
npm install       # Cài các gói thư viện Node
npm run dev       # Chạy Server Frontend (Mặc định ở cổng 5173)
```

---

## 👥 Danh sách Nhóm 1 - CNPM
* **Pair 1 (Hiệp - Hiếu):** Thiết kế Database, viết API Backend (Đăng ký/Đăng nhập), Xác thực JWT.
* **Pair 2 (Thái - Bình):** Cấu hình Frontend (Vite, TailwindCSS, Router), Thiết kế UI Login/Dashboard, Tích hợp gọi API.

> *Sản phẩm được phát triển nhằm mục đích phục vụ báo cáo bài tập giữa kỳ môn Công Nghệ Phần Mềm.*