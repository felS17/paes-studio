import type { Explanation } from '@/types/exam'

/**
 * Traductor determinista de Markdown + LaTeX a español hablado. No usa servidores ni modelos: un lector de LaTeX por
 * descenso recursivo que cubre todos los comandos del banco. Lo que no reconoce se omite, así que nunca lee código.
 */

const LETTERS: Record<string, string> = {
  a: 'a', b: 'be', c: 'ce', d: 'de', e: 'e', f: 'efe', g: 'ge', h: 'hache', i: 'i', j: 'jota', k: 'ka', l: 'ele', m: 'eme',
  n: 'ene', o: 'o', p: 'pe', q: 'cu', r: 'erre', s: 'ese', t: 'te', u: 'u', v: 've', w: 'doble ve', x: 'equis', y: 'i griega', z: 'zeta',
}

const SYMBOLS: Record<string, string> = {
  cdot: 'por', times: 'por', ast: 'por', div: 'dividido por', pm: 'más o menos', mp: 'menos o más', approx: 'aproximadamente',
  sim: 'aproximadamente', le: 'menor o igual que', leq: 'menor o igual que', ge: 'mayor o igual que', geq: 'mayor o igual que',
  neq: 'distinto de', ne: 'distinto de', equiv: 'equivalente a', propto: 'proporcional a', to: 'da', rightarrow: 'da', longrightarrow: 'da',
  xrightarrow: 'da', mapsto: 'da', Rightarrow: 'por lo tanto', implies: 'por lo tanto', Leftrightarrow: 'si y solo si', leftarrow: 'viene de',
  uparrow: 'aumenta', downarrow: 'disminuye', nearrow: 'sube', nwarrow: 'sube', searrow: 'baja', swarrow: 'baja', cap: 'intersección', cup: 'unión',
  mid: 'dado', perp: 'perpendicular a', parallel: 'paralela a', angle: 'ángulo', triangle: 'triángulo', infty: 'infinito', ldots: 'etcétera',
  dots: 'etcétera', cdots: 'etcétera', in: 'pertenece a', notin: 'no pertenece a', subset: 'subconjunto de', forall: 'para todo', exists: 'existe',
  det: 'determinante de', max: 'máximo de', min: 'mínimo de', '%': 'por ciento', '{': 'abre llave', '}': 'cierra llave', '#': 'número', '&': 'y', '$': 'pesos',
  alpha: 'alfa', beta: 'beta', gamma: 'gamma', delta: 'delta', epsilon: 'épsilon', varepsilon: 'épsilon', zeta: 'zeta', eta: 'eta', theta: 'teta',
  iota: 'iota', kappa: 'kappa', lambda: 'lambda', mu: 'mu', nu: 'nu', xi: 'xi', pi: 'pi', rho: 'ro', sigma: 'sigma', tau: 'tau', phi: 'fi', varphi: 'fi',
  chi: 'ji', psi: 'psi', omega: 'omega', Gamma: 'gamma', Lambda: 'lambda', Pi: 'pi', Sigma: 'sigma', Phi: 'fi', Psi: 'psi', ell: 'ele',
}

const SILENT = new Set(['left', 'right', 'big', 'Big', 'bigg', 'Bigg', 'displaystyle', 'quad', 'qquad', 'limits', 'nonumber', 'hline', 'cr'])

const FUNCTIONS: Record<string, string> = { sin: 'seno', sen: 'seno', cos: 'coseno', tan: 'tangente', cot: 'cotangente', ln: 'logaritmo natural' }

