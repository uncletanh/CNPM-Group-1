# AI Log — Tuần 5: Architecture & AI Feature Design

- **Giai đoạn:** Thiết kế hệ thống (≈ 10/06 – 17/06/2026)
- **Mốc thực tế trong repo:** `docs: add re-engineered PRD, user journeys and software architecture` (17/06), `10_Software_Architecture.md`, `11_Task_Assignment.md`
- **Người phụ trách chính:** Nguyễn Tiến Anh (System Architect)

## Mục tiêu
Thiết kế kiến trúc hệ thống, database và vị trí của tính năng AI; xác định dữ liệu gửi vào AI và rủi ro privacy/hallucination.

## Công cụ AI đã dùng
- **Claude Code** (Architect mode) sinh tài liệu kiến trúc C4 + ADR.

## Prompt tiêu biểu
```
Đóng vai software architect cho nhóm sinh viên. Thiết kế kiến trúc đơn giản cho MVP
chatbot RAG multi-tenant + human handoff. Yêu cầu:
- Dùng FastAPI, PostgreSQL, ChromaDB, Redis
- Có sơ đồ C4 (Mermaid), data model, vị trí AI feature
- TRÁNH microservices và abstraction thừa
- Nêu rủi ro bảo mật, đặc biệt là cross-tenant data leak
```

## AI agent đã làm gì
- Sinh `10_Software_Architecture.md`: C4 model, chọn **Modular Monolith + event-driven**, chiến lược scale, ADR-001 (Redis Distributed Lock cho race condition khi handoff).
- Thiết kế data model: Workspace / User / ChatSession / Message / KnowledgeDocument; mỗi workspace = 1 collection ChromaDB riêng để cách ly dữ liệu.

## Thiết kế AI Feature (tóm tắt)
- **Input:** câu hỏi khách + top-K chunks truy hồi từ ChromaDB của đúng workspace + 10 tin nhắn gần nhất.
- **Output:** câu trả lời có trích dẫn nguồn (tên tài liệu, trang).
- **Human control:** nếu độ tin cậy thấp → gợi ý "Gặp nhân viên"; nhân viên có thể tiếp quản.
- **Rủi ro:** hallucination, lộ dữ liệu chéo giữa doanh nghiệp.
- **Giảm thiểu:** guardrail "không có trong context thì không bịa", filter metadata `workspace_id` bắt buộc.

## Con người kiểm tra / quyết định
- Lead **bác bỏ** đề xuất microservices của AI, chốt Modular Monolith kèm lý do bảo vệ (team 5 người, timeline ngắn).
- Chốt phân công theo Pair Programming trong `11_Task_Assignment.md`.

## Lỗi / giới hạn của AI gặp trong tuần
- AI đề xuất provider OpenAI/Gemini trong bản kiến trúc; nhóm quyết định đổi sang **Ollama local** ở khâu triển khai để không tốn chi phí và giữ dữ liệu on-prem (khác biệt này được đồng bộ lại ở tuần 9).

## Bài nộp
- `reengineered_docs/10_Software_Architecture.md`, `11_Task_Assignment.md`
- `AI_FEATURE_DESIGN.md`, `ai-logs/week-05.md`
