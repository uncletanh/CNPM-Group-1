# NovaChat AI Embeddable Widget

Widget là React 19 + TypeScript, build bằng Vite Library Mode thành một file JavaScript UMD để nhúng vào website khách hàng.

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

- `dist/script.umd.cjs` — file duy nhất cần nhúng. CSS Tailwind được import dạng chuỗi và gắn vào Shadow Root của widget khi script chạy; không tạo `<style>` trong `<head>` và không cần thêm `<link rel="stylesheet">`.

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

`src/main.tsx` tạo `<div id="novachat-widget-root">`, gắn Shadow DOM rồi render React và CSS vào
Shadow Root. Vì vậy selector/reset của Tailwind không làm biến dạng website khách hàng, đồng thời
CSS toàn cục của website cũng không thể nhắm vào nút, ảnh, SVG hoặc nội dung Markdown của widget.

Các token kích thước Tailwind dùng pixel trong `src/index.css`; chúng không phụ thuộc `rem` của
website khách hàng. Khung chat có kích thước tối đa `340x480px` và tự co theo viewport nhỏ. Ô nhập
là `<textarea>` tự phình cao tối đa `120px`; Enter gửi và Shift+Enter xuống dòng.

`test-host.html` là trang kiểm thử hồi quy với CSS toàn cục cố tình xung đột. Sau khi build, chạy
dev server rồi mở trang này để xác nhận website và widget giữ nguyên kiểu dáng riêng:

```powershell
npm.cmd run build
npm.cmd run dev -- --host 127.0.0.1 --port 4179
```
