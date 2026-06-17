# 9. HÀNH TRÌNH NGƯỜI DÙNG (USER JOURNEYS) - NOVACHAT AI

Tài liệu này ánh xạ chi tiết cảm xúc, động lực và các điểm chạm của 3 tệp người dùng cốt lõi, từ đó khám phá ra các cơ hội tối ưu hóa (UX/Product Recommendations) cho NovaChat AI.

---

## PHẦN 1: USER JOURNEY - PERSONA 1 (DAVID TRẦN - FOUNDER/ADMIN)

### Giai đoạn 1: Nhận thức (Awareness)
* **User Goal:** Tìm giải pháp giảm tải CSKH lặp lại mà không tốn tiền thuê thêm nhân sự.
* **Actions:** Đọc review một khách hàng chê shop rep chậm 12 tiếng. Lên Google tìm kiếm "Chatbot AI cho website bán hàng", thấy quảng cáo của NovaChat AI.
* **Thoughts:** "Mấy con bot cũ dở ẹc, toàn bắt vẽ lưu đồ phức tạp. Con AI này quảng cáo 'chỉ cần nạp PDF', không biết có thật không hay lại chém gió?"
* **Emotions:** Tiêu cực (Negative) vì bị khách chê -> Trung tính (Neutral) khi tìm giải pháp.
* **Pain Points:** Khủng hoảng thời gian; cực kỳ lười cấu hình phần mềm phức tạp.
* **Product Touchpoints:** Landing Page, Google Ads.
* **Opportunities:** Trên Landing Page, cung cấp ngay một "Bản dùng thử Live" (Test Bot) được mớm sẵn một file PDF ngẫu nhiên để David thử chọc phá con bot trước khi đăng ký.

### Giai đoạn 2: Onboarding & First Use
* **User Goal:** Đưa bot lên website hoạt động nhanh nhất có thể.
* **Actions:** Đăng nhập bằng Google SSO -> Kéo thả file `Chinh_sach_doi_tra.pdf` -> Lấy đoạn mã Script dán vào website Shopify.
* **Thoughts:** "Đăng nhập lẹ đấy. Kéo file vào xong rồi làm gì nữa? Chờ tí, sao nó tự tạo ra mã nhúng luôn rồi? Nhanh vậy?"
* **Emotions:** Tích cực (Positive) vì giao diện Onboarding không có chữ code nào.
* **Pain Points:** Lo ân không biết Bot đã học xong file chưa (trạng thái chờ của Vector DB).
* **Product Touchpoints:** Web App Dashboard (Màn hình Knowledge Base), Shopify Admin.
* **Opportunities:** Thêm hiệu ứng "Xử lý trí tuệ nhân tạo..." với progress bar chạy từ 0-100% để tạo cảm giác an tâm. Có nút "Test Bot của bạn" ngay bên cạnh mã nhúng để David chat thử trước khi dán lên web.

### Giai đoạn 3: Hình thành thói quen (Habit Formation & Core Usage)
* **User Goal:** Kiểm soát chất lượng trả lời của Bot.
* **Actions:** Sáng mở mắt ra, David vào Dashboard xem mục "Nhật ký hội thoại" (Chat Logs) để xem đêm qua bot nói gì với khách.
* **Thoughts:** "May quá, đêm qua có 5 khách hỏi size áo, nó đều lấy đúng thông tin trong bảng size ra trả lời."
* **Emotions:** Rất Tích cực (Very Positive). Sự an tâm thay thế cho nỗi lo sợ Hallucination.
* **Pain Points:** David thấy bot trả lời sai một câu vì trong file PDF anh ghi thiếu. Anh không biết làm sao để sửa ngay lập tức mà không phải up lại cả file.
* **Product Touchpoints:** Admin Dashboard (Màn hình Analytics/Logs).
* **Opportunities:** Tạo tính năng "Sửa nhanh" (Quick Fix / Raw Text Editor) để ghi đè luật (System Prompt) ngay trên màn hình Log.

---

## PHẦN 2: USER JOURNEY - PERSONA 2 (SARAH NGUYỄN - CS LEAD / AGENT)

