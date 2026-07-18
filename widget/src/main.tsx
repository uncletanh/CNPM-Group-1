import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

function mountWidget() {
  // Tự động tạo thẻ div#novachat-widget-root nếu chưa có để nhúng Widget.
  // Day la mot sibling doc lap cua <body>, khong dung vao #root/#__next,
  // nen khong xung dot voi cay React cua host app (Next.js, v.v.).
  let container = document.getElementById('novachat-widget-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'novachat-widget-root';
    document.body.appendChild(container);
  }

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Neu script duoc dat trong <head> khong co async/defer, document.body co
// the chua ton tai luc dong nay chay - cho readyState thay vi appendChild
// vao body null. Voi moi cach nhung con lai (cuoi <body>, dong qua script
// dong, next/script strategy bat ky) thi body da co san nen chay ngay.
if (document.body) {
  mountWidget();
} else {
  document.addEventListener('DOMContentLoaded', mountWidget, { once: true });
}
