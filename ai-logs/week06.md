# AI Log — Tuần 6: Implementation Sprint — Core Feature (non-AI)

- **Giai đoạn:** Auth & Workspace (≈ 15/06 – 25/06/2026)
- **Mốc thực tế trong repo:** PR #18, #25 `feature/auth-workspace`; commit `feat: implement auth (login/register) and workspaces dashboard`, `feat: complete Docker setup, update UI & README, fix auth bugs`
- **Người phụ trách chính:** Pair 1 (Hiệp & Hiếu — Backend), Pair 2 (Thái & Bình — Frontend)

## Mục tiêu
Triển khai chức năng cốt lõi **không phải AI** trước: đăng ký/đăng nhập JWT và quản lý Workspace. Sinh viên chạy app, review diff rồi tạo PR.

## Công cụ AI đã dùng
- **Claude Code** (Implementation Agent) — lập plan trước, code sau.
- **Cline** để sinh UI Login/Dashboard và nối API.

## Prompt tiêu biểu (bắt AI lập kế hoạch trước khi code)
```
Đọc AGENT_GUIDE.md và issue #11 (API Đăng ký/Đăng nhập JWT).
TRƯỚC TIÊN hãy tạo plan, CHƯA viết code. Plan gồm:
1. File sẽ sửa
2. Các bước triển khai
3. Test cần thêm
4. Rủi ro
5. Cách verify thủ công
```
Sau khi duyệt plan: *"Implement the approved plan. Giữ đơn giản, không sửa file không liên quan, không thêm dependency nếu không cần."*

## AI agent đã làm gì
- Backend: `models/user.py`, `models/workspace.py`, `schemas/`, `core/security.py` (hash bcrypt + JWT), API `auth.py`, `workspaces.py`, `deps.py` (RBAC dependency).
- Frontend: `Login.tsx` (lưu token localStorage), `Dashboard.tsx` (gọi API workspace, modal tạo mới).
- Cấu hình Docker Compose (backend + redis + frontend).

## Con người kiểm tra / review diff (bắt buộc)
- Lead review PR #18/#25, yêu cầu sửa một số bug auth trước khi merge.
- Kiểm tra thủ công: đăng ký → đăng nhập → tạo workspace → gọi API kèm `Authorization: Bearer`.

## Lỗi AI gây ra & cách phát hiện
- **Lỗi:** token không được đính kèm ở một số request (frontend gọi API thiếu header). → Phát hiện khi test tay thấy 401, sửa lại axios instance trong `services/api.ts`.
- **Lỗi:** AI hardcode `localhost` trong URL API. → Phát hiện khi deploy thử lên Vercel, đổi sang biến `VITE_API_URL` (commit `fix: use VITE_API_URL instead of hardcoded localhost`).

## Bài nộp
- Core feature PR #18, #25 (đã merge vào `main`)
- Review notes trên GitHub PR
- `ai-logs/week-06.md`
