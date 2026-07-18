# 7. Product backlog

Ngày cập nhật: **19/07/2026**. Trạng thái dựa trên code đã merge vào `main`.

## Đã hoàn tất ở mức MVP

| Phase | Hạng mục | Trạng thái |
|---|---|---|
| 1 | JWT auth, user, workspace đa tenant | Done |
| 1 | Google SSO | Done trong code, cần credentials khi deploy |
| 1 | Workspace member/invitation Admin/Agent | Done, kèm đổi role thành viên hiện có |
| 2 | PDF/TXT/DOCX/text ingestion, embedding lưu trực tiếp Postgres | Done (đã bỏ ChromaDB — xem mục "Đã pivot" dưới) |
| 2 | Knowledge list/preview/delete/quick edit | Done |
| 2 | System Prompt và Test Bot | Done |
| 3 | RAG chat thường và SSE | Done |
| 3 | Widget Vite Library Mode, CSS tự nhúng, serve cùng origin dashboard | Done — 1 thẻ `<script>` copy-paste, không cần chỉnh gì thêm |
| 3 | Source citation | Done |
| 4 | Omnibox, history, takeover/reply/resolve | Done |
| 4 | WebSocket, Redis Pub/Sub và distributed lock | Done; Redis cần được cấu hình |
| 4 | Similarity threshold, history context, injection patterns | Done; cần tuning |
| 4 | Auto-responder sau 60 giây + tự trả `bot_handling` (kể cả phiên kẹt từ trước) | Done MVP; chưa durable queue |
| 5 | Widget color/name/greeting/avatar URL/position/preview/embed | Done |
| 5 | Widget UI polish (kích thước khung/chữ, textarea xuống dòng, chống CSS host đè) | Done |
| Ops | CI, health/metrics (ping DB thật + uptime), JSON log, rate limiting, Alembic baseline | Done nền tảng |
| Ops | Ollama/Groq/Gemini provider và fallback tự động | Done; cloud cần API key |
| Ops | Dashboard tab Tổng quan đọc `/health` thật (không còn số liệu hardcode) | Done |
| Monetization | Freemium (hạn mức 50 tin/tháng, watermark) + License Key (CSPRNG, rate-limit) + Admin Dashboard (RBAC toàn cục `USER`/`STAFF`/`ADMIN`) | Done |
| Quality | Golden dataset RAG 50 câu | Done bộ dữ liệu; chưa chạy tuning trên từng model |

## Đã pivot (quyết định kiến trúc thay đổi giữa dự án, không phải backlog còn mở)

- **ChromaDB → Postgres:** ChromaDB persist ra filesystem ephemeral của Render Free khiến tri
  thức mất sau mỗi lần restart/redeploy — phát hiện sau khi deploy thật, không phải lúc thiết
  kế. Đã bỏ hẳn ChromaDB, embedding lưu trực tiếp trong Postgres (cột JSON), similarity tính
  bằng Python. Giải quyết luôn 2 mục P0 cũ ("Chroma shared/persistent architecture" và phụ thuộc
  "persistent Chroma" khi deploy staging) — không còn tồn tại vì không còn Chroma để scale/persist.

## Backlog ưu tiên tiếp theo

| Ưu tiên | Hạng mục | Lý do | Phụ thuộc |
|---|---|---|---|
| P0 | Triển khai staging thật và smoke test end-to-end | Chưa chứng minh cấu hình production | PostgreSQL, Redis, LLM provider |
| P0 | Durable background jobs cho ingestion và handoff timeout | Timer/in-request không bền qua restart | Redis + worker framework |
| P0 | Bộ E2E browser test | UI workflow chưa được CI tự động hóa | Seed/test environment |
| P1 | Web Push Service Worker/VAPID | Agent không nhận khi tab đóng | HTTPS, push subscription storage |
| P1 | Email invitation, reset password, verify email | Hoàn thiện vòng đời tài khoản | Email provider |
| P1 | Quản trị Agent nâng cao | Disable, ownership transfer (đổi role thành viên đã Done) | RBAC policy |
| P1 | Distributed rate limiting | In-memory limiter không global | Redis |
| P1 | Chạy benchmark và tuning RAG theo workspace/model | Threshold semantic/BM25 hiện là mặc định kỹ thuật | Golden dataset 50 câu đã có |
| P2 | Upload/crop avatar và object storage | Hiện chỉ nhận URL | S3/R2 hoặc tương đương |
| P2 | OCR và parser tài liệu nâng cao | PDF scan/bảng chưa ổn định | OCR/parser service |
| P2 | Analytics theo thời gian, SLA, export | Dashboard hiện chỉ có aggregate | Event/audit data |
| P2 | Token rotation cho widget | Widget token hiện tĩnh theo workspace | — |
| P3 | OpenAI provider tùy chọn | Chỉ làm khi có ngân sách/yêu cầu | Provider abstraction/secrets |
| P3 | Multi-channel và action/tool calling | Ngoài phạm vi MVP web widget | Integration platform |

## Definition of Done cho backlog mới

- Có migration thay vì chỉ sửa schema runtime.
- Có test unit/integration và E2E phù hợp.
- Frontend/widget lint và build pass.
- Không làm mất tính tách biệt workspace.
- Có hướng dẫn cấu hình/rollback/observability.
- GitHub checks xanh trước merge.
