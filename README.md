# NovaChat AI 🤖

**Dự án môn học Kiến trúc Phần mềm - Nhóm 1**

NovaChat AI là nền tảng Chatbot ứng dụng RAG (Retrieval-Augmented Generation) và cơ chế Human-in-the-loop (Takeover) giúp tự động hóa khâu CSKH cho doanh nghiệp SME.

---

## 🚀 1. Yêu cầu Hệ thống (Prerequisites)

- **Python:** Phiên bản `3.11` hoặc `3.12` (Không dùng bản mới hơn để tránh lỗi biên dịch thư viện AI).
- **Node.js:** Phiên bản `18.0.0` trở lên.
- **Git:** Để pull/push code.
- **Ollama:** Cài từ [ollama.com](https://ollama.com), sau đó chạy `ollama pull qwen2.5:3b`. Đây là LLM chạy local mà tính năng Chat (RAG) dùng — nếu không có, gọi `/api/v1/chat` sẽ bị lỗi 503 "Không thể kết nối Ollama".

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

## 💬 4. Tính năng Chat & Human-in-the-loop

Hệ thống hỗ trợ đầy đủ luồng chatbot RAG + tiếp quản bởi nhân viên:

- **Chat RAG có streaming:** Widget gọi `POST /api/v1/chat/{workspace_id}/stream` (SSE) để hiển thị câu trả lời theo hiệu ứng gõ chữ thời gian thực, dựa trên tri thức đã nạp trong ChromaDB.
- **Lưu lịch sử hội thoại:** Mỗi phiên chat là một `ChatSession` (khoá `session_key`), mọi tin nhắn (khách/bot/nhân viên) được lưu vào bảng `messages`.
- **Hộp thoại (Omnibox):** Trong Dashboard → tab **Hộp thoại**, admin theo dõi mọi cuộc hội thoại theo thời gian thực, xem nội dung, và **Tiếp quản** khi cần hỗ trợ trực tiếp.
- **Human Takeover:** Khi nhân viên bấm *Tiếp quản* (`status = human_handling`), bot ngừng trả lời; nhân viên nhắn trực tiếp, khách nhận phản hồi qua cơ chế polling. Bấm *Đã xử lý* (`resolved`) để trả quyền lại cho bot.
- **Bảo mật widget:** Endpoint `/chat` công khai được bảo vệ bằng `widget_token` riêng của từng workspace (không phải JWT admin), kèm tuỳ chọn khoá theo domain (`allowed_origin`).

### Nhúng Widget vào website khách hàng

```html
<script src="https://cdn-cua-ban/script.umd.js"
        data-workspace-id="1"
        data-widget-token="<widget_token lay trong Dashboard>"
        data-api-url="https://api-cua-ban/api/v1"></script>
```

Khi chạy widget cục bộ (`cd widget && npm run dev`), copy `widget/.env.example` → `widget/.env.local` và điền `VITE_WORKSPACE_ID` + `VITE_WIDGET_TOKEN`.

---

## 👨‍💻 5. Quy trình làm việc (Git Flow)

Vui lòng tuân thủ quy tắc Pair Programming. **Tuyệt đối không push trực tiếp lên nhánh `main`.**

1. Tạo nhánh mới: `git checkout -b feature/ten-tinh-nang`
2. Viết code, commit.
3. Push lên GitHub: `git push origin feature/ten-tinh-nang`
4. Lên GitHub tạo Pull Request (PR) và nhờ Lead (Tiến Anh) vào Code Review.