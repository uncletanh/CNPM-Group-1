# 4. KỊCH BẢN NGƯỜI DÚNG (USER SCENARIOS)

## Scenario 1: Trải nghiệm "Zero-Day" Onboarding (Khách hàng lần đầu)
* **Bối cảnh:** David (Founder) đăng ký NovaChat để tự động hóa FAQ cho web bán hàng.
* **Mục tiêu:** Đưa bot lên web thành công mà không cần thuê Coder.
* **Hành động của User:**
  1. Đăng nhập 1 chạm bằng Google SSO.
  2. Kéo-thả file `FAQ_Cong_ty.docx` dài 5 trang vào hệ thống.
  3. Chọn màu chủ đạo của bot là Xanh dương cho hợp mệnh.
  4. Copy đoạn mã JavaScript sinh ra và dán vào thẻ `<body>` trên Shopify.
* **Phản hồi của Hệ thống:** Backend nuốt file DOCX, băm nhỏ (chunking) và nạp vào ChromaDB chỉ trong 30 giây. Trả ra mã nhúng chứa `workspace_id` duy nhất.
* **Nỗi đau được giải quyết:** Không cần biết code. Không cần vẽ sơ đồ khối rườm rà.
* **Giá trị Doanh nghiệp (Business Value):** Chạm tới TTFV (Time to First Value) dưới 5 phút, tối đa hóa tỷ lệ chốt sale (Activation rate) của phần mềm SaaS.

## Scenario 2: Cứu Vãn Khủng Hoảng (Critical Handoff)
* **Bối cảnh:** Khách hàng nhận được hàng vỡ, nhắn lên web với thái độ giận dữ: "Bán hàng như rác, trả tiền lại ngay!!!"
* **Mục tiêu:** Khách cần gặp con người có thẩm quyền xử lý ngay lập tức để xả giận.
* **Hành động của User:** Khách hàng bấm nút "Gặp nhân viên hỗ trợ" (nổi bật trên Widget).
* **Phản hồi của Hệ thống:** 
  1. Bot lập tức câm miệng (Ngừng sinh AI).
  2. Widget báo: "Đang kết nối với nhân viên..."
  3. Ở trang Omnibox, trình duyệt réo chuông ầm ĩ và bật Push Notification cho Sarah (Agent).
* **Hành động của Agent:** Sarah mở Omnibox, đọc được ngay câu chửi của khách, bấm nút **"Tiếp nhận"**, và gõ phản hồi: "Dạ em thành thật xin lỗi anh, em đang tạo lệnh hoàn tiền 100% cho anh ngay lúc này ạ."
* **Nỗi đau được giải quyết:** Ngăn chặn con AI trả lời ngu ngốc kiểu "Vui lòng xem chính sách đổi trả tại link sau" khiến khách hàng tức điên lên.
* **Giá trị Doanh nghiệp (Business Value):** Cứu vãn danh tiếng thương hiệu và ngăn chặn bóc phốt.

## Scenario 3: Cứu Rỗi Phiên Chat Bị Rớt (Session Persistence)
* **Bối cảnh:** Khách hàng đang chat với bot hỏi về giá sỉ. Đột nhiên lỡ tay vuốt thoát trình duyệt trên điện thoại để check tin nhắn Zalo.
* **Mục tiêu:** Trở lại cuộc hội thoại mà không phải hỏi lại từ đầu.
* **Hành động của User:** Mở lại trang web 10 phút sau, bấm vào icon Chat.
* **Phản hồi của Hệ thống:** Widget đọc LocalStorage của trình duyệt, bê nguyên xi lịch sử hội thoại 10 phút trước in ra màn hình. Khách tiếp tục chat.
* **Nỗi đau được giải quyết:** Xóa bỏ sự ức chế khi phải lặp lại câu hỏi.
* **Giá trị Doanh nghiệp (Business Value):** Giảm tỷ lệ thoát trang (Drop-off rate), tăng tỷ lệ chuyển đổi chốt đơn.
