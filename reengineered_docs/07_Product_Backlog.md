# 7. Product backlog

Ngày cập nhật: **16/07/2026**. Trạng thái dựa trên code local chờ merge vào `main`.

## Đã hoàn tất ở mức MVP

| Phase | Hạng mục | Trạng thái |
|---|---|---|
| 1 | JWT auth, user, workspace đa tenant | Done |
| 1 | Google SSO | Done trong code, cần credentials khi deploy |
| 1 | Workspace member/invitation Admin/Agent | Done cơ bản |
| 2 | PDF/TXT/DOCX/text ingestion và ChromaDB | Done |
| 2 | Knowledge list/preview/delete/quick edit | Done |
| 2 | System Prompt và Test Bot | Done |
| 3 | RAG chat thường và SSE | Done |
| 3 | Widget Vite Library Mode và LocalStorage session | Done |
| 3 | Source citation | Done |
| 4 | Omnibox, history, takeover/reply/resolve | Done |
| 4 | WebSocket, Redis Pub/Sub và distributed lock | Done; Redis cần được cấu hình |
| 4 | Similarity threshold, history context, injection patterns | Done; cần tuning |
| 4 | Auto-responder sau 60 giây | Done MVP; chưa durable queue |
| 5 | Widget color/name/greeting/avatar URL/position/preview/embed | Done |
| Ops | CI, health/metrics, JSON log, rate limiting, Alembic baseline | Done nền tảng |
| Ops | Ollama/Groq/Gemini provider và fallback tự động | Done; cloud cần API key |
| Quality | Golden dataset RAG 50 câu | Done bộ dữ liệu; chưa chạy tuning trên từng model |

## Backlog ưu tiên tiếp theo

| Ưu tiên | Hạng mục | Lý do | Phụ thuộc |
|---|---|---|---|
| P0 | Triển khai staging thật và smoke test end-to-end | Chưa chứng minh cấu hình production | PostgreSQL, Redis, LLM provider, persistent Chroma |
| P0 | Durable background jobs cho ingestion và handoff timeout | Timer/in-request không bền qua restart | Redis + worker framework |
| P0 | Chroma shared/persistent architecture | Local filesystem không phù hợp scale ngang | Hạ tầng vector service/storage |
| P0 | Bộ E2E browser test | UI workflow chưa được CI tự động hóa | Seed/test environment |
| P1 | Web Push Service Worker/VAPID | Agent không nhận khi tab đóng | HTTPS, push subscription storage |
| P1 | Email invitation, reset password, verify email | Hoàn thiện vòng đời tài khoản | Email provider |
| P1 | Quản trị Agent nâng cao | Đổi role, disable, ownership transfer | RBAC policy |
| P1 | Distributed rate limiting | In-memory limiter không global | Redis |
| P1 | Production-ready embed snippet/CDN versioning | Snippet hiện dùng CDN mẫu và localhost API | Widget hosting/release URL |
| P1 | Chạy benchmark và tuning RAG theo workspace/model | Threshold `1.2` mới là mặc định | Golden dataset 50 câu đã có |
| P2 | Upload/crop avatar và object storage | Hiện chỉ nhận URL | S3/R2 hoặc tương đương |
| P2 | OCR và parser tài liệu nâng cao | PDF scan/bảng chưa ổn định | OCR/parser service |
| P2 | Analytics theo thời gian, SLA, export | Dashboard hiện chỉ có aggregate | Event/audit data |
| P3 | OpenAI provider tùy chọn | Chỉ làm khi có ngân sách/yêu cầu | Provider abstraction/secrets |
| P3 | Multi-channel và action/tool calling | Ngoài phạm vi MVP web widget | Integration platform |

## Definition of Done cho backlog mới

- Có migration thay vì chỉ sửa schema runtime.
- Có test unit/integration và E2E phù hợp.
- Frontend/widget lint và build pass.
- Không làm mất tính tách biệt workspace.
- Có hướng dẫn cấu hình/rollback/observability.
- GitHub checks xanh trước merge.
