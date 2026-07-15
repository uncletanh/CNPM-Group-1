# AI Log — Tuần 1: Agent Onboarding & Chọn hướng Project

- **Giai đoạn:** Khởi động (≈ 20/05 – 27/05/2026)
- **Mốc thực tế trong repo:** `Initial commit` (27/05), tài liệu sản phẩm đầu tiên `Tài liệu sản phẩm NovaChat` (08/06)
- **Người phụ trách chính:** Nguyễn Tiến Anh (Lead / System Architect)

## Mục tiêu
Cả nhóm làm quen với AI agent như một "thành viên" trong quy trình phát triển phần mềm, không chỉ để viết code. Thống nhất bộ công cụ, tạo GitHub repository và chốt hướng đi sản phẩm.

## Công cụ AI đã cấu hình
| Vai trò | Công cụ | Lý do chọn |
|---|---|---|
| Cloud agent chính | **Claude Code** | Agent terminal mạnh, đọc được cả repo, chạy test, review PR |
| Agent dự phòng | **Cline** (VS Code) | Mã nguồn mở, duyệt từng hành động trước khi apply |
| Fallback khi hết quota | **Gemini CLI / Ollama local** | Free tier lớn, chạy offline cho task giải thích/refactor |
| AI trong sản phẩm | **Ollama HTTP API** (`qwen2.5:3b`) | Chạy local, không cần API key trả phí, bảo vệ dữ liệu doanh nghiệp |

## Prompt tiêu biểu
```
Chúng tôi là nhóm 5 sinh viên môn Công nghệ phần mềm. Hãy đóng vai product mentor
và gợi ý 5 hướng sản phẩm SaaS có thể xây trong 10 tuần với 1 tính năng AI cốt lõi,
ưu tiên bài toán CSKH cho doanh nghiệp SME. Với mỗi hướng nêu: người dùng mục tiêu,
tính năng AI, và độ khó cho sinh viên.
```

## AI agent đã làm gì
- Gợi ý và so sánh các hướng sản phẩm; nhóm chọn **NovaChat AI — nền tảng chatbot RAG + Human-in-the-loop cho CSKH**.
- Sinh khung `AGENT_GUIDE.md`, `AI_USAGE_POLICY.md`, `PRODUCT_DIRECTION.md`.

## Con người kiểm tra / quyết định
- Nhóm tự chốt hướng "làm sản phẩm mới" (Hướng 1) thay vì làm lại app có sẵn.
- Chốt nguyên tắc: **không commit API key**, dùng `.env.example`, ưu tiên model local để tránh phát sinh chi phí.

## Lỗi / giới hạn của AI gặp trong tuần
- AI ban đầu đề xuất kiến trúc microservices "hoành tráng" không phù hợp với đội 5 người. → Nhóm chủ động yêu cầu rút gọn về Modular Monolith (xem tuần 5).

## Bài nộp
- `AGENT_GUIDE.md`, `AI_USAGE_POLICY.md`, `PRODUCT_DIRECTION.md`
- GitHub repository: `uncletanh/CNPM-Group-1`
- `ai-logs/week-01.md`
