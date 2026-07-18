# 4. Kịch bản người dùng

## Scenario 1: Onboarding và nạp tri thức

1. Admin đăng ký bằng email/mật khẩu hoặc Google SSO đã cấu hình.
2. Admin tạo workspace.
3. Trong **Quản lý Tri thức**, Admin upload PDF/TXT/DOCX hoặc nhập text.
4. Progress hiển thị giai đoạn upload và tạo embedding.
5. Tài liệu xuất hiện trong danh sách; Admin có thể preview chunk/page.
6. Admin mở **Test Bot** để hỏi thử trước khi nhúng.

**Kết quả:** dữ liệu (nội dung + embedding) được lưu trong Postgres, gắn `workspace_id`. Upload lại cùng filename thay thế chunk cũ.

**Giới hạn:** thời gian xử lý phụ thuộc kích thước file và model embedding; code không cam kết hoàn thành trong 30/60 giây.

## Scenario 2: Cấu hình và nhúng widget

1. Admin mở **Cấu hình Bot AI**.
2. Cập nhật system prompt, allowed origin, màu, tên, lời chào, avatar URL và vị trí.
3. Xem preview và sao chép mã nhúng.
4. Website tải JavaScript/CSS widget từ nơi đã phát hành.

**Kết quả:** widget lấy public config bằng widget token và áp dụng tùy chỉnh.

## Scenario 3: Hỏi đáp RAG có trích dẫn

1. Customer gửi câu hỏi.
2. Backend lưu tin nhắn, lấy Top-K context đạt threshold và thêm tối đa 10 tin gần nhất.
3. Ollama trả token qua SSE.
4. Widget hiển thị nội dung và nguồn khi event `done` tới.

**Nhánh lỗi:** nếu Ollama không chạy, API phát lỗi provider. Nếu không có context đủ tin cậy hoặc phát hiện mẫu injection, session chuyển sang `waiting_human`.

## Scenario 4: Customer yêu cầu nhân viên

1. Customer bấm **Gặp nhân viên**.
2. Session chuyển sang `waiting_human`; Omnibox nhận sự kiện WebSocket.
3. Nếu Agent đã bật thông báo và dashboard còn mở, trình duyệt phát âm thanh/Browser Notification.
4. Agent bấm takeover; Redis lock và conditional SQL update ngăn double assignment.
5. Agent trả lời và resolve; widget nhận sự kiện, đồng thời polling là fallback.
6. Sau 60 giây chưa có Agent, hệ thống thêm một system fallback message.

**Giới hạn:** chưa có Web Push khi dashboard đã đóng; timer trong process được bổ sung bằng kiểm tra timeout ở endpoint poll.

## Scenario 5: Khôi phục phiên chat

Widget lưu `session_key` trong LocalStorage. Khi người dùng reload cùng trình duyệt, widget gọi history để tải lại message. Nếu database đã reset hoặc session không còn tồn tại, widget xóa key cũ và bắt đầu session mới.

## Scenario 6: Mời Agent

1. Admin tạo invitation theo email và role.
2. Dashboard tạo token/link hết hạn sau 7 ngày để sao chép.
3. Người được mời đăng ký/đăng nhập bằng đúng email và mở link accept.
4. Backend tạo membership `admin` hoặc `agent`.

**Giới hạn:** chưa có dịch vụ gửi email invitation tự động.
