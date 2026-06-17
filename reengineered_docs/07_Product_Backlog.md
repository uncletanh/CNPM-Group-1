# 7. PRODUCT BACKLOG (TRÌNH TỰ TỐI ƯU HÓA ĐỂ THỰC THI)

Backlog này được sắp xếp lại dựa trên nguyên lý Product Management chuẩn: Bắt đầu từ Kiến trúc lõi -> Xây Não AI -> Làm UX cho Khách hàng -> Làm UX cho Admin/Agent.

| Giai đoạn (Phase) | Epic | Tên Tính năng (Feature) | Độ Ưu tiên (MoSCoW) | Độ Khó | Phụ thuộc (Dependencies) |
|---|---|---|---|---|---|
| **Phase 1: Nền móng** | System & Auth | Kiến trúc Đa chủ (Multi-Tenant Workspace ID) | Must Have | Trung bình | Không |
| | System & Auth | Đăng nhập Admin/Agent bằng Google SSO | Must Have | Thấp | Nền móng DB |
| **Phase 2: Bộ Não AI** | Knowledge Base | Kéo-thả Upload & Phân rã PDF/TXT | Must Have | Cao | Nền móng DB |
| | Knowledge Base | Luồng Vector Embedding & ChromaDB | Must Have | Cao | Tính năng Upload PDF |
| | Bot Config | Form Cấu hình System Prompt (Lan can bảo vệ) | Must Have | Thấp | Chạy xong Vector DB |
| **Phase 3: Gương Mặt** | Widget | Sinh API Endpoint truy vấn LLM (LangChain + RAG) | Must Have | Cao | Xong Phase 2 |
| | Widget | Giao diện Chat Streaming qua WebSocket/SSE | Must Have | Cao | API LLM |
| | Widget | Lưu trữ Session rớt mạng (LocalStorage) | Should Have | Thấp | Widget UI |
| **Phase 4: Lưới An Toàn** | Omnibox | Giao diện Dashboard quản lý danh sách Chat thời gian thực | Must Have | Trung bình | Xong Phase 3 |
| | Omnibox | Logic Ngắt Bot Cướp Cờ (Human Takeover Lock) | Must Have | Cao | Dashboard |
| | Omnibox | Báo thức Âm thanh / Push Notification cho Trình duyệt | Should Have | Trung bình | Dashboard |
| **Phase 5: Đánh Bóng** | Bot Config | Customizer (Đổi màu, đổi Avatar) & Sinh Mã nhúng (Embed Code) | Could Have | Thấp | Xong Phase 3 |
