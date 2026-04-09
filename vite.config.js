import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true, // 關鍵：這會允許 Vite 監聽所有網路介面，而不僅僅是 localhost
    port: 5173  // 你可以指定端口
  }
})