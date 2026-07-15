# 6. User stories và tiêu chí nghiệm thu

## Knowledge Base

**Là Admin**, tôi muốn nạp PDF/TXT/DOCX hoặc text để bot dùng tri thức riêng.

- File tối đa 50 MB, rỗng/sai định dạng bị từ chối.
- Summary hiển thị số document/chunk và metadata.
- Preview hiển thị chunk, page nếu có.
- Upload lại cùng filename thay thế dữ liệu cũ.
- Xóa workspace xóa collection Chroma tương ứng.

**Trạng thái:** Đã có automated test cho list/delete và UI cho upload/preview/text.

## RAG Chat

**Là Customer**, tôi muốn thấy câu trả lời được stream và có nguồn.

- POST SSE phát event `session`, `chunk`, `done` hoặc `error`.
- `done` chứa `context_chunks` và `sources`.
- Câu hỏi không có context đạt threshold chuyển session sang `waiting_human`.
- Lịch sử tối đa 10 message được đưa vào prompt.

**Trạng thái:** Đã có test Chat API và Phase 4 guardrails/history/citations.

## Human Handoff

**Là Customer**, tôi muốn chủ động gặp nhân viên.

- Nút **Gặp nhân viên** tạo hoặc cập nhật session `waiting_human`.
- Widget hiển thị trạng thái chờ và nhận tin Agent qua WebSocket/poll.
- Sau timeout, system message fallback xuất hiện.

**Là Agent**, tôi muốn tiếp quản một cách độc quyền, trả lời và đóng ca.

- Agent phải là owner/member của workspace.
- Hai Agent cạnh tranh: chỉ một người được assign, người còn lại nhận 409/403.
- Chỉ Agent đã takeover mới reply.
- Resolve chuyển session sang `resolved`; tin nhắn Customer tiếp theo có thể mở lại bot flow.

**Trạng thái:** Đã có test handoff/takeover/reply/poll/resolve.

## Notification

**Là Agent**, tôi muốn được báo khi khách yêu cầu hỗ trợ.

- Khi dashboard đang mở và đã cấp quyền, Omnibox phát âm thanh và Browser Notification.
- WebSocket làm mới session; polling vẫn dùng làm fallback.

**Trạng thái:** Hoàn thiện trong phạm vi tab đang mở. Service Worker/VAPID Web Push nền chưa có.

## Workspace RBAC

**Là Admin**, tôi muốn mời Agent và giới hạn quyền cấu hình.

- Invitation gắn email, role, token và hạn 7 ngày.
- Đúng email mới accept được.
- Agent đọc/xử lý hội thoại nhưng bị chặn khỏi widget settings/member management.

**Trạng thái:** Đã có automated test RBAC/invitation. Chưa gửi email tự động.

## Widget Customization

**Là Admin**, tôi muốn tùy chỉnh widget trước khi nhúng.

- Màu HEX, tên bot, greeting, avatar URL và trái/phải được lưu.
- Preview cập nhật theo dữ liệu nhập.
- Widget public tải config bằng widget token.

**Trạng thái:** Đã có. Upload asset avatar chưa có.
