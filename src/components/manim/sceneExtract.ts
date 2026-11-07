import type { Question } from '@/types/exam'

/**
 * Lee cifras del enunciado y de la solución para que la pizarra muestre el ejercicio real. Es deliberadamente conservador:
 * cada extractor elige la modalidad por palabras clave y solo marca `complete` si encontró datos que tienen sentido. Si
 * no, la escena usa sus valores de ejemplo y la interfaz lo dice: es mejor un ejemplo honesto que una cifra equivocada.
 */

export interface Extraction {
  values: Record<string, string | number>
  complete: boolean
  /** Otra escena distinta de la del subtema: un mismo tema del temario puede tratar de vectores o de rectas. */
  scene?: 'vectores'
}

const NUM = '-?\\d+(?:[.,]\\d+)?'

/** Sin tildes, en minúsculas y sin los adornos de LaTeX que separan una cifra de su nombre. */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\\left|\\right|\\,|\\;|\\!|\\ |\$|\*\*/g, '')
    .replace(/\{,\}/g, ',')
    .replace(/\\dfrac|\\tfrac/g, '\\frac')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/−/g, '-')
    .replace(/\s+/g, ' ')
}

export const questionText = (question: Pick<Question, 'stem' | 'explanation'>) =>
  normalize([question.stem, question.explanation?.planteamiento, ...(question.explanation?.steps ?? [])].filter(Boolean).join(' \n '))

const toNumber = (text: string) => Number(text.replace(',', '.'))

/** La primera cifra que acompaña a un nombre: «radio de 5», «r = 5», «altura mide 12». */
function measure(text: string, names: string, limit = 1000): number | null {
  const match = text.match(new RegExp(`(?:^|[^a-z])(?:${names})\\s*(?:de|mide|miden|es|igual a|=|:)?\\s*(?:de\\s*)?(?:[a-z]\\s*=\\s*)?(${NUM})`))
  if (!match) return null
  const value = toNumber(match[1])
  return value > 0 && value <= limit ? value : null
}

/** Pares de coordenadas enteras. Solo enteras: `(1,5)` podría ser un decimal chileno y no un punto. */
function pairs(text: string, limit = 40): string[] {
  const found: string[] = []
  for (const m of text.matchAll(/\(\s*(-?\d+)\s*[,;]\s*(-?\d+)\s*\)/g)) {
    if (Math.abs(Number(m[1])) <= limit && Math.abs(Number(m[2])) <= limit) found.push(`${m[1]},${m[2]}`)
  }
  return found
}

const FRAC = '\\\\frac\\{(\\d+)\\}\\{(\\d+)\\}'

/** Una probabilidad escrita tras un nombre: `p(a) = \frac{3}{5}` o `p(a) = 0,4`. */
function probability(text: string, name: string): string | null {
  const match = text.match(new RegExp(`${name}\\s*=\\s*(?:${FRAC}|(0[.,]\\d+))`))
  if (!match) return null
  if (match[1]) return Number(match[1]) > 0 && Number(match[1]) < Number(match[2]) ? `${match[1]}/${match[2]}` : null
  return match[3].replace(',', '.')
}

function ratioValue(raw: string): number | null {
  const frac = raw.match(/(-?)\\frac\{(\d+)\}\{(\d+)\}/)
  if (frac) return (frac[1] ? -1 : 1) * (Number(frac[2]) / Number(frac[3]))
  const plain = raw.match(new RegExp(NUM))
  return plain ? toNumber(plain[0]) : null
}

function numberList(text: string): number[] | null {
  // Solo tras una palabra que anuncie datos: una serie suelta podría ser otra cosa, como una tabla de frecuencias.
  const match = text.match(/(?:datos|valores|muestra|notas|conjunto|edades|puntajes)[^\d]{0,40}(\d{1,4}(?:\s*(?:,|;|\by\b)\s*\d{1,4}){4,24})(?!\d)/)
  return match ? match[1].split(/\s*(?:,|;|\by\b)\s*/).map(Number) : null
}

