import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleTts } from './_lib/tts.js'

/** Función de Vercel: `/api/tts?text=...`. El prefijo `_` de `_lib` evita que esa carpeta se publique como otra ruta. */
export default function handler(req: IncomingMessage, res: ServerResponse) {
  return handleTts(req, res)
}
