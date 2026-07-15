# AI Log — Tuần 3: Prototype & Khung Codebase

- **Giai đoạn:** Boilerplate & Prototype (≈ 03/06 – 10/06/2026)
- **Mốc thực tế trong repo:** `chore: setup initial boilerplate for backend and frontend` (10/06)
- **Người phụ trách chính:** Nguyễn Tiến Anh (Lead) — Pair 2 (Thái & Bình) dựng UI

## Mục tiêu
Dựng khung monorepo (backend FastAPI + frontend React/Vite + widget) và prototype UI với mock data, chưa vội làm backend thật.

## Công cụ AI đã dùng
- **Claude Code** để scaffold cấu trúc thư mục chuẩn.
- **Cline** để sinh các component UI tĩnh (Login, Dashboard) với TailwindCSS.

## Prompt tiêu biểu
```
Tạo boilerplate monorepo gồm:
- backend/  : FastAPI + SQLAlchemy + cấu trúc app/api, app/core, app/models, app/schemas, app/services
- frontend/ : React + Vite + TypeScript + TailwindCSS + React Router
- widget/   : project Vite riêng, cấu hình library mode để build ra 1 file script nhúng
Chưa cần logic thật, chỉ dựng khung và trang mẫu dùng mock data.
```

## AI agent đã làm gì
- Sinh khung 3 project, cấu hình TailwindCSS, ESLint, `tsconfig`, `vite.config.ts`.
- Sinh trang `Login.tsx`, `Dashboard.tsx` bản tĩnh dùng mock data.

## Con người kiểm tra / chỉnh sửa
- Pair 2 chỉnh lại layout Sidebar/Dashboard cho khớp thiết kế nhóm.
- Lead kiểm tra cấu trúc thư mục backend khớp với tài liệu kiến trúc (Code-Level Suggestions).

## Lỗi / giới hạn của AI gặp trong tuần
- Widget lúc đầu được cấu hình như một app SPA thường → không build ra file nhúng được. Nhóm phát hiện khi thử `npm run build` và yêu cầu AI chuyển sang **Vite Library Mode** (`build.lib`).

## Bài nộp
- Boilerplate monorepo + prototype UI
- `reengineered_docs/09_User_Journeys.md` (UX prototype/journey)
- `ai-logs/week-03.md`
