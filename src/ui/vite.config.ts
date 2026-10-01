import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from "node:path"

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, "../.."),
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
