# 1. ĐÁNH GIÁ TỔNG QUAN SẢN PHẨM (EXECUTIVE PRODUCT ASSESSMENT)

Tài liệu này đánh giá hiện trạng dự án dưới góc nhìn của một Giám đốc Sản phẩm (Principal PM) và Nhà sáng lập Startup.

## Điểm mạnh (Strengths)
* **Tuyên ngôn Giá trị (UVP) rõ ràng:** Sự kết hợp giữa RAG (Nạp tri thức qua file) và Human Takeover (Tiếp quản bởi con người) là giải pháp hoàn hảo cho lĩnh vực CSKH B2B. Nó giải quyết được cả sự cứng nhắc của bot theo kịch bản và rủi ro "bịa chuyện" (hallucination) của LLM thuần túy.
* **Phạm vi (Scope) thực tế:** Việc loại bỏ tính năng Cào dữ liệu Website (URL Crawling) để tập trung vào upload tài liệu (PDF/Word) cho MVP chứng tỏ team hiểu rất rõ về kiểm soát chất lượng dữ liệu. "Rác đầu vào, Rác đầu ra" là kẻ thù lớn nhất của hệ thống RAG.

## Điểm yếu (Weaknesses)
* **Chân dung người dùng (Persona) mờ nhạt:** Các persona cũ ("Admin", "Agent", "End-User") quá chung chung. Chúng chỉ mô tả chức danh, không mô tả hành vi hay nỗi đau thực sự.
* **Thiếu Chỉ số Thành công (Success Metrics):** Tài liệu cũ liệt kê tính năng nhưng không định nghĩa cách đo lường thành công (ví dụ: Tỷ lệ tự động giải quyết - Deflection Rate, Thời gian xử lý).
* **Bỏ quên Kịch bản Lỗi (Failure Recovery):** Các kịch bản (Scenario) chỉ tính đến "đường màu hồng" (happy path). Không có định nghĩa rõ ràng về việc hệ thống sẽ làm gì khi LLM bị timeout, hoặc khi Agent không online để nhận Takeover.

## Cơ hội bị bỏ lỡ (Missing Opportunities)
* **Phân tích & Thấu hiểu (Analytics & Insights):** Doanh nghiệp SME không chỉ muốn tự động hóa chat; họ muốn biết *khách hàng đang hỏi gì*. Một Dashboard đơn giản hiển thị "Top Câu hỏi chưa được trả lời" sẽ mang lại giá trị giữ chân khách hàng (retention) cực lớn.
* **Tương tác Chủ động (Proactive Engagement):** Widget hiện tại hoàn toàn bị động. Chỉ cần một trigger đơn giản (VD: "Khách ở trang Bảng giá quá 30 giây -> Bật popup chat") có thể biến công cụ CSKH thành công cụ Chốt sale.

## Rủi ro tiềm ẩn (Hidden Risks)
* **Tranh chấp quyền (Race Conditions) ở Omnibox:** Nếu nhiều Agent cùng mở Omnibox, ai sẽ nhận được đoạn chat? Kiến trúc cần một cơ chế Lock (Khóa) nghiêm ngặt.
* **Trải nghiệm độ trễ LLM:** Mặc dù hứa hẹn "Real-time WebSocket", nhưng LLM thường mất 2-5 giây để sinh câu trả lời. Bắt buộc phải áp dụng Streaming (trả về từng chữ qua Server-Sent Events/WebSocket), chứ không chỉ dùng mỗi hiệu ứng "Đang gõ...".

## Khuyến nghị (Recommendations)
* Xoay trục thông điệp truyền thông từ "Công cụ Hỗ trợ Khách hàng" thuần túy sang "Công cụ Tự động hóa Sales & Support" để tăng giá trị cảm nhận đối với người mua (SME).
* Bắt buộc triển khai phản hồi dạng Streaming (trả từng chữ) ngay lập tức cho MVP; không đợi đến các bản cập nhật sau.