/** Unidades: solo se leen como tales después de una cifra, para no confundir el newton con el nitrógeno. */
const UNITS: Record<string, string> = {
  m: 'metros', cm: 'centímetros', mm: 'milímetros', km: 'kilómetros', nm: 'nanómetros', pm: 'picómetros', s: 'segundos', ms: 'milisegundos',
  min: 'minutos', h: 'horas', kg: 'kilogramos', g: 'gramos', mg: 'miligramos', N: 'newton', J: 'joule', kJ: 'kilojoule', cal: 'calorías', kcal: 'kilocalorías',
  W: 'watt', kW: 'kilowatt', Pa: 'pascal', kPa: 'kilopascal', atm: 'atmósferas', K: 'kelvin', Hz: 'hertz', kHz: 'kilohertz', V: 'volt', A: 'ampere',
  mA: 'miliampere', C: 'coulomb', T: 'tesla', mol: 'moles', L: 'litros', mL: 'mililitros', dB: 'decibeles', u: 'unidades de masa atómica', M: 'molar',
}
const SINGULAR: Record<string, string> = {
  metros: 'metro', centímetros: 'centímetro', kilómetros: 'kilómetro', segundos: 'segundo', minutos: 'minuto', horas: 'hora', kilogramos: 'kilogramo',
  gramos: 'gramo', litros: 'litro', mililitros: 'mililitro', moles: 'mol',
}

const POWER_WORDS: Record<string, string> = { '2': 'al cuadrado', '3': 'al cubo' }
const SMALL_FRACTIONS: Record<string, string> = {
  '1/2': 'un medio', '1/3': 'un tercio', '2/3': 'dos tercios', '1/4': 'un cuarto', '3/4': 'tres cuartos', '1/5': 'un quinto', '1/10': 'un décimo',
}

const isAtomic = (spoken: string) => !/\s/.test(spoken) || spoken === 'doble ve' || spoken === 'i griega' || /^menos \S+$/.test(spoken)

class LatexReader {
  private i = 0
  private bars = 0
  private readonly totalBars: number
  private readonly src: string

  constructor(src: string) {
    this.src = src
    this.totalBars = (src.match(/\|/g) ?? []).length
  }

  private peek() {
    return this.src[this.i]
  }

  private skipSpaces() {
    while (this.i < this.src.length && /\s/.test(this.src[this.i])) this.i++
  }

  /** Lee `{...}` completo, o un solo símbolo si no hay llaves. */
  private rawArgument(): string {
    this.skipSpaces()
    if (this.peek() === '{') {
      const start = ++this.i
      let depth = 1
      while (this.i < this.src.length && depth > 0) {
        if (this.src[this.i] === '\\') this.i++
        else if (this.src[this.i] === '{') depth++
        else if (this.src[this.i] === '}') depth--
        this.i++
      }
      return this.src.slice(start, this.i - 1)
    }
    if (this.peek() === '\\') {
      const match = /^\\(?:[a-zA-Z]+|.)/.exec(this.src.slice(this.i))
      const token = match?.[0] ?? '\\'
      this.i += token.length
      return token
    }
    return this.src[this.i++] ?? ''
  }

  private argument(): string {
    return readLatex(this.rawArgument())
  }

  private optional(): string | null {
    this.skipSpaces()
    if (this.peek() !== '[') return null
    const end = this.src.indexOf(']', this.i)
    if (end < 0) return null
    const inner = this.src.slice(this.i + 1, end)
    this.i = end + 1
    return inner
  }

  private fraction(): string {
    const rawA = this.rawArgument()
    const rawB = this.rawArgument()
    const small = SMALL_FRACTIONS[`${rawA.trim()}/${rawB.trim()}`]
    if (small) return small
    const a = readLatex(rawA)
    const b = readLatex(rawB)
    return isAtomic(a) && isAtomic(b) ? `${a} partido en ${b}` : `la fracción de numerador ${a}, y denominador ${b},`
  }

  private root(): string {
    const index = this.optional()?.trim()
    const body = this.argument()
    if (!index || index === '2') return `raíz cuadrada de ${body}`
    if (index === '3') return `raíz cúbica de ${body}`
    return `raíz de índice ${readLatex(index)} de ${body}`
  }

  private logarithm(): string {
    this.skipSpaces()
    if (this.peek() !== '_') return 'logaritmo de'
    this.i++
    return `logaritmo en base ${this.argument()} de`
  }

  private summation(): string {
    let from = ''
    let to = ''
    for (let n = 0; n < 2; n++) {
      this.skipSpaces()
      if (this.peek() === '_') {
        this.i++
        from = this.argument()
      } else if (this.peek() === '^') {
        this.i++
        to = this.argument()
      }
    }
    return from && to ? `la suma desde ${from} hasta ${to} de` : 'la suma de'
  }

