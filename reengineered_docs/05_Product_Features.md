# 5. TÍNH NĂNG SẢN PHẨM (PRODUCT FEATURES)

## Feature 1: Động Cơ Hấp Thụ Tri Thức (Semantic Document Ingestion Engine)
* **Vấn đề giải quyết:** Huấn luyện bot theo kịch bản truyền thống mất hàng tuần để cắm cúi nhập data.
* **Mô tả:** Giao diện kéo-thả chấp nhận file PDF, DOCX, TXT (tối đa 10MB). Backend sử dụng thư viện xử lý tài liệu để bóc tách chữ, băm nhỏ (chunking) và nhúng (embed) vào Vector Database.
* **Lợi ích User:** Huấn luyện bot theo triết lý "Upload and Done" (Tải lên là xong).
* **Lợi ích Doanh nghiệp:** Lợi thế cạnh tranh tuyệt đối về Tốc độ Onboarding khách hàng.
* **Độ phức tạp:** Cao (Cần LangChain/LlamaIndex, chiến lược Chunking chuẩn, ChromaDB).
* **Ưu tiên:** MVP.
* **Rủi ro:** Cắt đoạn (chunking) ngu ngốc dẫn đến AI không hiểu ngữ cảnh nối giữa 2 trang tài liệu.

## Feature 2: Widget Chat Streaming Thời Gian Thực (Streaming Chat Widget)
* **Vấn đề giải quyết:** Khách hàng bỏ đi mất nếu phải nhìn màn hình trắng xóa 5 giây trong lúc chờ LLM suy nghĩ.
* **Mô tả:** Khung chat nhúng vào web dùng WebSocket/SSE để stream (đổ) câu trả lời của AI ra màn hình từng chữ một (y hệt trải nghiệm ChatGPT).
* **Lợi ích User:** Cảm giác mượt mà, phản hồi tức thời.
* **Lợi ích Doanh nghiệp:** Tăng mức độ tương tác và hài lòng (CSAT).
* **Độ phức tạp:** Trung bình (Quản lý kết nối WebSocket, xử lý rớt mạng).
* **Ưu tiên:** MVP.
* **Rủi ro:** Sập server WebSocket nếu số lượng người truy cập website cùng lúc quá đông.

## Feature 3: Omnibox & Takeover Theo Ngữ Cảnh (Agent Omnibox)
* **Vấn đề giải quyết:** Agent tốn quá nhiều thời gian để hỏi lại khách hàng xem họ bị làm sao.
* **Mô tả:** Một Dashboard tổng lực dành cho Agent để xem toàn bộ phiên chat đang active. Có nút "Takeover" (Tiếp nhận) để Khóa cứng luồng AI và mở kết nối P2P (Người-Người).
* **Lợi ích User:** Agent có toàn bộ bối cảnh trước khi gõ chữ đầu tiên.
* **Lợi ích Doanh nghiệp:** Giảm sâu chỉ số Thời gian xử lý trung bình (AHT - Average Handling Time).
* **Độ phức tạp:** Cao (Quản lý State, khóa tranh chấp đồng thời, Push Notifications).
* **Ưu tiên:** MVP.
* **Rủi ro:** Tranh chấp (Race condition) nếu 2 Agent cùng click Takeover một lúc.

## Feature 4: Lan Can Bảo Vệ RAG (Strict RAG Guardrails)
* **Vấn đề giải quyết:** AI bị ảo giác (hallucination) tự sáng tác ra chính sách khuyến mãi ảo hoặc lôi đối thủ vào chat.
* **Mô tả:** Lớp bảo vệ ở Backend dùng System Prompting để thiết lập ranh giới hành vi cho LLM. Kèm theo cơ chế Ngưỡng tương đồng (Similarity Threshold): Nếu search Vector DB không ra kết quả nào khớp, bỏ qua LLM và đẩy thẳng sang kịch bản Human Handoff.
* **Lợi ích User:** Tin tưởng giao thương hiệu cho bot mà không sợ "vạ miệng".
* **Lợi ích Doanh nghiệp:** An toàn Pháp lý và Truyền thông.
* **Độ phức tạp:** Trung bình.
* **Ưu tiên:** MVP.
* **Rủi ro:** Prompt quá chặt = Bot hơi tí là nói "Tôi không biết". Prompt quá lỏng = Bịa chuyện.
