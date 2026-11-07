import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Motor de voz compartido por la función de Vercel (`api/tts.ts`) y el middleware de Vite (`vite.config.ts`), para que
 * `/api/tts` responda igual en producción y con `npm run dev`. Usa la voz de Google, que no pide llaves pero tampoco es
 * una API pública con garantías: si falla, el cliente cae a la voz del dispositivo.
 */

/** El cliente pide de a un trozo breve; este tope evita que el endpoint sirva para sintetizar textos largos ajenos. */
export const MAX_TEXT = 600

const FRAGMENT_MAX = 179
const TIMEOUT_MS = 8000
const USER_AGENT = 'Mozilla/5.0 (compatible; paes-studio-tts)'

/** Corta en pausas naturales, para que cada fragmento quepa en el límite de Google sin partir palabras. */
export function splitText(text: string, max = FRAGMENT_MAX): string[] {
  const parts: string[] = []
  let rest = text.trim()
  while (rest.length > max) {
    const window = rest.slice(0, max)
    const pause = Math.max(window.lastIndexOf('. '), window.lastIndexOf('; '), window.lastIndexOf(', '), window.lastIndexOf(': '))
    const space = window.lastIndexOf(' ')
    const at = pause > max * 0.4 ? pause + 1 : space > 0 ? space : max
    parts.push(rest.slice(0, at).trim())
    rest = rest.slice(at).trim()
  }
  if (rest) parts.push(rest)
  return parts
}

/** Cabecera ID3 o sincronismo de un cuadro MPEG: lo que permite confiar en que la respuesta es audio de verdad. */
export const looksLikeMp3 = (audio: Buffer) =>
  audio.length > 1024 && (audio.subarray(0, 3).toString('latin1') === 'ID3' || (audio[0] === 0xff && (audio[1] & 0xe0) === 0xe0))

async function fetchFragment(text: string): Promise<Buffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=es&client=tw-ob&q=${encodeURIComponent(text)}`
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) throw new Error(`google respondió ${response.status}`)
  return Buffer.from(await response.arrayBuffer())
}

/** Los últimos textos, porque el navegador pide un mismo audio varias veces: al adelantarlo y al reproducirlo por partes. */
const recent = new Map<string, Buffer>()
const RECENT_MAX = 64

/** Sintetiza el texto completo. Los MP3 de cada fragmento se pueden concatenar tal cual. */
export async function synthesize(text: string): Promise<Buffer> {
  const known = recent.get(text)
  if (known) return known
  const parts: Buffer[] = []
  for (const fragment of splitText(text)) parts.push(await fetchFragment(fragment))
  const audio = Buffer.concat(parts)
  if (looksLikeMp3(audio)) {
    if (recent.size >= RECENT_MAX) recent.delete(recent.keys().next().value as string)
    recent.set(text, audio)
  }
  return audio
}

/** Safari solo reproduce audio de servidores que respetan `Range`, y pide los bytes por partes. */
function parseRange(header: string | undefined, size: number): [number, number] | null {
  const match = header?.match(/^bytes=(\d*)-(\d*)$/)
  if (!match || (!match[1] && !match[2])) return null
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]))
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1
  return start <= end && start < size ? [start, end] : null
}

function reply(res: ServerResponse, status: number, message: string) {
  res.statusCode = status
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(message)
}

/** Atiende `GET /api/tts?text=...`. Un mismo texto siempre suena igual, así que la respuesta se guarda en caché. */
export async function handleTts(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'HEAD') return reply(res, 405, 'usa GET')
  const text = new URL(req.url ?? '', 'http://localhost').searchParams.get('text')?.trim() ?? ''
  if (!text) return reply(res, 400, 'falta el parámetro text')
  if (text.length > MAX_TEXT) return reply(res, 413, `texto de más de ${MAX_TEXT} caracteres`)
  try {
    const audio = await synthesize(text)
    if (!looksLikeMp3(audio)) throw new Error(`audio inválido (${audio.length} bytes)`)
    const range = parseRange(req.headers.range, audio.length)
    const body = range ? audio.subarray(range[0], range[1] + 1) : audio
    res.statusCode = range ? 206 : 200
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Content-Length', body.length)
    if (range) res.setHeader('Content-Range', `bytes ${range[0]}-${range[1]}/${audio.length}`)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.end(req.method === 'HEAD' ? undefined : body)
  } catch (error) {
    console.error('[tts]', error)
    reply(res, 502, 'no se pudo generar la voz')
  }
}
