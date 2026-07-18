# 1. Giới thiệu sản phẩm

Ngày cập nhật: **19/07/2026**.

## NovaChat AI là gì?

NovaChat AI là nền tảng chatbot RAG dành cho doanh nghiệp SME. Doanh nghiệp tạo workspace, nạp tài liệu riêng và nhúng widget vào website (dán 1 thẻ `<script>`, không cần chỉnh sửa gì thêm). AI tìm context trong tri thức đã nạp (embedding lưu trong Postgres), dùng Ollama/Groq/Gemini để sinh câu trả lời và chuyển hội thoại cho nhân viên khi context không đủ tin cậy hoặc khách chủ động yêu cầu. Có sẵn gói Freemium (giới hạn 50 tin/tháng) và License Key để nâng cấp PRO.

## Luồng cốt lõi hiện đã có

1. **Nạp tri thức:** Admin tải PDF, TXT, DOCX hoặc nhập text. Backend chia đoạn 600 ký tự, overlap 100, tạo Gemini embedding 768 chiều và lưu trực tiếp trong Postgres (bảng `knowledge_chunks`, cột JSON), có version riêng theo model embedding.
2. **Hỏi đáp RAG:** Widget gửi câu hỏi bằng SSE. Backend ghép lịch sử user vào retrieval query, kết hợp semantic search (similarity Python trên embedding Postgres) với BM25 local bằng RRF, lọc confidence/prompt injection và bổ sung tối đa 10 tin nhắn gần nhất vào prompt.
3. **Trích dẫn:** Câu trả lời trả kèm filename, chunk, page và preview khi metadata có sẵn.
4. **Human Handoff:** Session chuyển qua `waiting_human`, Agent nhận trong Omnibox, trả lời và resolve; hết giờ chờ mà không ai nhận thì tự quay về bot và báo khách. Redis hỗ trợ lock/PubSub khi chạy nhiều instance.
5. **Quản trị:** Dashboard quản lý workspace, thành viên (kể cả đổi role), Knowledge Base, Bot Config, hội thoại, thống kê, tài khoản và Admin Dashboard (License Key, plan, Staff) cho role toàn cục `ADMIN`.

## Nguyên tắc sản phẩm

- **Tách biệt theo workspace:** mọi truy vấn SQL và embedding đều lọc theo `workspace_id`.
- **Không giả định AI luôn đúng:** Context kém tin cậy sẽ chuyển sang người thay vì gọi LLM.
- **Local-first, cloud fallback:** Ollama là mặc định; Groq/Gemini giúp demo cloud khi có API key.
- **Khả năng tiếp quản:** Agent luôn đọc được lịch sử đã lưu trước khi phản hồi.
- **Dán vào là chạy, không cần chỉnh:** widget serve cùng origin dashboard, CSS tự nhúng vào JS —
  khách chỉ cần copy đúng 1 thẻ `<script>` từ trang cấu hình bot, không sửa gì thêm.

## Phạm vi chưa hoàn tất

- Chưa có Web Push nền bằng Service Worker/VAPID.
- Chưa gửi email invitation tự động; dashboard tạo link mời để sao chép.
- Avatar widget mới nhận URL, chưa upload file.
- Chưa có hàng đợi ingestion nền; upload vẫn xử lý trong HTTP request.
- Similarity trên Postgres tính bằng Python thuần, chưa có ANN index chuyên biệt — chấp nhận
  được ở quy mô KB một SME hiện tại.
- Google SSO chỉ hoạt động khi có credentials và callback domain hợp lệ.

Trạng thái chi tiết nằm tại [12_Implementation_Status.md](12_Implementation_Status.md).