### Giai đoạn 1: Tiếp nhận (First Use)
* **User Goal:** Hiểu cách hệ thống mới vận hành mà không làm đứt gãy luồng công việc cũ.
* **Actions:** Sếp (David) gửi link mời vào Workspace. Sarah đăng nhập và mở tab Omnibox.
* **Thoughts:** "Lại thêm một cái tool nữa phải mở à? Cái màn hình này trông lạ quá, danh sách ticket nằm đâu?"
* **Emotions:** Trung lập (Neutral), hơi mang tính phòng thủ (Defensive).
* **Pain Points:** Kháng cự sự thay đổi (Change resistance). Sợ lỡ tin nhắn của khách.
* **Product Touchpoints:** Email Invitation, Agent Omnibox.
* **Opportunities:** Thiết kế Omnibox lấy cảm hứng UI từ các tool quen thuộc (Facebook Page Inbox / Zendesk) để giảm thời gian học (learning curve). 

### Giai đoạn 2: Xử lý Khủng hoảng (Core Usage)
* **User Goal:** Can thiệp kịp thời một khách hàng đang điên tiết.
* **Actions:** Nghe tiếng "Bíp" và thấy Push notification. Sarah click vào, đọc lướt 3 dòng tin nhắn cũ của khách với Bot, bấm nút "Tiếp nhận" (Takeover), và lập tức gõ phím phản hồi.
* **Thoughts:** "À, thì ra ông này bị giao nhầm size. Bot nó bị ngọng rồi không biết giải quyết. May mà mình đọc được lịch sử trước."
* **Emotions:** Tích cực (Positive) vì cảm giác mình nắm quyền kiểm soát tuyệt đối (God mode).
* **Pain Points:** Nếu mạng lag, lúc bấm "Tiếp nhận" bị khựng lại, hoặc gõ tin nhắn xong không thấy nút Send hoạt động.
* **Product Touchpoints:** Browser Notification, Omnibox Chat Window.
* **Opportunities:** Thêm template câu trả lời nhanh (Canned Responses) vào ngay thanh chat để Sarah xoa dịu khách trong 1 giây ("Dạ em là nhân viên thật đây ạ, em đã nắm được vấn đề...").

---

## PHẦN 3: USER JOURNEY - PERSONA 3 (MICHAEL LÊ - CUSTOMER)

### Giai đoạn 1: Tương tác Ban đầu (Awareness)
* **User Goal:** Tìm thông tin về chính sách bảo hành trước khi ra quyết định mua cái tủ lạnh.
* **Actions:** Lướt website, không thấy thông tin ở trang chủ. Bấm vào icon Chat màu xanh nhấp nháy ở góc phải.
* **Thoughts:** "Chắc lại hỏi số điện thoại để bắt sale gọi lại chứ gì. Để hỏi thử xem nó có biết gì không."
* **Emotions:** Tiêu cực (Negative), có sẵn định kiến với bot.
* **Pain Points:** Phải điền Form thu thập thông tin (Lead gen) trước khi được chat.
* **Product Touchpoints:** Website Widget (Welcome Message).
* **Opportunities:** BỎ QUA việc đòi Email/SĐT ở màn chào hỏi. Cho phép khách hàng chat ngay lập tức (Guest mode) để kéo họ vào phễu tương tác.

### Giai đoạn 2: Trải nghiệm Giá trị Cốt lõi (Core Usage)
* **User Goal:** Nhận câu trả lời chính xác, ngay lập tức.
* **Actions:** Gõ: "Tủ lạnh mua về bị kêu to thì có đổi được trong 30 ngày không?". Nhấn Enter.
* **Thoughts:** "Xem nó mất bao lâu để xin lỗi."
* **Emotions:** Bất ngờ chuyển sang Rất Tích cực (Very Positive).
* **Pain Points:** Độ trễ (Latency). Nếu bot xoay vòng vòng 5 giây, Michael sẽ tắt tab.
* **Product Touchpoints:** Widget Chat UI (Streaming / Typing Indicator).
* **Opportunities:** Hiển thị chữ chạy ra từ từ ngay lập tức (Streaming). Bổ sung nguồn trích dẫn (Source citation) nhỏ bên dưới: *"Theo Chính sách đổi trả trang 2"*, giúp tăng độ tin cậy tuyệt đối.