  /** Δ sola es el discriminante; seguida de una variable es una variación, como en Δx. */
  private bigDelta(): string {
    this.skipSpaces()
    return /[a-zA-Z\\]/.test(this.peek() ?? '') ? 'variación de' : 'discriminante'
  }

  /** `\mathrm{...}`: unidades después de una cifra, y fórmulas químicas o rótulos en cualquier otro caso. */
  private roman(afterNumber: boolean): string {
    const raw = this.rawArgument().trim()
    const unit = afterNumber ? readUnits(raw) : null
    if (unit) return unit
    if (/^[a-záéíóúñ]{3,}$/i.test(raw)) return raw.toLowerCase()
    return readLatex(raw)
  }

  private command(name: string, previous: string | undefined): string {
    if (SILENT.has(name)) {
      if (this.peek() === '.') this.i++
      return ''
    }
    if (/^[,;:! ]$/.test(name)) return ''
    if (name === '\\') return ','
    if (name in SYMBOLS) return SYMBOLS[name]
    if (name in FUNCTIONS) return `${FUNCTIONS[name]} de`
    const afterNumber = previous !== undefined && /\d$/.test(previous)
    switch (name) {
      case 'frac': case 'dfrac': case 'tfrac': case 'cfrac': return this.fraction()
      case 'sqrt': return this.root()
      case 'log': return this.logarithm()
      case 'sum': return this.summation()
      case 'Delta': return this.bigDelta()
      case 'Omega': return afterNumber ? 'ohm' : 'omega'
      case 'circ': return afterNumber ? 'grados' : 'compuesta con'
      case 'binom': {
        const n = this.argument()
        return `combinaciones de ${n} en ${this.argument()}`
      }
      case 'pmod': return `módulo ${this.argument()}`
      case 'vec': return `vector ${this.argument()}`
      case 'overline': return `segmento ${this.argument()}`
      case 'bar': return `${this.argument()} barra`
      case 'hat': return `${this.argument()} sombrero`
      case 'mathrm': case 'mathbf': case 'mathsf': return this.roman(afterNumber)
      case 'mathbb': return numberSet(this.rawArgument())
      case 'text': case 'mbox': case 'textbf': case 'mathit': case 'operatorname': case 'textit': return readPlainMath(this.rawArgument())
      case 'begin': case 'end':
        this.rawArgument()
        return ''
      default:
        // Comando desconocido: se descartan sus llaves, pero se lee su contenido.
        return this.peek() === '{' ? this.argument() : ''
    }
  }

  private power(previous: string | undefined): string {
    const raw = this.rawArgument().trim()
    if (raw === '\\circ') return 'grados'
    if (raw === '\\prime' || raw === "'") return 'prima'
    if (raw in POWER_WORDS) return POWER_WORDS[raw]
    if (previous === undefined) return readLatex(raw)
    return `elevado a ${readLatex(raw)}`
  }

  /** `(x)` tras una letra como f o P se lee «efe de equis»; lo demás abre y cierra paréntesis. */
  private parenthesis(previous: string | undefined): string {
    const isFunction = previous !== undefined && ['efe', 'ge', 'hache', 'pe'].includes(previous)
    if (!isFunction) return 'abre paréntesis'
    let depth = 1
    let j = this.i
    while (j < this.src.length && depth > 0) {
      if (this.src[j] === '(') depth++
      else if (this.src[j] === ')') depth--
      j++
    }
    if (depth !== 0) return 'abre paréntesis'
    const inner = this.src.slice(this.i, j - 1)
    this.i = j
    return `de ${readLatex(inner)}`
  }

