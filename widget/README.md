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

- `dist/script.umd.cjs` — file DUY NHẤT cần nhúng. CSS (Tailwind) được `vite-plugin-css-injected-by-js` (`vite.config.ts`) nhúng thẳng vào file JS này lúc build, tự inject vào `<head>` qua `<style>` khi script chạy — không còn xuất `script.css` riêng, không cần `<link rel="stylesheet">` nào cả. Đây là fix cho lỗi "widget tải được nhưng không hiển thị": DOM mount đúng nhưng nếu thiếu CSS thì mọi class Tailwind (position, size, màu) vô hiệu, layout coi như biến mất.

Khi đưa lên CDN, chỉ cần một thẻ script duy nhất ("Plug and Play" — không cần Client Component/useEffect ở bất kỳ framework nào):

```html
<script
  src="https://cdn.example.com/script.umd.cjs"
  data-workspace-id="1"
  data-widget-token="<widget_token>"
  data-api-url="https://api.example.com/api/v1"
></script>
```

Màn hình **Cấu hình Bot AI** sinh snippet với `src` lấy từ `window.location.origin` (cùng origin với dashboard) + `/script.umd.cjs`. Widget được phát hành cùng deploy của dashboard: `frontend/scripts/copy-widget-assets.mjs` build `widget/` rồi copy `dist/script.umd.cjs` vào `frontend/public/` trước khi build dashboard (xem `frontend/package.json` script `build`) — không dùng CDN riêng, không cần domain/project deploy thêm. Nếu cấu hình `allowed_domains`, domain chứa widget phải khớp một trong các domain đã lưu.

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

## Cách ly CSS khỏi trang host

Widget **không** dùng Shadow DOM/iframe (chủ đích, để nhẹ và tương thích rộng nhất — DOM mount
vào một `<div id="novachat-widget-root">` là sibling độc lập của `<body>`, xem `src/main.tsx`).
Hệ quả: nội dung bot render qua `ReactMarkdown` ra thẻ HTML thường (`<p>/<li>/<h1-6>`) có thể bị
CSS toàn cục của trang host nhắm trúng và đè lên class Tailwind của widget (đã gặp thật trên một
site khách có typography riêng). `src/index.css` có một khối CSS scope theo
`#novachat-widget-root` với `!important` cho các thẻ này để đảm bảo cỡ chữ luôn khớp thiết kế,
bất kể CSS trang host là gì — sửa cỡ chữ nội dung bot thì sửa ở khối này, không phải class
Tailwind trên `App.tsx`.

Khung chat cố định `w-[340px] h-[480px]` (px, không dùng `rem`, nên không bị ảnh hưởng nếu trang
host đổi root font-size). Ô nhập là `<textarea>` tự phình cao tối đa `120px` (không phải
`<input>` — input không thể xuống dòng theo spec HTML khi gõ dài), Enter gửi/Shift+Enter xuống
dòng qua `form.requestSubmit()`.