### Giai đoạn 3: Bế tắc và Chuyển giao (Edge Case / Handoff)
* **User Goal:** Hỏi một câu cực kỳ đặc thù không có trên web.
* **Actions:** Gõ: "Tôi ở chung cư tầng 25 không có thang máy chở hàng, bên bạn có bê lên tận nơi không?". Bot trả lời: "Tôi không có thông tin này, bạn có muốn gặp nhân viên?". Michael bấm "Gặp nhân viên".
* **Thoughts:** "Đấy biết ngay mà, rốt cục cũng phải gặp người."
* **Emotions:** Hơi tụt cảm xúc (Frustrated) -> An tâm (Relieved) khi có người chat lại ngay.
* **Pain Points:** Bấm "Gặp nhân viên" xong chờ 5 phút không ai rep.
* **Product Touchpoints:** Widget (Handoff Button).
* **Opportunities:** Nếu trong vòng 30s không có Agent nhận, hệ thống phải tự động bắn tin nhắn: *"Hiện tại các nhân viên đang bận xử lý, bạn vui lòng để lại SĐT để tụi mình gọi lại trong 5 phút nhé."*

---

## PHẦN 4: END-TO-END USER JOURNEY MAP (MICHAEL LÊ - CUSTOMER)

| Stage | Goal | Actions | Thoughts | Emotions | Pain Points | Opportunities |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Awareness** | Tìm chính sách | Mở chat Widget | "Chắc lại bot ngốc" | Trung lập | Bắt nhập Email mới cho chat | Bỏ form Lead-gen, cho chat ngay lập tức. |
| **First Use** | Lấy thông tin | Đặt câu hỏi khó | "Chờ xem nó trả lời sao" | Trung lập | Bot delay 5 giây | Dùng Streaming (SSE) trả từng chữ ngay tắp lự. |
| **Core Value** | Xác thực | Đọc câu trả lời | "Ồ, nó biết chính sách đổi trả" | Tích cực | Trả lời sai sự thật (Hallucination) | Ràng buộc RAG cực ngặt, thêm trích dẫn nguồn. |
| **Edge Case** | Xử lý ca khó | Hỏi tình huống ngoại lệ -> Bấm "Gặp nhân viên" | "Cuối cùng cũng phải gặp người" | Tiêu cực nhẹ | Bấm xong không có Agent nào online | Auto-Responder xin lỗi nếu sau 60s không ai nhận. |
| **Resolution** | Chốt mua hàng | Agent nhảy vào chốt sale -> Mua hàng | "Nhân viên xử lý lẹ thật, không bắt mình kể lại" | Rất Tích cực | Gãy kết nối WebSocket | Lưu LocalStorage để F5 vẫn không mất chat. |

---

## PHẦN 5: NHỮNG KHOẢNH KHẮC SỰ THẬT (MOMENTS OF TRUTH)

Trong vòng đời sử dụng NovaChat AI, có 3 "Khoảnh khắc Sự thật" quyết định sinh tử của sản phẩm:

1. **Khoảnh khắc "Khởi động" (The TTFV Moment - Founder):** 
   - *Khi nào:* Khi Founder upload file PDF và thấy con Bot hiện chữ "Sẵn sàng" chỉ sau 30 giây.
   - *Tầm quan trọng:* Phá vỡ định kiến "Làm AI rất khó và mất thời gian". Khoảnh khắc này chốt hạ quyết định trả tiền (Subscription) của họ.
2. **Khoảnh khắc "Chữ chạy" (The Streaming Moment - Customer):**
   - *Khi nào:* Khi khách hàng gõ xong câu hỏi, và ngay lập tức thấy ký tự đầu tiên của câu trả lời nảy ra trên màn hình (độ trễ < 500ms).
   - *Tầm quan trọng:* Quyết định khách hàng có nán lại website hay không. Nếu màn hình đóng băng 5 giây để đợi LLM load cả cục, họ sẽ thoát trang.
