/**
 * Parser mínimo de Markdown + LaTeX para enunciados, lecturas y explicaciones.
 *
 * Bloques: párrafo, `$$…$$`, listas (-, 1.), `### título`, `> cita`, tablas `| a | b |`,
 * imágenes `![alt](src){w=.. h=.. mono}`.
 * En línea: `$…$`, `**negrita**`, `*cursiva*`, `\$` (dólar literal), salto de línea simple → <br>.
 */

export type Inline =
  | { t: 'text'; v: string }
  | { t: 'math'; v: string; display?: boolean }
  | { t: 'strong'; c: Inline[] }
  | { t: 'em'; c: Inline[] }
  | { t: 'br' }

export type Block =
  | { t: 'p'; c: Inline[]; plain: string; allBold: boolean }
  | { t: 'math'; v: string }
  | { t: 'list'; ordered: boolean; items: Inline[][] }
  | { t: 'h'; c: Inline[] }
  | { t: 'quote'; c: Inline[] }
  | { t: 'table'; head: Inline[][]; rows: Inline[][][] }
  | { t: 'img'; alt: string; src: string; w?: number; h?: number; mono: boolean; caption: boolean }

function findClosing(s: string, from: number, token: string): number {
  for (let j = from; j <= s.length - token.length; j++) {
    if (s[j] === '\\') {
      j++
      continue
    }
    if (s.startsWith(token, j)) return j
  }
  return -1
}

export function parseInline(s: string): Inline[] {
  const out: Inline[] = []
  let buf = ''
  const flush = () => {
    if (buf) out.push({ t: 'text', v: buf })
    buf = ''
  }
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (ch === '\\' && i + 1 < s.length && '$\\*_'.includes(s[i + 1])) {
      buf += s[i + 1]
      i += 2
      continue
    }
    if (ch === '$') {
      const display = s.startsWith('$$', i)
      const open = display ? 2 : 1
      const end = findClosing(s, i + open, display ? '$$' : '$')
      if (end > i + open - 1 && end !== -1) {
        flush()
        out.push({ t: 'math', v: s.slice(i + open, end).trim(), display })
        i = end + open
        continue
      }
    }
    if (ch === '*' && s.startsWith('**', i)) {
      const end = s.indexOf('**', i + 2)
      if (end > i + 2) {
        flush()
        out.push({ t: 'strong', c: parseInline(s.slice(i + 2, end)) })
        i = end + 2
        continue
      }
    }
    if (ch === '*' && s[i + 1] && s[i + 1] !== ' ' && s[i + 1] !== '*') {
      const end = findClosing(s, i + 1, '*')
      if (end > i + 1 && s[end - 1] !== ' ') {
        flush()
        out.push({ t: 'em', c: parseInline(s.slice(i + 1, end)) })
        i = end + 1
        continue
      }
    }
    if (ch === '\n') {
      flush()
      out.push({ t: 'br' })
      i++
      continue
    }
    buf += ch
    i++
  }
  flush()
  return out
}

const IMG_RE = /^!\[([^\]]*)\]\(([^)\s]+)\)(?:\{([^}]*)\})?$/
const plainOf = (s: string) => s.replace(/\*\*|(?<!\\)\*|\\/g, '').trim()

export function parseBlocks(src: string): Block[] {
  const chunks = src.replace(/\r\n/g, '\n').split(/\n[ \t]*\n/)
  const blocks: Block[] = []
  for (const raw of chunks) {
    const chunk = raw.trim()
    if (!chunk) continue
    if (chunk.startsWith('$$') && chunk.endsWith('$$') && chunk.length > 4 && findClosing(chunk, 2, '$$') === chunk.length - 2) {
      blocks.push({ t: 'math', v: chunk.slice(2, -2).trim() })
      continue
    }
    const img = chunk.match(IMG_RE)
    if (img) {
      const attrs = img[3] ?? ''
      const w = attrs.match(/w=(\d+)/)
      const h = attrs.match(/h=(\d+)/)
      blocks.push({
        t: 'img',
        alt: img[1].replace(/\\(.)/g, '$1'),
        src: img[2],
        w: w ? Number(w[1]) : undefined,
        h: h ? Number(h[1]) : undefined,
        mono: /\bmono\b/.test(attrs),
        caption: /\bcaption\b/.test(attrs),
      })
      continue
    }
    const lines = chunk.split('\n')
    if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
      blocks.push({ t: 'list', ordered: false, items: lines.map((l) => parseInline(l.replace(/^\s*[-•]\s+/, ''))) })
      continue
    }
    if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
      blocks.push({ t: 'list', ordered: true, items: lines.map((l) => parseInline(l.replace(/^\s*\d+[.)]\s+/, ''))) })
      continue
    }
    if (/^#{1,4}\s/.test(chunk) && lines.length === 1) {
      blocks.push({ t: 'h', c: parseInline(chunk.replace(/^#{1,4}\s+/, '')) })
      continue
    }
    if (lines.every((l) => l.startsWith('>'))) {
      blocks.push({ t: 'quote', c: parseInline(lines.map((l) => l.replace(/^>\s?/, '')).join('\n')) })
      continue
    }
    if (lines.length >= 2 && lines.every((l) => l.trim().startsWith('|')) && /^\|?\s*:?-{2,}/.test(lines[1].trim())) {
      const cells = (l: string) =>
        l.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => parseInline(c.trim().replace(/\\\|/g, '|')))
      blocks.push({ t: 'table', head: cells(lines[0]), rows: lines.slice(2).map(cells) })
      continue
    }
    const allBold = /^\*\*[^*]+\*\*$/.test(chunk)
    blocks.push({ t: 'p', c: parseInline(chunk), plain: plainOf(chunk), allBold })
  }
  return blocks
}

const INTRO_RE = /^(Fragmento|Texto|Adaptaci|Extracto|Columna|Art[ií]culo|Carta|Reportaje|Noticia|Entrevista|Cuento|Poema|Ensayo|Discurso|Rese[ñn]a|Cr[oó]nica|Infograf|Relato|Fábula|Leyenda|Microcuento)/i

/**
 * Índices de bloques que cuentan como párrafos del texto (para numerarlos en el margen).
 * Excluye títulos en negrita, imágenes y la nota introductoria inicial ("Fragmento de…").
 */
export function numberableParagraphs(blocks: Block[]): Set<number> {
  const out = new Set<number>()
  let seenBody = false
  blocks.forEach((b, i) => {
    if (b.t !== 'p' || b.allBold) return
    if (!seenBody && INTRO_RE.test(b.plain) && b.plain.length < 260) return
    if (b.plain.length < 40 && !/[.!?…:”"]$/.test(b.plain)) return // subtítulos cortos
    seenBody = true
    out.add(i)
  })
  return out
}
