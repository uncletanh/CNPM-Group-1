# 6. CÂU CHUYỆN NGƯỜI DÙNG (USER STORIES)

### Epic: Nạp Tri Thức (Knowledge Ingestion)
* **As an** Admin, **I want** to upload my company's PDF documents, **So that** the AI can learn my policies without me typing them out manually.
  * **Acceptance Criteria (Tiêu chí Nghiệm thu):** 
    * Given (Cho trước): Admin cầm 1 file PDF nặng 5MB.
    * When (Khi): Admin kéo thả file vào vùng Upload.
    * Then (Thì): Hệ thống tự động tách text, băm nhỏ, nạp vào Vector DB và báo "Sẵn sàng" trong vòng tối đa 60 giây.
  * **Độ ưu tiên:** Must Have (Bắt buộc).
  * **Business Value:** Very High | **User Value:** Very High.

### Epic: Widget Thời gian thực (Real-Time Widget)
* **As a** Customer, **I want** to see the bot's answer typing out word-by-word, **So that** I know the system hasn't frozen while processing my complex question.
  * **Acceptance Criteria:**
    * Given: Khách hàng gõ và gửi 1 câu hỏi.
    * When: LLM backend bắt đầu suy nghĩ và sinh ra token đầu tiên.
    * Then: Chữ xuất hiện nối đuôi nhau ra màn hình chat ngay lập tức thông qua giao thức SSE/WebSocket thay vì chờ load cả cục.
  * **Độ ưu tiên:** Must Have.
  * **Business Value:** High | **User Value:** High.

### Epic: Hộp thư Agent (Agent Omnibox)
* **As an** Agent, **I want** to see the full chat history between the AI and the customer before I intervene, **So that** I don't frustrate the customer by asking them to repeat themselves.
  * **Acceptance Criteria:**
    * Given: Một phiên chat đang được bot xử lý hoặc đang yêu cầu hỗ trợ.
    * When: Agent click vào phiên chat đó trên bảng Omnibox.
    * Then: Toàn bộ lịch sử (bao gồm cả tin nhắn của Khách và tin nhắn của Bot) hiện ra đầy đủ theo trình tự thời gian.
  * **Độ ưu tiên:** Must Have.
  * **Business Value:** Very High | **User Value:** Very High.

* **As an** Agent, **I want** to receive a distinct audio/visual notification when a customer requests human help, **So that** I can respond immediately to high-priority issues.
  * **Acceptance Criteria:**
    * Given: Agent đang mở tab Omnibox chìm dưới nền (Background).
    * When: Khách hàng bấm nút "Talk to Human" ngoài website.
    * Then: Trình duyệt của Agent phát ra tiếng "Bíp" và hiển thị Push Notification ở góc phải màn hình máy tính.
  * **Độ ưu tiên:** Should Have (Tuyệt vời nếu có, nhưng MVP có thể tạm dùng cơ chế báo đỏ tĩnh nếu kỹ thuật chưa làm kịp Push Notification).
  * **Business Value:** High | **User Value:** Medium.