3. **Khoảnh khắc "Tiếp quản Thần tốc" (The Seamless Takeover - Agent & Customer):**
   - *Khi nào:* Khi khách vừa phàn nàn, Agent đọc được toàn bộ ngữ cảnh và xoa dịu khách chỉ trong 10 giây mà không cần hỏi lại sự tình.
   - *Tầm quan trọng:* Thể hiện sức mạnh cốt lõi "Human-in-the-loop". Nó chứng minh với doanh nghiệp rằng NovaChat không chỉ tiết kiệm tiền, mà còn cứu vớt những giao dịch trị giá cao.

---

## PHẦN 6: PHÂN TÍCH HÀNH TRÌNH (JOURNEY ANALYSIS)

### Điểm mạnh (Strengths)
Hành trình từ lúc Admin nạp file đến lúc Bot chat là một đường thẳng (Zero-friction onboarding). Không có các bước rẽ nhánh rườm rà. Tính năng bảo vệ ngữ cảnh (Context preservation) lúc Handoff là vũ khí tuyệt đối của hành trình này.

### Điểm yếu (Weaknesses)
Phụ thuộc quá lớn vào độ ổn định của LLM (API OpenAI/Gemini) và kết nối WebSocket ở phía Client. Mọi gián đoạn mạng đều làm gãy hành trình của Customer.

### Điểm ma sát (Friction Points)
* Đối với Admin: Việc phát hiện Bot trả lời sai (do file PDF nhiễu) đòi hỏi họ phải sửa lại toàn bộ file PDF rồi up lại. Cực kỳ mất thời gian.
* Đối với Agent: Việc lúc nào cũng phải mở sẵn một Tab Omnibox là một điểm ma sát. Nếu họ lỡ tắt tab, họ sẽ mất tín hiệu SOS của khách.

### Rủi ro Giữ chân (Retention Risks)
Nếu Bot không trả lời được 60% câu hỏi (Deflection rate < 60%), Agent sẽ liên tục nghe tiếng "Bíp" báo hiệu Handoff. Họ sẽ cảm thấy công cụ này vô dụng và kiến nghị Founder cắt hợp đồng.

### UX & Product Recommendations
1. **Desktop App / Browser Extension cho Agent:** Đừng bắt Agent mở một tab web chết. Hãy làm một Chrome Extension hoặc PWA App để nhận Push Notification ngay cả khi trình duyệt đóng.
2. **Knowledge Base Editor (Quick Edit):** Cho phép Founder trực tiếp "sửa lỗi" bot bằng một khung Text thuần túy ngay trên màn hình Chat Log, thay vì bắt upload lại PDF.
3. **Graceful Degradation:** Nếu WebSocket sập, hệ thống phải tự động lùi về phương thức Polling (API Request truyền thống) để đảm bảo tin nhắn vẫn được gửi đi, dù chậm hơn một chút.

---

## PHẦN 7: ĐỐI CHIẾU CHIẾN LƯỢC (STRATEGIC ALIGNMENT)

Toàn bộ các Hành trình trên đều phản ánh chính xác **Tầm nhìn Sản phẩm (Product Vision)**:
* Việc Admin chỉ cần kéo thả PDF (Journey 1) bảo vệ triết lý *"Cắm-và-chạy (Zero-Training RAG)"*.
* Việc Agent có toàn bộ ngữ cảnh (Journey 2) và Khách hàng không bị ngắt kết nối (Journey 3) bảo vệ triết lý *"Chuyển giao không ma sát (Frictionless Handoff)"*.

**Báo cáo mâu thuẫn (Inconsistencies Flagged):** 
Ban đầu trong Backlog (MVP) không hề đề cập đến "Auto-Responder khi Agent offline". Nhưng thông qua User Journey 3, nếu Agent bận không kịp nhận Takeover, khách hàng sẽ rơi vào trạng thái chờ vô vọng (Limbo). 
-> **Quyết định Chiến lược:** Phải lập tức đẩy tính năng **"Fallback Auto-Responder sau 60s"** vào danh sách **Must Have** của Phase 4 (Omnibox) trong Product Backlog để vá lỗ hổng luồng trải nghiệm này.
