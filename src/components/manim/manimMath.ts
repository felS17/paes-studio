/** Paleta de Manim. Es la única excepción a los tokens de tema: la pizarra se ve igual en todos los temas. */
export const MANIM = {
  bg: '#0f0f12',
  grid: '#26262c',
  axis: '#8c8c96',
  white: '#f1efe9',
  cyan: '#58c4dd',
  yellow: '#ffff00',
  green: '#83c167',
  coral: '#fc6255',
} as const

export const WIDTH = 640
export const HEIGHT = 360

export interface Point {
  x: number
  y: number
}

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

/** Avance de un tramo: 0 antes de `from`, 1 después de `to`. Así cada escena se describe como una línea de tiempo. */
export const span = (t: number, from: number, to: number) => clamp01((t - from) / (to - from))

export const ease = (p: number) => p * p * (3 - 2 * p)

export const pathOf = (points: readonly Point[], closed = false) =>
  points.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ') + (closed ? ' Z' : '')

/** Cifra en formato chileno y con signo menos tipográfico. */
export const fmt = (value: number, digits = 2) =>
  (Object.is(Math.round(value * 10 ** digits) / 10 ** digits, -0) ? 0 : value).toLocaleString('es-CL', { maximumFractionDigits: digits }).replace('-', '−')

/** Puntos de una elipse, para dibujar bases de cuerpos en perspectiva y círculos con `Stroke`. */
export function ellipse(cx: number, cy: number, rx: number, ry: number, from = 0, to = 360): Point[] {
  const points: Point[] = []
  const step = (to - from) / 60
  for (let i = 0; i <= 60; i++) {
    const a = ((from + i * step) * Math.PI) / 180
    points.push({ x: cx + rx * Math.cos(a), y: cy - ry * Math.sin(a) })
  }
  return points
}

export const parseList = (value: string | number) => String(value).split(',').map(Number)

/** Cuartiles por mediana de las mitades, la regla habitual en la PAES. */
export function quartiles(sorted: readonly number[]) {
  const median = (list: readonly number[]) => {
    const mid = Math.floor(list.length / 2)
    return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2
  }
  const half = Math.floor(sorted.length / 2)
  return { q1: median(sorted.slice(0, half)), q2: median(sorted), q3: median(sorted.slice(sorted.length - half)) }
}

export interface Frac {
  n: number
  d: number
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a) || 1)

export const frac = (n: number, d: number): Frac => {
  const g = gcd(n, d) * Math.sign(d || 1)
  return { n: n / g, d: d / g }
}

/** Lee `3/5` o `0.25` como fracción exacta, para que la pizarra muestre las mismas cifras que el enunciado. */
export function parseFrac(value: string | number): Frac {
  const [n, d] = String(value).split('/').map(Number)
  if (d) return frac(n, d)
  const scale = 10 ** (String(value).split('.')[1]?.length ?? 0)
  return frac(Math.round(n * scale), scale)
}

export const fracMul = (a: Frac, b: Frac) => frac(a.n * b.n, a.d * b.d)
export const fracAdd = (a: Frac, b: Frac) => frac(a.n * b.d + b.n * a.d, a.d * b.d)
export const fracSub = (a: Frac, b: Frac) => frac(a.n * b.d - b.n * a.d, a.d * b.d)
export const fracDiv = (a: Frac, b: Frac) => frac(a.n * b.d, a.d * b.n)
export const fracValue = (a: Frac) => a.n / a.d
export const fracLabel = (a: Frac) => (a.d === 1 ? fmt(a.n) : `${fmt(a.n)}/${fmt(a.d)}`)
