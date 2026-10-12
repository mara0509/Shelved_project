
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/Auth': {
        target: 'http://localhost:5085',
        changeOrigin: true,
      },
      '/Books': {
        target: 'http://localhost:5085',
        changeOrigin: true,
      },
    },
  },
})
