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
