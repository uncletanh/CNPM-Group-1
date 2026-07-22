import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import widgetStyles from './index.css?inline'
import App from './App.tsx'

const HOST_ID = 'novachat-widget-root';
const MOUNT_ID = 'novachat-widget-mount';

function mountWidget() {
  let host = document.getElementById(HOST_ID);
  if (!host) {
    host = document.createElement('div');
    host.id = HOST_ID;
    document.body.appendChild(host);
  }

  // Reset host và dùng Shadow DOM để CSS của widget/website không tràn qua nhau.
  host.style.setProperty('all', 'initial', 'important');
  host.style.setProperty('position', 'static', 'important');
  host.style.setProperty('width', '0', 'important');
  host.style.setProperty('height', '0', 'important');

  const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  if (!shadowRoot.querySelector('style[data-novachat-styles]')) {
    const style = document.createElement('style');
    style.dataset.novachatStyles = 'true';
    style.textContent = widgetStyles;
    shadowRoot.appendChild(style);
  }

  let mountPoint = shadowRoot.getElementById(MOUNT_ID);
  if (!mountPoint) {
    mountPoint = document.createElement('div');
    mountPoint.id = MOUNT_ID;
    shadowRoot.appendChild(mountPoint);
  }
  if (mountPoint.dataset.mounted === 'true') return;
  mountPoint.dataset.mounted = 'true';

  createRoot(mountPoint).render(
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
