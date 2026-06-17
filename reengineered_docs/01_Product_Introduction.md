# 1. GIỚI THIỆU TỔNG QUAN SẢN PHẨM (PRODUCT INTRODUCTION)

## NovaChat AI là gì?
**NovaChat AI** là một nền tảng phần mềm dạng dịch vụ (SaaS) cung cấp giải pháp tự động hóa Chăm sóc Khách hàng (CSKH) dành riêng cho các doanh nghiệp vừa và nhỏ (SME). 

Thay vì sử dụng các hệ thống Chatbot kịch bản (Rule-based) cứng nhắc hay những mô hình AI dùng chung hay "bịa chuyện" (Hallucination), NovaChat AI kết hợp sức mạnh của **RAG** (Retrieval-Augmented Generation) và cơ chế **Human-in-the-loop** (Có sự can thiệp của con người) để tạo ra một luồng hỗ trợ không tì vết.

## Cơ chế Hoạt động Cốt lõi
Hệ thống vận hành xoay quanh 3 bước cực kỳ đơn giản:
1. **Nạp tri thức siêu tốc (Zero-Training):** Doanh nghiệp chỉ cần tải lên các tài liệu sẵn có (File PDF, Word chứa Chính sách, Bảng giá, Cẩm nang sản phẩm). Hệ thống sẽ tự động bóc tách và "dạy" cho AI học thuộc các tài liệu này trong vòng vài phút.
2. **Tự động hóa 80% (AI Copilot):** Khi khách hàng nhắn tin trên website, AI sẽ đối chiếu câu hỏi với kho tài liệu vừa nạp và trả lời ngay lập tức (Real-time Streaming) một cách tự nhiên và chính xác tuyệt đối.
3. **Tiếp quản mượt mà 20% (Frictionless Handoff):** Khi gặp tình huống ngoài tài liệu hoặc khách hàng có thái độ giận dữ, AI sẽ lập tức lùi lại và đánh chuông cảnh báo. Nhân viên thật (Agent) có thể nhảy vào đoạn chat ngay lập tức với toàn bộ ngữ cảnh (lịch sử chat) đã được lưu lại, giúp giải quyết vấn đề mà khách hàng không phải nhắc lại câu chuyện.

## Tại sao lại là NovaChat AI?
* **Tốc độ triển khai (Time-to-market):** Không cần lập trình, không cần vẽ sơ đồ tư duy phức tạp. Triển khai lên website khách hàng chỉ trong 5 phút.
* **Bảo mật dữ liệu tuyệt đối (Data Sovereignty):** Tri thức của doanh nghiệp nào chỉ phục vụ cho doanh nghiệp đó nhờ cơ chế phân tách Vector Database theo từng Workspace.
* **Trải nghiệm khách hàng tối đa:** Xóa bỏ hoàn toàn sự ức chế khi phải nói chuyện với những con bot "không hiểu ý người".

Tài liệu này đóng vai trò là "Bản đồ chỉ nam" (Blueprint) cho toàn bộ quá trình phát triển sản phẩm, từ việc định hình tầm nhìn, thiết kế chân dung khách hàng cho đến xây dựng kiến trúc phần mềm cấp doanh nghiệp. Mời bạn đọc tiếp các phần sau để đi sâu vào chi tiết kỹ thuật và nghiệp vụ của NovaChat AI.