  read(): string {
    const out: string[] = []
    // Los espacios de LaTeX no dejan rastro: así `10\\ \\mathrm{N}` sabe que su unidad viene después de una cifra.
    const say = (spoken: string) => {
      if (spoken) out.push(spoken)
    }
    while (this.i < this.src.length) {
      const c = this.src[this.i]
      const previous = out[out.length - 1]
      if (/\s/.test(c) || c === '~') {
        this.i++
      } else if (c === '\\') {
        const match = /^\\([a-zA-Z]+|[\s\S])/.exec(this.src.slice(this.i))
        const name = match?.[1] ?? ''
        this.i += (match?.[0].length ?? 1)
        say(this.command(name, previous))
      } else if (c === '{') {
        // `{,}` es la coma decimal; cualquier otra llave solo agrupa.
        const inner = this.rawArgument()
        say(inner === ',' ? 'coma' : readLatex(inner))
      } else if (c === '}' || c === '&') {
        this.i++
      } else if (/\d/.test(c)) {
        say(this.number())
      } else if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(c)) {
        say(this.word(previous))
      } else if (c === '^') {
        this.i++
        say(this.power(previous))
      } else if (c === '_') {
        this.i++
        say(`sub ${this.argument()}`)
      } else if (c === '(') {
        this.i++
        say(this.parenthesis(previous))
      } else if (c === '|') {
        this.i++
        this.bars++
        if (this.totalBars % 2) say('dado')
        else if (this.bars % 2) say('valor absoluto de')
      } else {
        this.i++
        say(PUNCTUATION[c] ?? '')
      }
    }
    return out.join(' ')
  }

  /** Une `1\,500` en una sola cifra para que la voz diga «mil quinientos». */
  private number(): string {
    const match = /^\d+(?:\\,\d{3})*/.exec(this.src.slice(this.i))
    const raw = match?.[0] ?? ''
    this.i += raw.length
    return raw.replace(/\\,/g, '')
  }

  private word(previous: string | undefined): string {
    const match = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+/.exec(this.src.slice(this.i))
    const raw = match?.[0] ?? ''
    this.i += raw.length
    if (previous !== undefined && /\d$/.test(previous) && raw in UNITS) return UNITS[raw]
    if (raw.toLowerCase() in FUNCTIONS) return `${FUNCTIONS[raw.toLowerCase()]} de`
    if (/[áéíóúñ]/i.test(raw) || raw.length >= 5) return raw.toLowerCase()
    return [...raw].map((l) => LETTERS[l.toLowerCase()] ?? '').join(' ')
  }
}

const PUNCTUATION: Record<string, string> = {
  '+': 'más', '-': 'menos', '−': 'menos', '=': 'igual a', '<': 'menor que', '>': 'mayor que', '/': 'partido en', '*': 'por', '%': 'por ciento',
  ')': 'cierra paréntesis', '[': 'abre corchete', ']': 'cierra corchete', ',': 'coma', ';': ',', ':': 'es a', '!': 'factorial', "'": 'prima', '°': 'grados',
}

function numberSet(raw: string): string {
  const sets: Record<string, string> = { R: 'los reales', N: 'los naturales', Z: 'los enteros', Q: 'los racionales', C: 'los complejos' }
  return sets[raw.trim()] ?? ''
}

/** `m/s^2` → «metros por segundo al cuadrado». Devuelve null si no es una unidad, como `H_2O`. */
function readUnits(raw: string): string | null {
  const clean = raw.replace(/\\[,;: ]/g, ' ').trim()
  const parts = clean.split('/').map((p) => p.trim())
  const spoken: string[] = []
  for (const [index, part] of parts.entries()) {
    const m = /^([a-zA-Z]+)(?:\^\{?(-?\d)\}?)?$/.exec(part)
    if (!m || !(m[1] in UNITS)) return null
    const name = UNITS[m[1]]
    const power = m[2] ? (POWER_WORDS[m[2]] ?? `elevado a ${m[2]}`) : ''
    spoken.push([index > 0 ? SINGULAR[name] ?? name : name, power].filter(Boolean).join(' '))
  }
  return spoken.join(' por ')
}

/** Texto dentro de una fórmula (`\text{área}`): se lee tal cual, y sus fórmulas internas se traducen. */
function readPlainMath(raw: string): string {
  return raw.includes('$') ? mathTextToSpeech(raw) : raw.replace(/[\\{}^_~&]/g, ' ').toLowerCase().trim()
}

function readLatex(tex: string): string {
  return new LatexReader(tex).read()
}

const tidy = (text: string) =>
  text
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/,(\s*,)+/g, ',')
    .replace(/\s+/g, ' ')
    .trim()

