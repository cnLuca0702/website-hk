import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8822,
    proxy: {
      '/api': {
        target: 'http://localhost:8866',
        changeOrigin: true,
      },
    },
  },
})
