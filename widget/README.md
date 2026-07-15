# NovaChat AI Embeddable Widget

Widget là React 19 + TypeScript, build bằng Vite Library Mode thành JavaScript UMD và CSS để nhúng vào website khách hàng.

## Chạy local

```powershell
Copy-Item .env.example .env.local
npm.cmd ci
npm.cmd run dev
```

`.env.local`:

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_WORKSPACE_ID=1
VITE_WIDGET_TOKEN=<token-cua-workspace>
```

## Build

```powershell
npm.cmd run lint
npm.cmd run build
```

Output chính:

- `dist/script.umd.cjs`
- `dist/script.css`

Khi đưa lên CDN, có thể nhúng theo cấu hình script tag:

```html
<link rel="stylesheet" href="https://cdn.example.com/script.css">
<script
  src="https://cdn.example.com/script.umd.cjs"
  data-workspace-id="1"
  data-widget-token="<widget_token>"
  data-api-url="https://api.example.com/api/v1"
></script>
```

Màn hình **Cấu hình Bot AI** sinh một snippet mẫu. Code hiện vẫn dùng `https://cdn.novachat.ai/script.umd.js` và API localhost trong snippet, vì vậy khi phát hành phải thay bằng URL CDN/API thật (output local hiện là `script.umd.cjs`). Nếu cấu hình `allowed_origin`, domain chứa widget phải khớp chính xác origin đã lưu.

## Luồng hoạt động

1. Đọc cấu hình từ `data-*` hoặc biến Vite.
2. Tải tên bot, lời chào, màu, avatar URL và vị trí từ `/chat/{workspace_id}/widget-config`.
3. Lưu `session_key` trong LocalStorage để khôi phục lịch sử sau reload.
4. Gửi câu hỏi bằng POST SSE tới `/chat/{workspace_id}/stream` và hiển thị token dần.
5. Hiển thị nguồn trả về trong event `done`.
6. Nút **Gặp nhân viên** chuyển session sang `waiting_human`.
7. WebSocket nhận sự kiện takeover/tin nhắn; polling là fallback để lấy tin Agent và auto-responder.

## Tùy chỉnh hiện có

- Màu chính.
- Tên bot và lời chào.
- Avatar bằng URL.
- Vị trí trái/phải.
- Trạng thái Bot, chờ Agent, Agent đang hỗ trợ và đã xử lý.
- Trích dẫn tên tài liệu/trang khi RAG có nguồn.

Widget chưa có upload avatar, offline queue hoặc Service Worker.
