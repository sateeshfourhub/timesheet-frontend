import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://timesheet-backend-production-9d7d.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
