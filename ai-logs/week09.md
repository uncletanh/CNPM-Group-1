# AI Log — Tuần 9: Refactoring, Documentation & CI/CD

- **Giai đoạn:** Hoàn thiện & DevOps (≈ 15/07/2026)
- **Mốc thực tế trong repo:** `.github/workflows/ci.yml`, `render.yaml`, `DEPLOYMENT.md`, PR #37 (Sprint 3 widget & streaming), PR #38 (UI redesign), `Complete Phase 4 chat and platform foundations`
- **Người phụ trách chính:** Nguyễn Tiến Anh (Lead / DevOps)

## Mục tiêu
Dùng AI để hoàn thiện sản phẩm (không chỉ thêm tính năng): tìm technical debt, refactor nhỏ, cập nhật README, sửa CI/CD, viết deployment guide.

## Công cụ AI đã dùng
- **Claude Code** (DevOps Assistant mode) sửa CI và viết tài liệu triển khai.

## Prompt tiêu biểu (fix CI)
```
GitHub Actions workflow fail ở bước cài dependency của frontend. Đây là log lỗi:
[paste log lockfile npm ci]
Hãy: (1) giải thích lỗi, (2) xác định file/config gây lỗi, (3) đề xuất fix nhỏ nhất,
(4) không đổi hành vi ứng dụng, (5) chỉ cách verify.
```

## AI agent đã làm gì
- Hoàn thiện `ci.yml`: job backend (compile + 4 test) và job frontend/widget (lint + build) chạy song song bằng matrix.
- Sửa lỗi lockfile để `npm ci` chạy được (commit `Fix frontend lockfile for CI`, `Make frontend lockfile compatible with npm 10`).
- Viết `render.yaml` (blueprint deploy backend + frontend) và `DEPLOYMENT.md` (staging/production, migration Alembic, cảnh báo không public cổng Ollama 11434).
- Thêm observability: logging JSON, `/health`, `/metrics` (Prometheus), rate limiting.
- Refactor UI dashboard sang light theme (PR #38).

## Con người kiểm tra / quyết định
- Lead kiểm tra toàn bộ CI xanh trước khi merge.
- **Đồng bộ tài liệu với code:** cập nhật ghi chú rằng sản phẩm dùng **Ollama local + SSE** (không phải OpenAI/WebSocket như bản kiến trúc nháp ban đầu).

## Lỗi AI gây ra & cách phát hiện
- **Lỗi:** conflict khi merge nhiều nhánh song song (Sprint 3 + UI redesign). → Phát hiện khi merge, giải quyết thủ công (`Merge main and resolve Sprint 3 conflicts`).
- **Technical debt còn lại (trung thực):** chưa đo code coverage, chưa có bước SAST, frontend/widget chưa có test tự động. → Ghi vào `TECHNICAL_DEBT.md` để xử lý ở tuần 10.

## Bài nộp
- `TECHNICAL_DEBT.md`, `DEPLOYMENT.md`, refactoring PR #37/#38, CI xanh
- `ai-logs/week-09.md`
