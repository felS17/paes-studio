import { ease, fmt, HEIGHT, MANIM, pathOf, span, WIDTH, type Point } from './manimMath'
import { Guide, Label, Mark, Plane, Readout, Stroke, Ticks } from './primitives'
import type { SceneProps } from './sceneProps'

const CX = 320
const CY = 200
const UNIT = 30

const toScreen = (x: number, y: number): Point => ({ x: CX + x * UNIT, y: CY - y * UNIT })

/** Muestra una función en el rango visible; corta el trazo donde se sale de la pizarra. */
function curve(f: (x: number) => number, from = -10.5, to = 10.5): string {
  const points: Point[] = []
  for (let i = 0; i <= 160; i++) {
    const x = from + ((to - from) * i) / 160
    const y = f(x)
    if (Number.isFinite(y) && Math.abs(y) < 12) points.push(toScreen(x, y))
  }
  return pathOf(points)
}

const signed = (value: number) => (value < 0 ? ` − ${fmt(-value)}` : ` + ${fmt(value)}`)

/** Función afín: n es el corte con el eje y; m, cuánto sube la recta por cada unidad que avanza. */
function AffineView({ t, v }: SceneProps) {
  const m = Number(v.m)
  const n = 1
  const start = toScreen(0, n)
  const run = toScreen(1, n)
  const rise = toScreen(1, n + m)
  const final = span(t, 0.82, 1)
  return (
    <>
      <Plane cx={CX} cy={CY} unit={UNIT} p={span(t, 0, 0.12)} />
      <Ticks cx={CX} cy={CY} unit={UNIT} p={span(t, 0.05, 0.15)} />
      <Mark x={start.x} y={start.y} color={MANIM.yellow} p={span(t, 0.15, 0.25)} r={5} />
      <Label x={start.x - 14} y={start.y - 10} color={MANIM.yellow} p={span(t, 0.18, 0.28)} anchor="end" size={16} italic={false}>{`n = ${fmt(n)}`}</Label>
      <Stroke d={pathOf([start, run])} color={MANIM.green} p={span(t, 0.3, 0.42)} />
      <Stroke d={pathOf([run, rise])} color={MANIM.green} p={span(t, 0.42, 0.54)} />
      <Label x={(start.x + run.x) / 2} y={start.y + (m >= 0 ? 18 : -8)} color={MANIM.green} p={span(t, 0.4, 0.5)} size={15} italic={false}>1</Label>
      <Label x={run.x + 10} y={(run.y + rise.y) / 2 + 5} color={MANIM.green} p={span(t, 0.5, 0.6)} anchor="start" size={15} italic={false}>{`m = ${fmt(m)}`}</Label>
      <Stroke d={curve((x) => m * x + n)} color={MANIM.cyan} p={ease(span(t, 0.56, 0.82))} width={3} />
      <Readout x={18} y={28} p={final} lines={[
        { text: `f(x) = ${fmt(m)}x${signed(n)}`, color: MANIM.cyan },
        { text: m > 0 ? 'm > 0: la recta sube' : m < 0 ? 'm < 0: la recta baja' : 'm = 0: recta horizontal', color: MANIM.green },
        { text: 'n: corte con el eje y', color: MANIM.yellow },
      ]} />
    </>
  )
}

const QUADRATICS = {
  dos: { a: 1, b: -2, c: -3 },
  una: { a: 1, b: -2, c: 1 },
  ninguna: { a: 1, b: -2, c: 3 },
  abajo: { a: -1, b: 2, c: 3 },
} as const

/** Función cuadrática: concavidad, eje de simetría, vértice y cortes con el eje x según el discriminante. */
function QuadraticView({ t, v }: SceneProps) {
  const { a, b, c } = QUADRATICS[(String(v.caso) as keyof typeof QUADRATICS)] ?? QUADRATICS.dos
  const delta = b * b - 4 * a * c
  const xv = -b / (2 * a)
  const yv = a * xv * xv + b * xv + c
  const vertex = toScreen(xv, yv)
  const roots = delta > 0 ? [(-b - Math.sqrt(delta)) / (2 * a), (-b + Math.sqrt(delta)) / (2 * a)] : delta === 0 ? [xv] : []
  const final = span(t, 0.84, 1)
  const formula = `f(x) = ${a === -1 ? '−' : ''}x²${signed(b)}x${signed(c)}`
  return (
    <>
      <Plane cx={CX} cy={CY} unit={UNIT} p={span(t, 0, 0.12)} />
      <Ticks cx={CX} cy={CY} unit={UNIT} p={span(t, 0.05, 0.15)} />
      <Stroke d={curve((x) => a * x * x + b * x + c)} color={MANIM.cyan} p={ease(span(t, 0.12, 0.45))} width={3} />
      <Guide x1={vertex.x} y1={12} x2={vertex.x} y2={HEIGHT - 12} color={MANIM.axis} p={span(t, 0.45, 0.55)} />
      <Mark x={vertex.x} y={vertex.y} color={MANIM.yellow} p={span(t, 0.55, 0.62)} r={5} />
      <Label x={vertex.x + 12} y={vertex.y + (a > 0 ? 22 : -12)} color={MANIM.yellow} p={span(t, 0.58, 0.66)} anchor="start" size={15} italic={false}>{`V(${fmt(xv)}, ${fmt(yv)})`}</Label>
      {roots.map((r, i) => {
        const point = toScreen(r, 0)
        return <Mark key={i} x={point.x} y={point.y} color={MANIM.green} p={span(t, 0.66 + i * 0.06, 0.72 + i * 0.06)} r={5} />
      })}
      <Readout x={18} y={28} p={final} lines={[
        { text: formula, color: MANIM.cyan },
        { text: `Δ = b² − 4ac = ${fmt(delta)}`, color: MANIM.green },
        { text: delta > 0 ? 'Δ > 0: corta dos veces el eje x' : delta === 0 ? 'Δ = 0: toca el eje x una vez' : 'Δ < 0: no corta el eje x', color: MANIM.green },
        { text: a > 0 ? 'a > 0: abre hacia arriba' : 'a < 0: abre hacia abajo', color: MANIM.white },
      ]} />
    </>
  )
}

