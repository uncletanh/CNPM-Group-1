import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Tự động tạo thẻ div#novachat-widget-root nếu chưa có để nhúng Widget
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
)