/** Convierte una fórmula LaTeX, sin los `$`, a español hablado. */
export function latexToSpeech(tex: string): string {
  return tidy(readLatex(tex))
}

const MATH = /\$\$([\s\S]+?)\$\$|(?<!\\)\$((?:\\.|[^$\\])+?)\$/g

function cleanMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)(\{[^}]*\})?/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\\\$\s*/g, ' pesos ')
    .replace(/\*\*|__|\*|`/g, '')
    .replace(/^\s*(#{1,6}|>|[-•])\s+/gm, '')
    .replace(/\|/g, ', ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[\\{}^_~]/g, ' ')
}

/** Convierte texto Markdown con fórmulas `$...$` a español hablado, sin delimitadores ni comandos. */
export function mathTextToSpeech(text: string): string {
  let out = ''
  let last = 0
  for (const m of text.matchAll(MATH)) {
    out += cleanMarkdown(text.slice(last, m.index))
    out += ` ${readLatex(m[1] ?? m[2])} `
    last = m.index + m[0].length
  }
  return tidy(out + cleanMarkdown(text.slice(last)))
}

export interface SpeechBlock {
  /** `planteamiento`, o el índice del paso que se está leyendo. */
  target: 'planteamiento' | number
  text: string
}

const CONCLUSION = /(Por lo tanto, la alternativa correcta es la [A-E]\.?)\s*$/

/** Los bloques que lee el tutor: Planteamiento, Paso 1, Paso 2…, y la conclusión al final del último paso. */
export function explanationSpeech(explanation: Explanation): SpeechBlock[] {
  const blocks: SpeechBlock[] = []
  if (explanation.planteamiento) blocks.push({ target: 'planteamiento', text: `Planteamiento. ${mathTextToSpeech(explanation.planteamiento)}` })
  explanation.steps.forEach((step, i) => {
    const spoken = mathTextToSpeech(step).replace(CONCLUSION, 'Conclusión. $1')
    blocks.push({ target: i, text: `Paso ${i + 1}. ${spoken}` })
  })
  return blocks
}

/**
 * Parte un texto en trozos de hasta `max` caracteres, en pausas naturales. Cada trozo es un audio de `/api/tts`, cuyo
 * motor admite menos de 180 caracteres, y en la voz del dispositivo evita que el navegador corte las frases largas.
 */
export function chunkSpeech(text: string, max = 170): string[] {
  const chunks: string[] = []
  let rest = text.trim()
  while (rest.length > max) {
    const window = rest.slice(0, max)
    const cut = Math.max(window.lastIndexOf('. '), window.lastIndexOf('; '), window.lastIndexOf(': '))
    const fallback = Math.max(window.lastIndexOf(', '), window.lastIndexOf(' '))
    const at = cut > max * 0.4 ? cut + 1 : fallback > 0 ? fallback + 1 : max
    chunks.push(rest.slice(0, at).trim())
    rest = rest.slice(at).trim()
  }
  if (rest) chunks.push(rest)
  return chunks
}

/** Puntaje de una voz: primero la calidad (neuronal o de Google) y, a igual calidad, la variante más cercana a Chile. */
function voiceScore(voice: Pick<SpeechSynthesisVoice, 'name' | 'lang'>): number {
  const lang = voice.lang.toLowerCase().replace('_', '-')
  if (!lang.startsWith('es')) return -1
  const quality = /natural|neural|online|premium|enhanced/i.test(voice.name) ? 20 : /google/i.test(voice.name) ? 10 : 0
  const region = lang === 'es-cl' ? 3 : ['es-419', 'es-mx', 'es-ar', 'es-us', 'es-pe', 'es-co'].includes(lang) ? 2 : lang === 'es-es' ? 1 : 0
  return quality + region
}

/** La mejor voz en español disponible, o null si el dispositivo no tiene ninguna. */
export function pickSpanishVoice<V extends Pick<SpeechSynthesisVoice, 'name' | 'lang'>>(voices: readonly V[]): V | null {
  let best: V | null = null
  let bestScore = -1
  for (const voice of voices) {
    const score = voiceScore(voice)
    if (score > bestScore) {
      best = voice
      bestScore = score
    }
  }
  return best
}
