# 1. Giới thiệu sản phẩm

Ngày cập nhật: **15/07/2026**.

## NovaChat AI là gì?

NovaChat AI là nền tảng chatbot RAG dành cho doanh nghiệp SME. Doanh nghiệp tạo workspace, nạp tài liệu riêng và nhúng widget vào website. AI tìm context trong ChromaDB, dùng Ollama để sinh câu trả lời và chuyển hội thoại cho nhân viên khi context không đủ tin cậy hoặc khách chủ động yêu cầu.

## Luồng cốt lõi hiện đã có

1. **Nạp tri thức:** Admin tải PDF, TXT, DOCX hoặc nhập text. Backend chia đoạn 1.000 ký tự, overlap 200, tạo embedding `all-MiniLM-L6-v2` và lưu vào collection Chroma riêng của workspace.
2. **Hỏi đáp RAG:** Widget gửi câu hỏi bằng SSE. Backend lấy Top-K chunk, lọc theo `RAG_MAX_DISTANCE`, chặn một số mẫu prompt injection và bổ sung tối đa 10 tin nhắn gần nhất.
3. **Trích dẫn:** Câu trả lời trả kèm filename, chunk, page và preview khi metadata có sẵn.
4. **Human Handoff:** Session chuyển qua `waiting_human`, Agent nhận trong Omnibox, trả lời và resolve. Redis hỗ trợ lock/PubSub khi chạy nhiều instance.
5. **Quản trị:** Dashboard quản lý workspace, thành viên, Knowledge Base, Bot Config, hội thoại, thống kê và tài khoản.

## Nguyên tắc sản phẩm

- **Tách biệt theo workspace:** SQL authorization và Chroma collection riêng.
- **Không giả định AI luôn đúng:** Context kém tin cậy sẽ chuyển sang người thay vì gọi Ollama.
- **LLM local trước:** Code hiện chỉ hỗ trợ provider Ollama, tránh chi phí OpenAI/Gemini trong giai đoạn dự án.
- **Khả năng tiếp quản:** Agent luôn đọc được lịch sử đã lưu trước khi phản hồi.

## Phạm vi chưa hoàn tất

- Chưa có Web Push nền bằng Service Worker/VAPID.
- Chưa gửi email invitation tự động; dashboard tạo link mời để sao chép.
- Avatar widget mới nhận URL, chưa upload file.
- Chưa có hàng đợi ingestion nền; upload vẫn xử lý trong HTTP request.
- Chroma local cần thiết kế lại persistent/shared storage trước khi scale nhiều backend instance.
- Google SSO chỉ hoạt động khi có credentials và callback domain hợp lệ.

Trạng thái chi tiết nằm tại [12_Implementation_Status.md](12_Implementation_Status.md).
