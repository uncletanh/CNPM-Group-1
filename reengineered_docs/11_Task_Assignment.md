# 11. Phân công công việc và trạng thái thực hiện

Ngày cập nhật: **15/07/2026**.

## Cơ cấu đội dự án

- **Lead/System Architect:** Nguyễn Tiến Anh.
- **Pair Backend & AI:** Lê Xuân Hiệp, Đào Minh Hiếu.
- **Pair Frontend & UI/UX:** Vũ Công Minh Thái, Trương Gia Bình.

## Kết quả theo giai đoạn

### Phase 1: Foundation

| Hạng mục | Trạng thái |
|---|---|
| Monorepo backend/frontend/widget | Hoàn tất |
| JWT register/login và workspace | Hoàn tất |
| Google SSO | Hoàn tất trong code, cần credentials deploy |
| Workspace Admin/Agent và invitation | Hoàn tất luồng cơ bản |
| GitHub Actions | Hoàn tất |

### Phase 2: Knowledge Base

| Hạng mục | Trạng thái |
|---|---|
| ChromaDB persistent và embedding | Hoàn tất |
| PDF/TXT/DOCX/text ingestion | Hoàn tất |
| System Prompt | Hoàn tất |
| UI upload/progress/list/preview/delete | Hoàn tất |
| Quick edit text và Test Bot | Hoàn tất |
| OCR/background worker | Chưa làm |

### Phase 3: Widget và Streaming

| Hạng mục | Trạng thái |
|---|---|
| RAG API và Ollama | Hoàn tất |
| POST SSE streaming | Hoàn tất |
| Chat history và LocalStorage session | Hoàn tất |
| Widget Vite Library Mode | Hoàn tất |
| Widget token/origin check | Hoàn tất MVP |
| Source citations | Hoàn tất |

Lưu ý: code hiện dùng Ollama, không gọi OpenAI/Gemini.

### Phase 4: Human Handoff và Guardrails

| Hạng mục | Trạng thái |
|---|---|
| Nút Gặp nhân viên và `waiting_human` | Hoàn tất |
| Omnibox history/takeover/reply/resolve | Hoàn tất |
| Redis distributed lock + conditional SQL | Hoàn tất |
| WebSocket + Redis Pub/Sub | Hoàn tất |
| Polling fallback | Hoàn tất |
| Auto-responder 60 giây | Hoàn tất MVP, chưa durable queue |
| Âm thanh/Browser Notification | Hoàn tất khi tab mở |
| Web Push nền | Chưa làm |
| Similarity threshold/history/injection patterns | Hoàn tất, cần evaluation/tuning |

### Phase 5: Polish và Operations

| Hạng mục | Trạng thái |
|---|---|
| Widget color/name/greeting/avatar URL/position | Hoàn tất |
| Live preview và mã nhúng | Hoàn tất |
| Analytics cơ bản và account settings | Hoàn tất |
| Alembic baseline, health, metrics, JSON log, rate limit | Hoàn tất nền tảng |
| Render/Docker deployment templates | Hoàn tất cấu hình mẫu |
| Staging/production đã vận hành | Chưa xác nhận |
| Automated browser E2E/load/security test | Chưa làm đầy đủ |

## Phân công sprint tiếp theo

### Lead

- Chuẩn hóa staging architecture cho PostgreSQL, Redis, Ollama và persistent Chroma.
- Định nghĩa security checklist, secrets, backup/restore và monitoring.
- Review Alembic migration strategy và loại bỏ dần schema mutation khi startup.

### Pair Backend & AI

- Tách ingestion và handoff timeout sang durable worker.
- Xây evaluation dataset và hiệu chỉnh `RAG_MAX_DISTANCE`.
- Distributed rate limit, token rotation và audit log.
- Email invitation/password recovery khi có email provider.

### Pair Frontend & UI/UX

- Service Worker/VAPID Web Push.
- E2E tests cho onboarding, KB, widget và handoff.
- Avatar upload/crop khi có object storage.
- Deep-link tab/session, canned responses và analytics theo thời gian.

## Quy tắc phối hợp

- Mỗi thay đổi đi qua branch và Pull Request; không push trực tiếp `main` trừ khi Lead yêu cầu rõ ràng.
- Driver/Navigator đổi vai định kỳ và cùng chịu trách nhiệm test.
- Không đóng issue nếu chỉ có UI mà thiếu API/test, hoặc có API mà thiếu failure states.
- Cập nhật [12_Implementation_Status.md](12_Implementation_Status.md) khi merge tính năng làm thay đổi trạng thái backlog.
