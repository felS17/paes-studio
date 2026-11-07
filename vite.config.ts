import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { handleTts } from './api/_lib/tts.ts'

/** Sirve `/api/tts` en `npm run dev` y `npm run preview` con el mismo código de la función de Vercel. */
function ttsEndpoint(): Plugin {
  return {
    name: 'paes-tts-endpoint',
    configureServer(server) {
      server.middlewares.use('/api/tts', (req, res) => void handleTts(req, res))
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/tts', (req, res) => void handleTts(req, res))
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ttsEndpoint()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    chunkSizeWarningLimit: 900,
  },
})
