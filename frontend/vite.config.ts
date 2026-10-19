/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// En desarrollo (npm run dev) las llamadas a la API se redirigen al gateway.
// En Docker lo hace nginx (ver nginx.conf).
const GATEWAY = process.env.VITE_GATEWAY_URL ?? 'http://localhost:3100'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': GATEWAY,
      '/graphql': GATEWAY,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})
