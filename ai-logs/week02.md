# AI Log — Tuần 2: Phân tích sản phẩm & Ý tưởng

- **Giai đoạn:** Product Discovery (≈ 27/05 – 03/06/2026)
- **Mốc thực tế trong repo:** `Tai_Lieu_Product_Discovery_NovaChat_AI_v2`, `docs: split product discovery document into separate files`
- **Người phụ trách chính:** Nguyễn Tiến Anh (Lead) + cả nhóm

## Mục tiêu
Phân tích sản phẩm và người dùng trước khi viết code, xác định vấn đề và phạm vi MVP.

## Công cụ AI đã dùng
- **Claude Code** (Product Analyst mode) để phân tích bài toán CSKH và đề xuất MVP.
- **Gemini CLI** để đối chiếu (cross-check) phần phân tích persona.

## Prompt tiêu biểu
```
Đóng vai Product Analyst. Chúng tôi muốn xây một chatbot AI cho CSKH của doanh nghiệp SME.
Hãy phân tích và đề xuất:
1. Người dùng mục tiêu (persona)
2. Pain points của việc CSKH thủ công hiện nay
3. Phạm vi MVP tối giản
4. 5 tính năng cốt lõi
5. 1 tính năng AI có giá trị nhất
6. Những gì NÊN loại khỏi scope
7. Rủi ro cho nhóm sinh viên
```

## AI agent đã làm gì
- Sinh bộ tài liệu Product Discovery, sau đó nhóm tách thành các file nhỏ trong `reengineered_docs/`:
  - `01_Product_Introduction.md`, `02_Product_Vision.md`, `03_Personas.md`,
    `04_User_Scenarios.md`, `05_Product_Features.md`, `08_Risks_Recommendations.md`.
- Xác định 3 persona: **Admin doanh nghiệp**, **Nhân viên CSKH (Agent)**, **Khách hàng cuối**.

## Con người kiểm tra / quyết định
- Nhóm chốt tính năng AI cốt lõi = **RAG chatbot trả lời dựa trên tài liệu doanh nghiệp** + **Human takeover** khi bot không chắc chắn.
- Loại khỏi MVP: đa ngôn ngữ, voice bot, analytics nâng cao.

## Lỗi / giới hạn của AI gặp trong tuần
- AI có xu hướng "vẽ" thêm tính năng ngoài scope (CRM, ticketing). → Nhóm cắt bớt, giữ MVP gọn.

## Bài nộp
- `reengineered_docs/01..05, 08` (Product Analysis + Feature Proposal)
- `ai-logs/week-02.md`
