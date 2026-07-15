# AI Log — Tuần 10: Release, Demo & Defense

- **Giai đoạn:** Nghiệm thu (≈ 15/07 – 22/07/2026)
- **Người phụ trách chính:** Cả nhóm

## Mục tiêu
Chứng minh nhóm hiểu sản phẩm và hiểu cách AI agent đã được sử dụng; chuẩn bị release, demo cloud và bảo vệ.

## Công cụ AI đã dùng
- **Claude Code** để tổng hợp `FINAL_REPORT.md`, `AI_ENGINEERING_REFLECTION.md`, và rà soát checklist bảo vệ.

## Việc đã/đang làm trong tuần
- Soạn `FINAL_REPORT.md` và `PROMPTS.md` (2 prompt hiệu quả nhất) dựa trên lịch sử commit/PR/issue thật.
- Chuẩn bị slide (12–15 slide) theo cấu trúc rubric: Agile 15% / Kiến trúc 35% / DevOps 25% / AI 15%.
- Chụp bằng chứng: GitHub Issues (22), PR đã merge (~10), CI xanh.
- Mỗi thành viên ôn phần code mình phụ trách để trả lời vấn đáp cá nhân (20%).

## Việc còn phải hoàn tất trước buổi bảo vệ (checklist trung thực)
- [ ] **Deploy cloud chạy được thật** — điểm rủi ro lớn nhất vì AI feature dùng Ollama local. Phương án: dựng 1 VPS chạy Ollama và trỏ `OLLAMA_BASE_URL`, hoặc thêm fallback provider cloud (Groq/Gemini) để demo online không chết.
- [ ] **Đo code coverage** (`pytest --cov`) để có con số cho rubric (mục tiêu > 70%).
- [ ] **Thêm bước SAST** (bandit) vào CI.
- [ ] Đồng bộ slide với code thật (Ollama/SSE, Modular Monolith).

## Câu hỏi bảo vệ — trả lời nhanh
Xem đầy đủ trong `FINAL_REPORT.md` mục "Bộ câu hỏi bảo vệ". Tóm tắt:
- **Sản phẩm giải quyết gì?** Tự động hóa CSKH cho SME bằng chatbot RAG + human takeover.
- **AI feature là gì?** RAG chatbot trả lời theo tài liệu doanh nghiệp, có trích dẫn nguồn và guardrail chống bịa.
- **AI agent giúp gì ngoài viết code?** Phân tích sản phẩm, sinh backlog/issue, thiết kế kiến trúc, viết test, review bảo mật, sửa CI, viết tài liệu.
- **Nếu bỏ AI feature còn giá trị không?** Còn — vẫn là nền tảng quản lý hội thoại + human CSKH, nhưng mất lợi thế tự động hóa.

## Bài nộp
- `FINAL_REPORT.md`, `AI_ENGINEERING_REFLECTION.md`, Release v1.0.0, demo link
- `ai-logs/week-10.md`
