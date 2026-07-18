# DEMO_SCRIPT.md — Kịch bản Live Demo trên Cloud (8 phút)

Đã **kiểm thử thật** toàn bộ script này bằng cách gọi trực tiếp API production
(`https://cnpm-group-1.onrender.com`) trước khi ghi vào đây — không phải suy đoán. Có sẵn 2
workspace demo đã nạp tài liệu, dùng ngay hoặc tự tạo lại theo đúng bước dưới.

**Quan trọng:** demo trên **dashboard thật** (`https://cnpm-group-1.vercel.app`) và **widget nhúng
thật**, không phải gọi API bằng tay — phần dưới chỉ mô tả *nội dung* cần gõ, còn thao tác là
click chuột/gõ vào khung chat như người dùng thật.

---

## Chuẩn bị trước giờ bảo vệ (làm 1 lần, trước ít nhất vài giờ)

1. Đăng nhập dashboard: `https://cnpm-group-1.vercel.app`.
2. Vào **Không gian làm việc** → tạo (hoặc dùng lại) 2 workspace:
   - **Workspace A** ("Công ty A"): vào **Quản lý Tri thức** → dán đoạn văn bản:
     > NovaChat AI cung cấp gói miễn phí FREE cho workspace thử nghiệm với tối đa 50 tin nhắn
     > một tháng. Gói PRO không giới hạn tin nhắn và ẩn watermark, kích hoạt bằng License Key
     > dạng NOVA-XXXX-XXXX-XXXX-XXXX. Thời gian bảo hành sản phẩm là 12 tháng tính từ ngày mua.
   - **Workspace B** ("Công ty B"): nạp đoạn khác hẳn, ví dụ giá vé xe khách.
3. Vào tab **Cấu hình Bot AI** → copy snippet nhúng của **Workspace A** → dán vào một trang HTML
   bất kỳ (hoặc dùng ngay Preview/Test trong dashboard nếu có) → mở sẵn trên máy trình chiếu.
4. Test thử 1 lần **trước** giờ bảo vệ đúng 3 câu hỏi ở dưới, xác nhận trả lời đúng như mô tả.

*(Đã có sẵn 2 workspace demo với nội dung y hệt trên, kiểm thử qua API thành công — nếu muốn
dùng lại thay vì tạo mới, hỏi Lead lấy thông tin đăng nhập.)*

---

## Kịch bản demo (khớp đúng BDD trong `FINAL_REPORT.md` mục 1.4)

### 1. Câu hỏi CÓ trong tài liệu (≈2 phút)
Gõ vào widget của **Workspace A**:
> "Gói FREE tối đa bao nhiêu tin nhắn một tháng?"

**Kết quả đã xác nhận thật:**
> "Dựa trên thông tin được cung cấp, gói FREE hỗ trợ tối đa 50 tin nhắn một tháng."

Chỉ ngay vào phần **nguồn trích dẫn** hiển thị dưới câu trả lời (`chinh-sach.txt`) — đây là
điểm rubric muốn thấy: bot không bịa, luôn có thể truy ngược ra tài liệu gốc.

### 2. Câu hỏi NGOÀI tài liệu — chống hallucination (≈2 phút)
Gõ:
> "Thủ đô của nước Pháp là gì?"

**Kết quả đã xác nhận thật:**
> "Tôi chưa tìm thấy thông tin đủ tin cậy trong tài liệu được cung cấp. Tôi đã chuyển hội thoại
> tới nhân viên hỗ trợ để giúp bạn chính xác hơn."

Nhấn mạnh: bot **từ chối bịa** dù đây là câu hỏi phổ thông mà LLM thừa khả năng trả lời — đây
chính là guardrail đã thiết kế có chủ đích (mục 2.4 `FINAL_REPORT.md`), không phải model yếu.

### 3. Cách ly dữ liệu đa tenant (≈2 phút) — quan trọng nhất, dễ ăn điểm bảo mật
Vẫn ở widget **Workspace A**, gõ câu hỏi mà đáp án CHỈ có trong tài liệu của **Workspace B**:
> "Giá vé xe khách Hà Nội - Sài Gòn là bao nhiêu?"

**Kết quả đã xác nhận thật:**
> "Dạ, hiện tại tôi không có thông tin về giá vé xe khách Hà Nội - Sài Gòn trong tài liệu được
> cung cấp. Xin vui lòng liên hệ nhân viên hỗ trợ để được trợ giúp tốt nhất ạ."

Giải thích ngay: mỗi truy vấn RAG **bắt buộc filter theo `workspace_id`** ở tầng service
(`retrieval.py`/`chat.py`) — Workspace A không bao giờ "thấy" được chunk của Workspace B, vì
chunk đó không hề nằm trong tập ứng viên được truy hồi, không phải vì LLM "tự chọn không nói".

### 4. (Nếu còn thời gian, ≈2 phút) Human Takeover
- Gửi 1 câu hỏi bất kỳ → bấm **"Gặp nhân viên"** trên widget.
- Qua tab **Hộp thoại (Omnibox)** trên dashboard (đăng nhập ở tab khác) → thấy hội thoại xuất
  hiện realtime → bấm **Tiếp quản** → gửi 1 tin nhắn từ vai nhân viên → tin nhắn xuất hiện
  ngay trên widget khách hàng (SSE/WebSocket, không cần refresh).

---

## Nếu có sự cố khi demo trực tiếp

- **Widget không hiện:** đã fix triệt để (PR #54, xem `FINAL_REPORT.md` mục 4) — nếu vẫn xảy ra,
  mở DevTools Console, đọc lỗi, không đoán.
- **Bot trả lời chậm/timeout:** Render Free có thể "ngủ" nếu không có traffic — mở trước dashboard
  và gọi thử 1 câu hỏi ít nhất 5–10 phút trước khi lên trình bày để "đánh thức" backend.
- **Trả lời sai/khác kịch bản:** vẫn nói được — vì đã hiểu rõ pipeline RAG hoạt động ra sao,
  giải thích *tại sao* nó trả lời như vậy tốt hơn là chỉ demo một kịch bản đã học thuộc.
