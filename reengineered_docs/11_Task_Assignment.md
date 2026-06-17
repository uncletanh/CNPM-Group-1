# 11. BẢNG PHÂN CÔNG CÔNG VIỆC (TASK ASSIGNMENT)

Dựa trên Product Backlog và phương pháp luận Agile / Pair Programming, dưới đây là bản phân công nhiệm vụ chi tiết để tối ưu hóa năng suất của team 5 người.

---

## 1. CƠ CẤU ĐỘI DỰ ÁN (TEAM STRUCTURE)

Việc áp dụng Pair Programming (Lập trình theo cặp) giúp các bạn sinh viên bù trừ điểm yếu cho nhau, giảm thiểu lỗi sai (bug) ngay từ lúc gõ code và đảm bảo không ai bị "tụt lại phía sau".

* **Lead / System Architect:** Nguyễn Tiến Anh
* **Pair 1 (Đội Backend & AI):** Lê Xuân Hiệp & Đào Minh Hiếu
* **Pair 2 (Đội Frontend & UI/UX):** Vũ Công Minh Thái & Trương Gia Bình

---

## 2. PHÂN BỔ CÔNG VIỆC THEO GIAI ĐOẠN (ROADMAP EXECUTION)

### Giai đoạn 1: Nền móng (Phase 1: Foundation) - Xây móng & Xác thực
* **Nguyễn Tiến Anh (Lead):** 
  * Thiết lập Repository Monorepo, chia cấu trúc thư mục chuẩn.
  * Cấu hình CI/CD Pipeline tự động.
  * Khởi tạo Database PostgreSQL trên server (Neon.tech).
* **Pair 1 (Hiệp - Hiếu):** 
  * Thiết kế Database Schema (SQLAlchemy Models) cho User, Workspace. 
  * Viết API RESTful Đăng nhập/Đăng ký và xác thực bằng JWT (FastAPI).
* **Pair 2 (Thái - Bình):** 
  * Cài đặt TailwindCSS và setup React Router.
  * Thiết kế giao diện (UI) trang Đăng nhập và Dashboard Workspace. 
  * Gọi API Login và xử lý lưu Token vào LocalStorage.

### Giai đoạn 2: Bộ Não AI (Phase 2: The Brain) - Nạp tri thức RAG
* **Nguyễn Tiến Anh (Lead):** 
  * Review code Phase 1 (Bắt lỗi và Approve Pull Request). 
  * Trực tiếp hỗ trợ thiết lập môi trường ChromaDB Vector Store.
* **Pair 1 (Hiệp - Hiếu):** 
  * Viết API Endpoint nhận file tải lên (PDF/TXT). 
  * Tích hợp LangChain để bóc tách text (Chunking) và nạp vào ChromaDB.
  * Viết logic cấu hình System Prompt.
* **Pair 2 (Thái - Bình):** 
  * Xây dựng giao diện trang "Knowledge Base".
  * Lập trình tính năng Kéo-thả (Drag & Drop) file PDF và thanh Progress bar chờ Upload.

### Giai đoạn 3: Gương Mặt (Phase 3: The Face) - Widget & Streaming
* **Nguyễn Tiến Anh (Lead):** 
  * Thiết kế logic bảo mật (CORS/Origin check) khóa tên miền cho Widget.
  * Hỗ trợ Pair 1 thiết lập Server-Sent Events (SSE) để truyền dữ liệu.
* **Pair 1 (Hiệp - Hiếu):** 
  * Viết API `/chat` tìm kiếm Vector (Retrieval) và đẩy vào OpenAI/Gemini. 
  * Lập trình luồng trả về kết quả dạng Stream (từng chữ) qua SSE. 
  * Xử lý lưu lịch sử đoạn Chat xuống Database.
* **Pair 2 (Thái - Bình):** 
  * Cấu hình Vite Library Mode cho project `widget` độc lập.
  * Dựng UI khung chat nhúng góc phải màn hình. 
  * Code logic bắt luồng Stream SSE để hiển thị chữ (Typing effect).

### Giai đoạn 4: Lưới An Toàn (Phase 4: The Safety Net) - Agent Omnibox
* **Nguyễn Tiến Anh (Lead):** 
  * Triển khai Redis Distributed Lock để giải quyết bài toán "Tranh chấp Takeover". 
  * Cấu hình kiến trúc WebSocket Pub/Sub cho server.
* **Pair 1 (Hiệp - Hiếu):** 
  * Viết WebSocket Server trên FastAPI đẩy tin nhắn Real-time. 
  * Xử lý Logic Handoff: Đổi trạng thái Session từ AI sang Người thật. 
  * Viết tính năng Auto-Responder (Quá 60s không Agent nào nhận thì Bot tự xin lỗi).
* **Pair 2 (Thái - Bình):** 
  * Code UI màn hình Omnibox chia làm 2 panel (Danh sách chat & Khung hội thoại). 
  * Cắm WebSocket để giao diện cập nhật ngay lập tức không cần F5. 
  * Code cơ chế Browser Push Notification & Âm thanh báo động.

### Giai đoạn 5: Đánh Bóng (Phase 5: Polish)
* **Nguyễn Tiến Anh (Lead):** Deploy Production. Test tổng thể.
* **Pair 1 (Hiệp - Hiếu):** Tối ưu hóa truy vấn Database. Dọn dẹp code rác.
* **Pair 2 (Thái - Bình):** Code tính năng đổi màu Widget (Color Picker) và sinh mã nhúng `<script>` cho Admin copy dán vào web. Cả Pair đi Fix bug giao diện CSS.

---

## 3. QUY TẮC LÀM VIỆC TRONG CẶP (PAIR PROGRAMMING RULES)

Việc phân Pair KHÔNG PHẢI là "Chia đôi việc ra để mỗi thằng code một nửa ở nhà". Đã gọi là Pair Programming, hai người (Hiệp - Hiếu) hoặc (Thái - Bình) phải ngồi cùng nhau (hoặc Call Discord share màn hình) để giải quyết chung 1 file code tại 1 thời điểm.

**Quy tắc Cầm Lái:**
* **Driver (Người cầm lái):** Là người trực tiếp gõ code. Vai trò của Driver là chỉ tập trung vào việc gõ chính xác cú pháp (Syntax), gọi hàm và thực thi logic hiện tại.
* **Navigator (Người dẫn đường):** Là người nhìn màn hình của Driver. Vai trò là review code trực tiếp bằng mắt (phát hiện gõ sai), suy nghĩ về kiến trúc tổng thể, tìm kiếm tài liệu (Google/StackOverflow) khi gặp lỗi.
* **Luân phiên (Switch):** Cứ mỗi 1-2 tiếng, Driver và Navigator phải ĐỔI VAI TRÒ cho nhau. Nếu Hiếu gõ thì Hiệp nhìn, sau đó Hiệp gõ thì Hiếu nhìn.

**Lợi ích:** 
Sẽ không bao giờ có chuyện dự án đổ vỡ vì một người xin nghỉ ốm, bởi vì người còn lại trong Pair đã nắm 100% logic của dòng code do chính họ review từ đầu đến cuối. Trưởng nhóm Tiến Anh cũng nhàn hơn khi Review Pull Request vì đoạn code đó thực chất đã được Review 1 lớp bởi chính người Navigator trong cặp.
