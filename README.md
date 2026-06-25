# NovaChat AI 🤖

**Dự án môn học Kiến trúc Phần mềm - Nhóm 1**

NovaChat AI là nền tảng Chatbot ứng dụng RAG (Retrieval-Augmented Generation) và cơ chế Human-in-the-loop (Takeover) giúp tự động hóa khâu CSKH cho doanh nghiệp SME.

---

## 🚀 1. Yêu cầu Hệ thống (Prerequisites)

- **Python:** Phiên bản `3.11` hoặc `3.12` (Không dùng bản mới hơn để tránh lỗi biên dịch thư viện AI).
- **Node.js:** Phiên bản `18.0.0` trở lên.
- **Git:** Để pull/push code.

---

## ⚙️ 2. Hướng dẫn Thiết lập Backend (FastAPI)

Backend chứa Logic, API và bộ não AI (Langchain, ChromaDB).

**Bước 1:** Di chuyển vào thư mục backend và tạo môi trường ảo (Virtual Environment):
```bash
cd backend
python -m venv venv
```

**Bước 2:** Kích hoạt môi trường ảo:
- Trên **Windows (PowerShell):** `.\venv\Scripts\activate`
- Trên **Mac/Linux:** `source venv/bin/activate`
*(Nếu thấy chữ `(venv)` ở đầu dòng lệnh là thành công)*

**Bước 3:** Cài đặt thư viện:
```bash
pip install -r requirements.txt
```

**Bước 4:** Cấu hình biến môi trường:
- Tạo một file tên là `.env` trong thư mục `backend/`.
- Điền các thông tin sau vào file `.env`:
```env
DATABASE_URL=postgresql://[user]:[password]@[host]/[dbname]?sslmode=require
SECRET_KEY=mot_chuoi_bi_mat_bat_ky_dai_chut_cho_an_toan
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Bước 5:** Khởi chạy Server:
```bash
uvicorn app.main:app --reload
```
API sẽ chạy tại: `http://localhost:8000`. Xem tài liệu API tại `http://localhost:8000/docs`.

---

## 🎨 3. Hướng dẫn Thiết lập Frontend (React + Vite)

Frontend chứa giao diện trang quản trị cho Admin và Agent.

**Bước 1:** Mở một cửa sổ Terminal mới, di chuyển vào thư mục frontend:
```bash
cd frontend
```

**Bước 2:** Cài đặt các gói thư viện Node (bao gồm TailwindCSS v4):
```bash
npm install
```

**Bước 3:** Khởi chạy Server phát triển:
```bash
npm run dev
```
Giao diện sẽ chạy tại: `http://localhost:5173`.

---

## 👨‍💻 4. Quy trình làm việc (Git Flow)

Vui lòng tuân thủ quy tắc Pair Programming. **Tuyệt đối không push trực tiếp lên nhánh `main`.**

1. Tạo nhánh mới: `git checkout -b feature/ten-tinh-nang`
2. Viết code, commit.
3. Push lên GitHub: `git push origin feature/ten-tinh-nang`
4. Lên GitHub tạo Pull Request (PR) và nhờ Lead (Tiến Anh) vào Code Review.