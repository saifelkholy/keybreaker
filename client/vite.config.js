import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all IPs
    host: true,
    allowedHosts: [
      process.env.VITE_ALLOWED_HOST,
      'unfilamentous-wallace-unsincerely.ngrok-free.dev',
      'e53779b9edf4.ngrok-free.app',
      'localhost',
      '127.0.0.1'
    ].filter(Boolean),
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