function areas(text: string): Extraction {
  const r = measure(text, 'radio|r') ?? (measure(text, 'diametro') ? (measure(text, 'diametro') as number) / 2 : null)
  const h = measure(text, 'altura|h')
  if (/cilindr/.test(text)) return { values: { forma: 'cilindro', ...(r && { r }), ...(h && { h }) }, complete: Boolean(r && h) }
  if (/\bcono/.test(text)) return { values: { forma: 'cono', ...(r && { r }), ...(h && { h }) }, complete: Boolean(r && h) }
  if (/esfera/.test(text)) return { values: { forma: 'esfera', ...(r && { r }) }, complete: Boolean(r) }
  // Las medidas se aceptan como `V = a · b · c`: un producto suelto de tres cifras también puede ser el área de una cara por 2.
  const box = text.match(/\bv(?:_\{?\d\}?)?\s*=\s*(\d+(?:[.,]\d+)?)\s*(?:\\cdot|·|\\times|×)\s*(\d+(?:[.,]\d+)?)\s*(?:\\cdot|·|\\times|×)\s*(\d+(?:[.,]\d+)?)(?![\d.,]*\s*[a-z{\\^])/)
  if (/prisma|paralelepipedo|ortoedro|\bcubo|\bcaja|volumen/.test(text)) {
    if (box) return { values: { forma: 'prisma', a: toNumber(box[1]), b: toNumber(box[2]), h: toNumber(box[3]) }, complete: true }
    const side = measure(text, 'arista|lado')
    if (/\bcubo/.test(text) && side) return { values: { forma: 'prisma', a: side, b: side, h: side }, complete: true }
    return { values: { forma: 'prisma' }, complete: false }
  }
  if (/circulo|circunferencia|diametro|\bradio|sector/.test(text)) {
    const angle = text.match(/(\d{2,3})\s*(?:\^\{?\\circ\}?|°)/)?.[1]
    return { values: { forma: 'circulo', ...(r && { r }), ...(angle && Number(angle) < 360 && { angulo: Number(angle) }) }, complete: Boolean(r) }
  }
  const base = measure(text, 'base|b')
  if (/triangul/.test(text)) return { values: { forma: 'triangulo', ...(base && { a: base }), ...(h && { h }) }, complete: Boolean(base && h) }
  if (/sombread|achurad|compuest/.test(text)) return { values: { forma: 'compuesta' }, complete: false }
  const a = measure(text, 'largo|base')
  const b = measure(text, 'ancho|altura')
  // «cuadrado de lado 2», en singular: «cuadrados de lado 2» suele describir una malla, no la figura pedida.
  const square = text.match(/cuadrado de lado\s*(?:=\s*)?(\d+(?:[.,]\d+)?)/)
  if (a && b) return { values: { forma: 'rectangulo', a, b }, complete: true }
  if (square) return { values: { forma: 'rectangulo', a: toNumber(square[1]), b: toNumber(square[1]) }, complete: true }
  return { values: { forma: 'rectangulo' }, complete: false }
}

function triangles(text: string): Extraction {
  const proportion = text.match(/\\frac\{([\dx.,]+)\}\{([\dx.,]+)\}\s*=\s*\\frac\{([\dx.,]+)\}\{([\dx.,]+)\}/)
  if (/thales|tales|paralel|semejan|proporcion/.test(text)) {
    if (proportion) {
      const terms = proportion.slice(1, 5).map((term) => (term === 'x' ? null : toNumber(term)))
      const unknown = terms.indexOf(null)
      const known = terms.filter((term) => term !== null) as number[]
      if (known.every((term) => term > 0 && term < 1000)) {
        // a/b = c/d: la incógnita, si la hay, se despeja para poder dibujar el segmento.
        if (unknown === -1 && known[0] * known[3] === known[1] * known[2]) {
          return { values: { modo: 'thales', a: known[0], b: known[1], c: known[2], d: known[3] }, complete: true }
        }
        if (unknown >= 0 && known.length === 3) {
          const [a, b, c, d] = terms
          const solved = [a ?? (b as number) * (c as number) / (d as number), b ?? (a as number) * (d as number) / (c as number), c ?? (a as number) * (d as number) / (b as number), d ?? (b as number) * (c as number) / (a as number)]
          return { values: { modo: 'thales', a: solved[0], b: solved[1], c: solved[2], d: solved[3] }, complete: true }
        }
      }
    }
    return { values: { modo: 'thales' }, complete: false }
  }
  const squares = text.match(/(\d+(?:[.,]\d+)?)\^\{?2\}?\s*\+\s*(\d+(?:[.,]\d+)?)\^\{?2\}?/)
  if (squares && toNumber(squares[1]) > 0 && toNumber(squares[2]) > 0) {
    return { values: { modo: 'pitagoras', catetos: `${toNumber(squares[1])}-${toNumber(squares[2])}` }, complete: true }
  }
  return { values: { modo: 'pitagoras' }, complete: false }
}

function transformations(text: string): Extraction {
  const points = pairs(text)
  const P = points[0]
  const withPoint: Record<string, string> = P ? { p: P } : {}
  if (/rota|gira|giro/.test(text)) {
    const raw = text.match(/(-?\d{2,3})\s*(?:\^\{?\\circ\}?|°)/)?.[1]
    const clockwise = /horario/.test(text) && !/antihorario/.test(text)
    const deg = raw ? ((clockwise ? -Number(raw) : Number(raw)) + 360) % 360 : null
    const valid = deg === 90 || deg === 180 || deg === 270
    return { values: { modo: 'rotacion', ...withPoint, ...(valid && { giro: String(deg) }) }, complete: Boolean(P && valid) }
  }
  if (/refle|simetri/.test(text)) {
    const eje = /eje\s*(?:de las\s*)?(?:x|abscisas)/.test(text) ? 'x' : /eje\s*(?:de las\s*)?(?:y|ordenadas)/.test(text) ? 'y' : /central|origen/.test(text) ? 'origen' : null
    return { values: { modo: 'reflexion', ...withPoint, ...(eje && { eje }) }, complete: Boolean(P && eje) }
  }
  if (/trasla/.test(text)) {
    const vector = text.match(/(?:vector[^()]{0,30}|t\s*)\(\s*(-?\d+)\s*[,;]\s*(-?\d+)\s*\)/)
    const t = vector ? `${vector[1]},${vector[2]}` : null
    const point = points.find((candidate) => candidate !== t)
    return { values: { modo: 'traslacion', ...(point && { p: point }), ...(t && { t }) }, complete: Boolean(point && t) }
  }
  if (/vector/.test(text) && points.length >= 2) {
    const subtract = /resta|\\vec\{?[a-z]\}?\s*-\s*\\vec/.test(text)
    return { values: { modo: subtract ? 'resta' : 'suma', u: points[0], w: points[1] }, complete: true }
  }
  // Un par suelto puede ser una alternativa: como punto solo vale si el texto lo nombra.
  const named = text.match(/(?:punto|\bp)\s*[a-z]?\s*(?:=\s*)?\(\s*(-?\d+)\s*[,;]\s*(-?\d+)\s*\)/)
  return named ? { values: { modo: 'plano', p: `${named[1]},${named[2]}` }, complete: true } : { values: { modo: 'plano' }, complete: false }
}

function position(text: string): Extraction {
  const quartile = (i: number) => {
    const m = text.match(new RegExp(`q_\\{?${i}\\}?\\s*=\\s*(${NUM})`))
    return m ? toNumber(m[1]) : null
  }
  const [q1, q2, q3] = [quartile(1), quartile(2), quartile(3)]
  if (q1 !== null && q3 !== null && q1 < q3) {
    const median = q2 !== null && q2 >= q1 && q2 <= q3 ? q2 : (q1 + q3) / 2
    return { values: { datos: '', q1, q2: median, q3 }, complete: q2 !== null }
  }
  const list = numberList(text)
  if (list && list.length >= 5) return { values: { datos: list.join(',') }, complete: true }
  return { values: {}, complete: false }
}

function probabilities(text: string): Extraction {
  const anyFrac = [...text.matchAll(new RegExp(FRAC, 'g'))].map((m) => [Number(m[1]), Number(m[2])])
  if (/\\cup|\\cap|union|interseccion|ambos|ambas/.test(text)) {
    const pa = probability(text, 'p\\(a\\)')
    const pb = probability(text, 'p\\(b\\)')
    const both = probability(text, 'p\\(a\\s*\\\\cap\\s*b\\)')
    if (pa && pb && both) {
      const [[an, ad], [bn, bd], [cn, cd]] = [pa, pb, both].map((f) => f.split('/').map(Number))
      if (ad === bd && bd === cd && Number.isInteger(an) && cn <= Math.min(an, bn) && an + bn - cn <= ad) {
        return { values: { modo: 'venn', a: an, b: bn, ambos: cn, total: ad }, complete: true }
      }
    }
    return { values: { modo: 'venn' }, complete: false }
  }
  const times = '\\s*(?:\\\\cdot|·|\\\\times)\\s*'
  // Un árbol de más de dos etapas no cabe en esta escena: se muestra el concepto con valores de ejemplo.
  if (new RegExp(`${FRAC}${times}${FRAC}${times}${FRAC}`).test(text)) return { values: { modo: 'arbol' }, complete: false }
  const product = text.match(new RegExp(`${FRAC}${times}${FRAC}`))
  if (product && Number(product[1]) < Number(product[2]) && Number(product[3]) < Number(product[4])) {
    return { values: { modo: 'arbol', pa: `${product[1]}/${product[2]}`, pba: `${product[3]}/${product[4]}`, pbna: '' }, complete: true }
  }
  if (/sin reposicion|sin reemplazo|con reposicion|con reemplazo|dos veces|consecutiv/.test(text)) return { values: { modo: 'arbol' }, complete: false }
  const usable = anyFrac.filter(([n, d]) => n > 0 && n <= d && d <= 60)
  const last = usable.at(-1)
  if (last) {
    // La respuesta suele quedar simplificada: si antes aparece sin simplificar, esa fracción sí trae los casos reales.
    const [favorables, casos] = usable.filter(([n, d]) => n * last[1] === last[0] * d).sort((x, y) => y[1] - x[1])[0]
    return { values: { modo: 'laplace', favorables, casos }, complete: true }
  }
  return { values: { modo: 'laplace' }, complete: false }
}

function line(text: string): Extraction {
  // Este tema del temario también reúne preguntas de vectores: esos pares no son dos puntos de una recta.
  if (!/pendiente/.test(text) && /\\vec|vector|trasla/.test(text)) return { ...transformations(text), scene: 'vectores' }
  const modo = /perpendicular/.test(text) ? 'perpendiculares' : /paralel/.test(text) ? 'paralelas' : 'pendiente'
  const points = [...new Set(pairs(text, 20))]
  const second = points.find((point) => points[0] && point.split(',')[0] !== points[0].split(',')[0])
  if (points[0] && second) return { values: { modo, a: points[0], b: second }, complete: true }
  return { values: { modo }, complete: false }
}

function homothety(text: string): Extraction {
  // Solo el valor escrito de forma explícita, y el último: las primeras líneas de una solución pueden ser un tanteo.
  const matches = [...text.matchAll(new RegExp(`(?:\\bk\\s*=|razon de homotecia\\s*(?:es|=|igual a))\\s*(-?\\s*\\\\frac\\{\\d+\\}\\{\\d+\\}|${NUM})`, 'g'))]
  // Lo que se prueba al descartar una alternativa («si p = 2, entonces k = −1») no es el dato de la pregunta.
  const stated = matches.filter((m) => !/alternativa|\bsi\b/.test(text.slice(Math.max(0, m.index - 45), m.index)))
  const k = stated.length ? ratioValue((stated.at(-1) as RegExpMatchArray)[1].replace(/\s/g, '')) : null
  if (k !== null && k !== 0 && k !== 1 && Math.abs(k) <= 6) return { values: { k: String(k) }, complete: true }
  return { values: {}, complete: false }
}

function trigonometry(text: string): Extraction {
  const angleMatch = text.match(/(\d{1,3})\s*(?:\^\{?\\circ\}?|°)/)
  const alfa = angleMatch && Number(angleMatch[1]) > 0 && Number(angleMatch[1]) < 360 ? Number(angleMatch[1]) : null
  if (/cuerda|\barco/.test(text)) return { values: { modo: 'cuerda', ...(alfa && { alfa }) }, complete: Boolean(alfa) }
  if (/circunferencia unitaria|circulo unitario/.test(text)) return { values: { modo: 'unitaria', ...(alfa && { alfa }) }, complete: Boolean(alfa) }
  const ratio = text.match(new RegExp(`\\\\(sin|sen|cos|tan)\\s*(?:\\([^)]*\\)|[a-z\\\\]*)\\s*=\\s*${FRAC}`))
  if (ratio) {
    const [top, bottom] = [Number(ratio[2]), Number(ratio[3])]
    if (ratio[1] === 'tan' && top > 0 && bottom > 0) return { values: { modo: 'triangulo', op: top, ady: bottom }, complete: true }
    if (top > 0 && top < bottom) {
      const other = Math.sqrt(bottom * bottom - top * top)
      return { values: { modo: 'triangulo', ...(ratio[1] === 'cos' ? { ady: top, op: other } : { op: top, ady: other }) }, complete: true }
    }
  }
  if (alfa && alfa < 90) return { values: { modo: 'triangulo', alfa, op: 0, ady: 0 }, complete: true }
  return { values: { modo: 'triangulo' }, complete: false }
}

function dispersion(text: string): Extraction {
  const list = numberList(text)
  return list && new Set(list).size > 1 ? { values: { datos: list.join(',') }, complete: true } : { values: {}, complete: false }
}

function conditional(text: string): Extraction {
  if (/binomial|bernoulli|\\binom/.test(text)) {
    const binom = text.match(/\\binom\{(\d+)\}\{(\d+)\}/)
    const n = Number(binom?.[1] ?? text.match(/\bn\s*=\s*(\d+)/)?.[1] ?? 0)
    const k = binom?.[2] ?? text.match(/x\s*=\s*(\d+)/)?.[1] ?? ''
    const p = probability(text, '\\bp')
    const validN = n >= 1 && n <= 14
    return {
      values: { modo: 'binomial', ...(validN && { n: String(n) }), ...(p && { p }), ...(validN && k !== '' && Number(k) <= n && { k }) },
      complete: Boolean(validN && p),
    }
  }
  const pa = probability(text, 'p\\(a\\)')
  const pba = probability(text, 'p\\(b\\s*\\|\\s*a\\)')
  const pbna = probability(text, 'p\\(b\\s*\\|\\s*(?:\\\\bar\\{a\\}|a\\^c|a\\^\\{c\\}|\\\\overline\\{a\\}|no a)\\)')
  // El árbol necesita sus tres datos: mezclar cifras reales con las del ejemplo daría un resultado que no es de nadie.
  return pa && pba && pbna ? { values: { modo: 'arbol', pa, pba, pbna }, complete: true } : { values: { modo: 'arbol' }, complete: false }
}

function counting(text: string): Extraction {
  const by = '\\s*(?:\\\\cdot|·|\\\\times|×)\\s*'
  // Exactamente dos etapas: de `6 · 8 · 12` el árbol solo mostraría una parte.
  const product = text.match(new RegExp(`(?<![\\d}!]\\s*(?:\\\\cdot|·|\\\\times|×)\\s*)(?<!\\d)(\\d)${by}(\\d)(?!\\d)(?!${by})`))
  if (product && Number(product[1]) >= 2 && Number(product[2]) >= 2) return { values: { modo: 'conteo', a: Number(product[1]), b: Number(product[2]) }, complete: true }
  return { values: { modo: 'conteo' }, complete: false }
}

export const EXTRACTORS: Record<string, (text: string) => Extraction> = {
  'm1-areas': areas,
  'm1-triangulos': triangles,
  'm1-transformaciones': transformations,
  'm1-posicion': position,
  'm1-probabilidad': probabilities,
  'm2-analitica': line,
  'm2-homotecia': homothety,
  'm2-trigonometria': trigonometry,
  'm2-dispersion': dispersion,
  'm2-condicional': conditional,
  'm2-combinatoria': counting,
}
