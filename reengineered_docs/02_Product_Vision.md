# 2. Tầm nhìn sản phẩm

## Tuyên ngôn tầm nhìn

Giúp doanh nghiệp SME cung cấp hỗ trợ tức thời bằng AI dựa trên tri thức riêng, đồng thời giữ con người trong vòng kiểm soát cho các trường hợp AI không chắc chắn.

## Vấn đề

- Câu hỏi lặp lại chiếm thời gian của đội CSKH.
- Chatbot kịch bản dễ rơi vào ngõ cụt.
- LLM dùng chung có thể trả lời ngoài chính sách doanh nghiệp.
- Handoff thường làm mất lịch sử và buộc khách kể lại từ đầu.

## Giá trị đề xuất

NovaChat AI rút ngắn luồng từ tài liệu tới chatbot: Admin nạp tri thức, kiểm thử bot, tùy chỉnh widget và lấy mã nhúng; Customer hỏi đáp qua RAG; Agent tiếp quản cùng lịch sử khi cần.

Không sử dụng các con số “80% tự động hóa” như cam kết hiện tại vì repo chưa có dữ liệu production để chứng minh. Các chỉ số bên dưới là mục tiêu cần đo, không phải kết quả đã đạt.

## Thị trường mục tiêu

Doanh nghiệp 10–50 nhân sự trong E-commerce và dịch vụ, có website và nhiều câu hỏi lặp lại về giá, sản phẩm, bảo hành hoặc đổi trả.

## Điểm khác biệt

1. Knowledge Base riêng theo workspace.
2. Ollama local giúp kiểm soát chi phí và vị trí xử lý LLM.
3. Guardrails dựa trên retrieval threshold và handoff.
4. Widget streaming có source citation.
5. Omnibox kết hợp AI và Agent trong cùng session.

## Mục tiêu đo lường

- **Time to First Value:** từ tạo workspace tới câu trả lời RAG đầu tiên.
- **Deflection Rate:** session được AI xử lý mà không handoff.
- **Handoff Wait Time:** từ `waiting_human` tới Agent takeover.
- **Resolution Time:** từ takeover tới `resolved`.
- **Grounded Answer Rate:** tỷ lệ câu trả lời có context/citation đạt ngưỡng.
- **Retrieval Quality:** precision/recall theo bộ câu hỏi đánh giá nội bộ.

## Định hướng dài hạn, chưa có trong code

- Web Push/PWA cho Agent.
- Email invitation và quản trị vòng đời Agent đầy đủ.
- Kênh Messenger/Zalo/WhatsApp.
- Action/tool calling tới đơn hàng, vận chuyển và lịch hẹn.
- Ingestion worker, object storage và vector service dùng chung.
- Billing, quota và subscription.