/** Exponencial f(x) = a · bˣ: crece si b > 1 y decrece si 0 < b < 1; siempre corta el eje y en a. */
function ExponentialView({ t, v }: SceneProps) {
  const base = Number(v.base) || 2
  const a = 1
  const cut = toScreen(0, a)
  const final = span(t, 0.82, 1)
  return (
    <>
      <Plane cx={CX} cy={CY} unit={UNIT} p={span(t, 0, 0.12)} />
      <Ticks cx={CX} cy={CY} unit={UNIT} p={span(t, 0.05, 0.15)} />
      <Stroke d={curve((x) => a * base ** x)} color={MANIM.cyan} p={ease(span(t, 0.15, 0.6))} width={3} />
      <Mark x={cut.x} y={cut.y} color={MANIM.yellow} p={span(t, 0.6, 0.68)} r={5} />
      <Label x={cut.x + 10} y={cut.y - 10} color={MANIM.yellow} p={span(t, 0.62, 0.7)} anchor="start" size={15} italic={false}>(0, 1)</Label>
      <Guide x1={0} y1={CY - 2} x2={WIDTH} y2={CY - 2} color={MANIM.coral} p={span(t, 0.7, 0.8)} />
      <Readout x={18} y={28} p={final} lines={[
        { text: `f(x) = ${base < 1 ? '(1/2)' : fmt(base)}ˣ`, color: MANIM.cyan },
        { text: base > 1 ? 'b > 1: crece' : '0 < b < 1: decrece', color: MANIM.green },
        { text: 'nunca toca el eje x', color: MANIM.coral },
      ]} />
    </>
  )
}

/** Inversa: la gráfica de f⁻¹ es el reflejo de la de f respecto de la recta y = x. */
function InverseView({ t, v }: SceneProps) {
  void v
  const f = (x: number) => 2 * x + 3
  const inverse = (x: number) => (x - 3) / 2
  const sample = { x: -1, y: f(-1) }
  const p = toScreen(sample.x, sample.y)
  const q = toScreen(sample.y, sample.x)
  const final = span(t, 0.84, 1)
  return (
    <>
      <Plane cx={CX} cy={CY} unit={UNIT} p={span(t, 0, 0.12)} />
      <Ticks cx={CX} cy={CY} unit={UNIT} p={span(t, 0.05, 0.15)} />
      <Stroke d={curve((x) => x)} color={MANIM.axis} p={span(t, 0.12, 0.3)} width={1.6} />
      <Stroke d={curve(f)} color={MANIM.cyan} p={ease(span(t, 0.25, 0.48))} width={3} />
      <Mark x={p.x} y={p.y} color={MANIM.cyan} p={span(t, 0.48, 0.55)} />
      <Guide x1={p.x} y1={p.y} x2={q.x} y2={q.y} color={MANIM.yellow} p={span(t, 0.55, 0.65)} />
      <Mark x={q.x} y={q.y} color={MANIM.yellow} p={span(t, 0.62, 0.68)} />
      <Label x={p.x - 10} y={p.y - 8} color={MANIM.cyan} p={span(t, 0.5, 0.58)} anchor="end" size={14} italic={false}>{`(${fmt(sample.x)}, ${fmt(sample.y)})`}</Label>
      <Label x={q.x + 8} y={q.y + 18} color={MANIM.yellow} p={span(t, 0.64, 0.7)} anchor="start" size={14} italic={false}>{`(${fmt(sample.y)}, ${fmt(sample.x)})`}</Label>
      <Stroke d={curve(inverse)} color={MANIM.yellow} p={ease(span(t, 0.66, 0.86))} width={3} />
      <Readout x={18} y={28} p={final} lines={[
        { text: 'f(x) = 2x + 3', color: MANIM.cyan },
        { text: 'f⁻¹(x) = (x − 3) / 2', color: MANIM.yellow },
        { text: 'reflejo respecto de y = x', color: MANIM.axis },
      ]} />
    </>
  )
}

export function FunctionsScene(props: SceneProps) {
  switch (props.v.modo) {
    case 'cuadratica':
      return <QuadraticView {...props} />
    case 'exponencial':
      return <ExponentialView {...props} />
    case 'inversa':
      return <InverseView {...props} />
    default:
      return <AffineView {...props} />
  }
}
