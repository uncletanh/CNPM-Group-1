# AI Log — Tuần 4: Requirements, Issues & Agent-ready Tasks

- **Giai đoạn:** Backlog & GitHub Issues (≈ 03/06 – 10/06/2026)
- **Mốc thực tế trong repo:** 22 GitHub Issues (#1 → #32), `reengineered_docs/06_User_Stories.md`, `07_Product_Backlog.md`
- **Người phụ trách chính:** Nguyễn Tiến Anh (Lead)

## Mục tiêu
Chuyển phân tích sản phẩm thành user stories và GitHub Issues đủ rõ để giao cho AI agent thực thi, mỗi issue có acceptance criteria.

## Công cụ AI đã dùng
- **Claude Code** (Requirements Engineer mode) sinh backlog theo format Given-When-Then.

## Prompt tiêu biểu
```
Dựa trên PRODUCT_ANALYSIS, tạo MVP backlog. Mỗi user story phải có:
- ID, vai trò người dùng, mục tiêu, lợi ích
- Acceptance criteria dạng Given-When-Then
- Độ ưu tiên, độ khó, có dùng AI hay không
Giữ story đủ nhỏ để sinh viên năm nhất làm được. Sau đó viết nội dung sẵn sàng
dán thành GitHub Issue cho từng story.
```

## AI agent đã làm gì
- Sinh `06_User_Stories.md` (8–12 user stories) và `07_Product_Backlog.md`.
- Sinh nội dung Issue có acceptance criteria; nhóm tạo thành các Issue thật trên GitHub, ví dụ:
  - #11 API Đăng ký/Đăng nhập JWT, #12 API Workspace CRUD (non-AI stories)
  - #21 Ingestion RAG, #30 LLM Provider Ollama, #31 Chat RAG API, #32 Streaming SSE (AI stories)

## Con người kiểm tra / quyết định
- Lead gán nhãn `[Backend]`, `[Frontend]`, `[Lead]` và phân vào các Phase/Sprint.
- Chọn 1–2 AI user story trọng tâm: **RAG chat** và **guardrail/handoff**.

## Lỗi / giới hạn của AI gặp trong tuần
- Một vài acceptance criteria do AI viết quá chung chung ("hoạt động tốt"). → Nhóm sửa lại thành tiêu chí kiểm thử được (mã lỗi, dữ liệu rỗng, cross-workspace).

## Bài nộp
- `reengineered_docs/06_User_Stories.md`, `07_Product_Backlog.md`
- 22 GitHub Issues (xem tab Issues của repo)
- `PROMPTS.md`, `ai-logs/week-04.md`
