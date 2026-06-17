# 8. RỦI RO, KHUYẾN NGHỊ & KẾT LUẬN CHIẾN LƯỢC

## RỦI RO & KHUYẾN NGHỊ

### Risk 1: Hội chứng "Agent Lười Biếng" (The Lazy Agent Problem)
Nếu hệ thống Notification bị lỗi, hoặc Agent bỏ đi uống cafe, các đoạn chat được khách hàng ấn nút "Gặp nhân viên" sẽ kẹt dưới địa ngục (purgatory) mãi mãi. Không có AI trả lời, cũng không có người trả lời.
* **Khuyến nghị (Recommendation):** Bắt buộc phải code thêm cơ chế **Auto-Responder dự phòng (Fallback)**. Nếu một yêu cầu Takeover không được Agent nào bấm nhận trong vòng 60 giây, AI phải tự động nhắn lại: *"Hiện tại các nhân viên đều đang bận. Anh/chị vui lòng để lại Số điện thoại/Email, tụi em sẽ liên hệ ngay khi có thể ạ."*

### Risk 2: Thảm họa Phình to Chi phí Token
Một file PDF nặng 10MB khi băm nhỏ sẽ tạo ra hàng chục ngàn vector. Nếu lúc query, hệ thống ngây thơ bê tất cả các chunk đó nhồi vào Context Window của LLM (ChatGPT/Gemini), công ty startup sẽ phá sản vì tiền API.
* **Khuyến nghị (Recommendation):** Bắt buộc phải áp dụng quy luật **Top-K Retrieval** cứng trong ChromaDB (ví dụ: Chỉ lấy đúng 3 đoạn văn bản có điểm Similarity cao nhất ném cho LLM). Giới hạn độ dài Context Window luôn ở mức < 1000 tokens cho mỗi câu hỏi.

### Risk 3: AI Ảo giác (Hallucination) ở các câu hỏi Ngoài vùng phủ sóng
Nếu khách hàng troll bot bằng cách hỏi "Thủ đô của nước Pháp là gì?", AI có thể nhiệt tình trả lời Paris, làm mất hình tượng bot CSKH chuyên nghiệp và tốn tiền API vô ích.
* **Khuyến nghị (Recommendation):** System Prompt phải cứng như đá: *"Ngươi là nhân viên CSKH của công ty X. Ngươi CHỈ ĐƯỢC PHÉP trả lời dựa vào context ta cung cấp. Nếu câu hỏi không nằm trong context, HÃY TRẢ LỜI ĐÚNG MỘT CÂU: Dạ em chỉ hỗ trợ các câu hỏi liên quan đến dịch vụ của công ty mình thôi ạ."*

---

## 9. KẾT LUẬN CHIẾN LƯỢC (FINAL STRATEGIC VERDICT)

Mô hình kinh doanh của NovaChat AI có tính khả thi cực kỳ cao và ra mắt đúng thời điểm (Perfectly timed) để khai thác thị trường SME. Tuy nhiên, tài liệu nguyên bản ban đầu vấp phải một sai lầm lớn là coi nhẹ **UX Độ trễ (Latency UX)** và **Kiểm soát Trạng thái Lỗi (Failure states)**.

Bằng cách bẻ lái kiến trúc để **bắt buộc dùng Streaming Response (chữ chạy ra từ từ)**, thiết lập **Lan can an toàn (RAG Guardrails) khắt khe**, và cấu trúc lại Backlog ưu tiên làm "Bộ Não" (Phase 2) trước khi làm "Lưới An Toàn" (Phase 4), sản phẩm hoàn toàn có thể hoàn thiện một bản MVP xuất sắc trong giới hạn thời gian cực gắt (6 tuần) mà vẫn giữ được độ ổn định tiêu chuẩn Doanh nghiệp (Enterprise-grade).

Bản Re-engineered PRD này đã nâng tầm dự án từ một "đồ án sinh viên" trở thành một **Nền tảng SaaS đủ sức để gọi vốn từ các Quỹ đầu tư mạo hiểm (Venture-backable).**
