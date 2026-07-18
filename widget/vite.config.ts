import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Nhung CSS thang vao script.umd.cjs bang mot the <style> tu inject luc
    // runtime - khach hang chi can 1 the <script> duy nhat, khong phai nho
    // them <link rel="stylesheet"> rieng (day chinh la nguyen nhan widget
    // "vo hinh": DOM mount dung nhung khong co CSS nao duoc nap).
    cssInjectedByJsPlugin(),
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    lib: {
      entry: 'src/main.tsx',
      name: 'NovaChatWidget',
      fileName: 'script',
      formats: ['umd']
    }
  }
})
