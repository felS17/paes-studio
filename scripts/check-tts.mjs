/**
 * Comprueba /api/tts contra el middleware real de Vite, sin navegador: levanta el servidor de desarrollo, pide audio y
 * valida el tipo, el tamaño y la firma MP3. Requiere internet: `npm run check:tts`.
 */
import { createServer } from 'vite'
import { looksLikeMp3, splitText } from '../api/_lib/tts.ts'

let failed = 0

function report(ok, label, detail = '') {
  if (!ok) failed++
  console.log(`${ok ? 'ok ' : 'MAL'} ${label}${detail ? `: ${detail}` : ''}`)
}

const long = 'una frase de prueba, bastante más larga de lo normal. '.repeat(10)
const flat = (text) => text.replace(/\s+/g, ' ').trim()
report(splitText(long).every((part) => part.length < 180), 'fragmentos bajo 180 caracteres')
report(flat(splitText(long).join(' ')) === flat(long), 'los fragmentos no pierden texto')

const server = await createServer({ server: { port: 0 }, logLevel: 'silent' })
await server.listen()
const base = `http://localhost:${server.httpServer.address().port}`

try {
  const response = await fetch(`${base}/api/tts?text=probando+audio`)
  const audio = Buffer.from(await response.arrayBuffer())
  report(response.status === 200, '/api/tts responde 200', String(response.status))
  report(response.headers.get('content-type') === 'audio/mpeg', 'tipo audio/mpeg', response.headers.get('content-type') ?? '')
  report(audio.length > 1024, 'más de 1 KB', `${audio.length} bytes`)
  report(looksLikeMp3(audio), 'firma MP3 válida')

  const partial = await fetch(`${base}/api/tts?text=probando+audio`, { headers: { Range: 'bytes=0-99' } })
  report(partial.status === 206 && (await partial.arrayBuffer()).byteLength === 100, 'respeta Range (Safari)', String(partial.status))

  const accents = await fetch(`${base}/api/tts?text=${encodeURIComponent('la raíz cuadrada de ñandú, según Pitágoras')}`)
  report(accents.status === 200, 'acepta tildes y ñ', String(accents.status))
  report((await fetch(`${base}/api/tts?text=${encodeURIComponent(long)}`)).status === 200, 'une un texto de varios fragmentos')
  report((await fetch(`${base}/api/tts`)).status === 400, 'sin texto responde 400')
  report((await fetch(`${base}/api/tts?text=${'a'.repeat(601)}`)).status === 413, 'texto excesivo responde 413')
} finally {
  await server.close()
}

console.log(failed ? `\n${failed} comprobación(es) fallaron` : '\ntodo bien')
process.exit(failed ? 1 : 0)
