# 9. Hành trình người dùng

## 1. Admin: từ đăng ký tới bot đầu tiên

| Bước | Hành động hiện có | Phản hồi hệ thống | Điểm cần cải thiện |
|---|---|---|---|
| Đăng nhập | Email/password hoặc Google SSO | JWT lưu ở LocalStorage | Verify email, reset password |
| Tạo workspace | Nhập tên workspace | Tạo prompt/token mặc định | Onboarding checklist |
| Nạp tri thức | Upload PDF/TXT/DOCX hoặc text | Progress, chunk, embedding | Job queue, OCR, ETA thật |
| Kiểm tra | Xem summary/preview, Test Bot | Hiển thị nội dung AI đã nạp | Evaluation set và quality score |
| Cấu hình | Prompt, domain, màu, tên, greeting, avatar URL, vị trí | Live preview và lưu backend | Upload avatar, token rotation |
| Nhúng | Sao chép script | Widget dùng workspace ID/token/API URL | CDN/versioning chính thức |

**Moment of truth:** Admin preview đúng tài liệu và Test Bot trả lời có nguồn. Không đặt SLA “30 giây” vì code chưa đo thời gian ingestion.

## 2. Customer: hỏi đáp và khôi phục session

1. Customer mở widget, không cần tài khoản.
2. Widget tải config và lời chào.
3. Câu hỏi được stream qua SSE; typing indicator hiển thị trước token đầu.
4. Citation xuất hiện khi backend trả nguồn.
5. `session_key` lưu LocalStorage; reload tải history.

**Failure states:**

- Ollama unavailable: widget hiển thị lỗi từ SSE.
- Không có context đủ tin cậy: backend chuyển `waiting_human` và trả thông báo handoff.
- WebSocket mất: polling vẫn lấy tin Agent/system.
- Session cũ không tồn tại: widget bỏ key và bắt đầu lại.

## 3. Customer và Agent: Human Handoff

| Bước | Customer | Agent/Omnibox | Trạng thái |
|---|---|---|---|
| Request | Bấm **Gặp nhân viên** | Nhận WebSocket refresh | `waiting_human` |
| Alert | Thấy đang kết nối | Âm thanh/Browser Notification nếu tab mở | `waiting_human` |
| Takeover | Thấy nhân viên hỗ trợ | Agent nhận ca; lock chống tranh chấp | `human_handling` |
| Reply | Nhận tin qua WebSocket/poll | Agent đọc history và trả lời | `human_handling` |
| Resolve | Nhận trạng thái hoàn tất | Agent đóng ca | `resolved` |

Nếu quá 60 giây chưa takeover, widget nhận system fallback message. Đây không phải cam kết có Agent phản hồi trong 60 giây.

## 4. Agent: gia nhập workspace

1. Admin tạo invitation và sao chép link.
2. Agent đăng ký/đăng nhập đúng email.
3. Agent accept invitation trước khi hết hạn 7 ngày.
4. Agent vào Omnibox và xem workspace được cấp quyền.

**Điểm ma sát:** link phải được gửi thủ công; chưa có email delivery hoặc trang quản trị lời mời chuyên sâu.

## 5. Khoảng trống UX ưu tiên

1. Web Push khi dashboard đóng.
2. Invitation email và password recovery.
3. Trạng thái ingestion dạng job có ETA/retry.
4. Token rotation và hướng dẫn publish widget/CDN.
5. Evaluation/feedback cho câu trả lời sai.
6. Canned responses và SLA queue cho Agent.
7. URL riêng/deep-link cho từng tab/session dashboard.
