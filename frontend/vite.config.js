import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  base: '/utils/',
  plugins: [react()],
  build: {
    // The document converter is route-lazy but includes DOCX/PDF renderers.
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
