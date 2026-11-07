import { ease, fmt, frac, fracAdd, fracDiv, fracLabel, fracMul, fracSub, fracValue, HEIGHT, MANIM, parseFrac, parseList, pathOf, quartiles, span, type Frac, type Point } from './manimMath'
import { Guide, Label, Mark, Readout, Stroke } from './primitives'
import type { SceneProps } from './sceneProps'

const sortedList = (value: string | number) => parseList(value).sort((a, b) => a - b)

/** Diagrama de cajón: se construye desde los datos hasta el rango intercuartílico. */
export function BoxplotScene({ t, v }: SceneProps) {
  const data = v.datos ? sortedList(v.datos) : []
  const computed = data.length >= 4 ? quartiles(data) : null
  const q1 = Number(v.q1) || computed?.q1 || 0
  const q2 = Number(v.q2) || computed?.q2 || 0
  const q3 = Number(v.q3) || computed?.q3 || 0
  const min = data[0] ?? (Number(v.min) || q1 - (q3 - q1))
  const max = data[data.length - 1] ?? (Number(v.max) || q3 + (q3 - q1))
  const toX = (x: number) => 50 + ((x - min) / (max - min || 1)) * 540
  const axisY = 300
  const mid = 165
  const half = 38
  const boxP = ease(span(t, 0.62, 0.74))
  const whisker = span(t, 0.74, 0.84)
  const final = span(t, 0.84, 1)
  const seen = new Map<number, number>()
  const dots = data.map((x) => {
    const row = seen.get(x) ?? 0
    seen.set(x, row + 1)
    return { x, row }
  })
  const quarter = (a: number, b: number, key: string) => <Label key={key} x={(toX(a) + toX(b)) / 2} y={mid - half - 12} color={MANIM.axis} p={final} size={13} italic={false}>25 %</Label>
  return (
    <>
      <Stroke d={`M 30 ${axisY} L 610 ${axisY}`} color={MANIM.axis} p={span(t, 0, 0.1)} width={1.6} />
      {dots.map((dot, i) => <Mark key={i} x={toX(dot.x)} y={axisY - 10 - dot.row * 10} color={MANIM.white} r={3.5} p={span(t, 0.08 + (i / dots.length) * 0.2, 0.12 + (i / dots.length) * 0.2)} />)}
      {[min, max].map((x) => <Label key={x} x={toX(x)} y={axisY + 22} color={MANIM.axis} p={span(t, 0.05, 0.12)} size={15} italic={false}>{fmt(x)}</Label>)}

      {boxP > 0 && <rect x={toX(q1)} y={mid - half} width={(toX(q3) - toX(q1)) * boxP} height={half * 2} fill={MANIM.cyan} fillOpacity={0.18} stroke={MANIM.cyan} strokeWidth={2.5} />}
      <Stroke d={pathOf([{ x: toX(min), y: mid }, { x: toX(q1), y: mid }])} color={MANIM.white} p={whisker} />
      <Stroke d={pathOf([{ x: toX(q3), y: mid }, { x: toX(max), y: mid }])} color={MANIM.white} p={whisker} />
      <Stroke d={pathOf([{ x: toX(min), y: mid - 14 }, { x: toX(min), y: mid + 14 }])} color={MANIM.white} p={whisker} />
      <Stroke d={pathOf([{ x: toX(max), y: mid - 14 }, { x: toX(max), y: mid + 14 }])} color={MANIM.white} p={whisker} />

      <Stroke d={pathOf([{ x: toX(q2), y: mid - half }, { x: toX(q2), y: axisY }])} color={MANIM.yellow} p={span(t, 0.3, 0.42)} width={3} />
      <Guide x1={toX(q1)} y1={mid - half} x2={toX(q1)} y2={axisY} color={MANIM.cyan} p={span(t, 0.42, 0.52)} />
      <Guide x1={toX(q3)} y1={mid - half} x2={toX(q3)} y2={axisY} color={MANIM.cyan} p={span(t, 0.52, 0.62)} />
      <Label x={toX(q2)} y={axisY + 42} color={MANIM.yellow} p={span(t, 0.36, 0.42)} size={16} italic={false}>{`Q₂ = ${fmt(q2)}`}</Label>
      <Label x={toX(q1)} y={axisY + 42} color={MANIM.cyan} p={span(t, 0.46, 0.52)} size={16} italic={false}>{`Q₁ = ${fmt(q1)}`}</Label>
      <Label x={toX(q3)} y={axisY + 42} color={MANIM.cyan} p={span(t, 0.56, 0.62)} size={16} italic={false}>{`Q₃ = ${fmt(q3)}`}</Label>
      {[quarter(min, q1, 'a'), quarter(q1, q2, 'b'), quarter(q2, q3, 'c'), quarter(q3, max, 'd')]}
      <Readout x={22} y={30} p={final} lines={[{ text: `rango intercuartílico = Q₃ − Q₁ = ${fmt(q3 - q1)}`, color: MANIM.green }, { text: `rango = ${fmt(max - min)}`, color: MANIM.axis }]} />
    </>
  )
}

const statsOf = (data: readonly number[]) => {
  const mean = data.reduce((s, x) => s + x, 0) / data.length
  const variance = data.reduce((s, x) => s + (x - mean) ** 2, 0) / data.length
  return { mean, variance, sd: Math.sqrt(variance) }
}

/** Dos grupos con la misma media: el de datos más lejanos tiene mayor varianza y desviación estándar. */
export function DispersionScene({ t, v }: SceneProps) {
  const first = sortedList(v.datos)
  const { mean, variance, sd } = statsOf(first)
  const spread = first.map((x) => mean + (x - mean) * 2)
  const second = statsOf(spread)
  const low = Math.min(...spread)
  const high = Math.max(...spread)
  const toX = (x: number) => 40 + ((x - low) / (high - low || 1)) * 400
  const rows = [
    { name: 'A', y: 125, data: first, stats: { mean, variance, sd }, color: MANIM.cyan },
    { name: 'B', y: 275, data: spread, stats: second, color: MANIM.yellow },
  ]
  const meanP = span(t, 0.28, 0.4)
  const devP = span(t, 0.4, 0.68)
  const band = span(t, 0.68, 0.84)
  const final = span(t, 0.84, 1)
  return (
    <>
      <Stroke d={pathOf([{ x: toX(mean), y: 40 }, { x: toX(mean), y: 318 }])} color={MANIM.white} p={meanP} width={2} />
      <Label x={toX(mean)} y={32} p={meanP} size={16} italic={false}>{`x̄ = ${fmt(mean)}`}</Label>
      {rows.map((row) => {
        const seen = new Map<number, number>()
        return (
          <g key={row.name}>
            <Stroke d={`M 24 ${row.y} L 456 ${row.y}`} color={MANIM.axis} p={span(t, 0, 0.1)} width={1.4} />
            <Label x={22} y={row.y - 22} anchor="start" color={row.color} p={span(t, 0, 0.1)} italic={false}>{row.name}</Label>
            {band > 0 && <rect x={toX(row.stats.mean - row.stats.sd)} y={row.y - 44} width={(toX(row.stats.mean + row.stats.sd) - toX(row.stats.mean - row.stats.sd)) * band} height={58} fill={row.color} fillOpacity={0.13} />}
            {row.data.map((x, i) => {
              const stack = seen.get(x) ?? 0
              seen.set(x, stack + 1)
              const y = row.y - 8 - stack * 11
              return (
                <g key={i}>
                  <Stroke d={pathOf([{ x: toX(x), y }, { x: toX(row.stats.mean), y }])} color={row.color} p={devP} width={1.4} />
                  <Mark x={toX(x)} y={y} color={row.color} r={4} p={span(t, 0.08 + (i / row.data.length) * 0.2, 0.12 + (i / row.data.length) * 0.2)} />
                </g>
              )
            })}
            <Label x={toX(row.data[0])} y={row.y + 22} color={MANIM.axis} p={span(t, 0.05, 0.12)} size={13} italic={false}>{fmt(row.data[0])}</Label>
            <Label x={toX(row.data[row.data.length - 1])} y={row.y + 22} color={MANIM.axis} p={span(t, 0.05, 0.12)} size={13} italic={false}>{fmt(row.data[row.data.length - 1])}</Label>
            <Readout x={475} y={row.y - 34} p={final} gap={24} lines={[
              { text: `${row.name}: σ² = ${fmt(row.stats.variance)}`, color: row.color },
              { text: `σ = ${fmt(row.stats.sd)}`, color: row.color },
            ]} />
          </g>
        )
      })}
      <Label x={320} y={HEIGHT - 10} p={final} size={16} italic={false}>misma media: la banda x̄ ± σ muestra cuál está más disperso</Label>
    </>
  )
}

/** Regla de Laplace: casos favorables sobre casos totales, punto por punto. */
function LaplaceView({ t, v }: SceneProps) {
  const n = Number(v.casos)
  const f = Number(v.favorables)
  const cols = Math.ceil(Math.sqrt(n * 1.8))
  const lines = Math.ceil(n / cols)
  const size = Math.min(320 / cols, 230 / lines)
  const final = span(t, 0.75, 1)
  const p = frac(f, n)
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const x = 50 + (i % cols) * size + size / 2
        const y = 70 + Math.floor(i / cols) * size + size / 2
        const appear = span(t, (i / n) * 0.35, (i / n) * 0.35 + 0.06)
        const favorable = i < f ? span(t, 0.42 + (i / Math.max(1, f)) * 0.26, 0.46 + (i / Math.max(1, f)) * 0.26) : 0
        return (
          <g key={i}>
            <Mark x={x} y={y} color={MANIM.axis} p={appear} r={Math.min(9, size * 0.32)} />
            {favorable > 0 && <Mark x={x} y={y} color={MANIM.yellow} p={favorable} r={Math.min(9, size * 0.32)} />}
          </g>
        )
      })}
      <Readout x={410} y={130} p={final} gap={32} lines={[
        { text: `casos favorables: ${fmt(f)}`, color: MANIM.yellow },
        { text: `casos totales: ${fmt(n)}`, color: MANIM.axis },
        { text: `P = ${fmt(f)}/${fmt(n)}${p.d === n ? '' : ` = ${fracLabel(p)}`} ≈ ${fmt((100 * f) / n, 1)} %`, color: MANIM.white },
      ]} />
    </>
  )
}

/** Unión de dos sucesos: se suman ambos y se resta una vez lo que está en los dos. */
function VennView({ t, v }: SceneProps) {
  const a = Number(v.a)
  const b = Number(v.b)
  const both = Number(v.ambos)
  const total = Number(v.total)
  const R = 92
  const [cx1, cx2, cy] = [175, 295, 180]
  const circle = (cx: number) => `M ${cx - R} ${cy} A ${R} ${R} 0 1 0 ${cx + R} ${cy} A ${R} ${R} 0 1 0 ${cx - R} ${cy} Z`
  const union = a + b - both
  const final = span(t, 0.8, 1)
  return (
    <>
      <Stroke d={pathOf([{ x: 40, y: 50 }, { x: 430, y: 50 }, { x: 430, y: 310 }, { x: 40, y: 310 }], true)} color={MANIM.axis} p={span(t, 0, 0.14)} width={1.4} />
      <Label x={414} y={298} anchor="end" color={MANIM.axis} p={span(t, 0.08, 0.14)} size={15} italic={false}>{`total ${fmt(total)}`}</Label>
      <Stroke d={circle(cx1)} color={MANIM.cyan} p={span(t, 0.14, 0.36)} fill />
      <Stroke d={circle(cx2)} color={MANIM.yellow} p={span(t, 0.36, 0.58)} fill />
      <Label x={cx1 - 45} y={cy + 6} color={MANIM.cyan} p={span(t, 0.28, 0.36)} size={22} italic={false}>{fmt(a - both)}</Label>
      <Label x={cx2 + 45} y={cy + 6} color={MANIM.yellow} p={span(t, 0.5, 0.58)} size={22} italic={false}>{fmt(b - both)}</Label>
      <Label x={(cx1 + cx2) / 2} y={cy + 6} color={MANIM.green} p={span(t, 0.58, 0.68)} size={22} italic={false}>{fmt(both)}</Label>
      <Label x={cx1 - 60} y={cy - R + 4} color={MANIM.cyan} p={span(t, 0.2, 0.3)} size={20}>A</Label>
      <Label x={cx2 + 60} y={cy - R + 4} color={MANIM.yellow} p={span(t, 0.42, 0.52)} size={20}>B</Label>
      <Readout x={452} y={118} p={final} gap={30} lines={[
        { text: `P(A) = ${fracLabel(frac(a, total))}`, color: MANIM.cyan },
        { text: `P(B) = ${fracLabel(frac(b, total))}`, color: MANIM.yellow },
        { text: `P(A ∩ B) = ${fracLabel(frac(both, total))}`, color: MANIM.green },
        { text: `P(A ∪ B) = ${fracLabel(frac(union, total))}` },
      ]} />
    </>
  )
}

/** Árbol de dos etapas. Con `conditional`, además invierte la condición: P(A|B). */
function ProbabilityTree({ t, v, conditional }: SceneProps & { conditional: boolean }) {
  const pa = parseFrac(v.pa)
  const pba = parseFrac(v.pba)
  // Sin este dato en el enunciado, la rama inferior se dibuja pero no se le inventa una cifra.
  const known = v.pbna !== ''
  const pbna = known ? parseFrac(v.pbna) : frac(1, 2)
  const na = fracSub(frac(1, 1), pa)
  const ab = fracMul(pa, pba)
  const nab = fracMul(na, pbna)
  const pb = fracAdd(ab, nab)
  const root = { x: 36, y: 180 }
  const nodes = [{ x: 170, y: 95, label: 'A', p: pa }, { x: 170, y: 265, label: 'Aᶜ', p: na }]
  const leaves: { from: number; y: number; label: string; p: Frac; joint: Frac; hit: boolean }[] = [
    { from: 0, y: 45, label: 'B', p: pba, joint: ab, hit: true },
    { from: 0, y: 145, label: 'Bᶜ', p: fracSub(frac(1, 1), pba), joint: fracMul(pa, fracSub(frac(1, 1), pba)), hit: false },
    { from: 1, y: 215, label: 'B', p: pbna, joint: nab, hit: conditional },
    { from: 1, y: 315, label: 'Bᶜ', p: fracSub(frac(1, 1), pbna), joint: fracMul(na, fracSub(frac(1, 1), pbna)), hit: false },
  ]
  const leafX = 320
  const final = span(t, 0.82, 1)
  const result: { text: string; color?: string }[] = conditional
    ? [
        { text: `P(B) = ${fracLabel(ab)} + ${fracLabel(nab)} = ${fracLabel(pb)}`, color: MANIM.yellow },
        { text: 'P(A|B) = P(A ∩ B) / P(B)' },
        { text: `= ${fracLabel(ab)} ÷ ${fracLabel(pb)} = ${fracLabel(fracDiv(ab, pb))}`, color: MANIM.green },
      ]
    : [
        { text: 'se multiplica por rama' },
        { text: `P(A ∩ B) = ${fracLabel(pa)} · ${fracLabel(pba)}`, color: MANIM.green },
        { text: `= ${fracLabel(ab)}`, color: MANIM.green },
      ]
  return (
    <>
      {nodes.map((node, i) => {
        const p = span(t, 0.05 + i * 0.12, 0.17 + i * 0.12)
        return (
          <g key={node.label}>
            <Stroke d={pathOf([root, node])} color={i === 0 ? MANIM.cyan : MANIM.axis} p={p} width={i === 0 ? 3 : 2} />
            <Label x={(root.x + node.x) / 2 - 6} y={(root.y + node.y) / 2 + (i === 0 ? -8 : 20)} color={MANIM.white} p={p} size={15} italic={false}>{fracLabel(node.p)}</Label>
            <Label x={node.x} y={node.y + (i === 0 ? -10 : 24)} color={i === 0 ? MANIM.cyan : MANIM.axis} p={p} size={17} italic={false}>{node.label}</Label>
          </g>
        )
      })}
      {leaves.map((leaf, i) => {
        const node = nodes[leaf.from]
        const p = span(t, 0.3 + i * 0.09, 0.39 + i * 0.09)
        const color = leaf.hit ? MANIM.yellow : MANIM.axis
        const hidden = leaf.from === 1 && !known
        return (
          <g key={i}>
            <Stroke d={pathOf([node, { x: leafX, y: leaf.y }])} color={color} p={p} width={leaf.hit ? 3 : 1.8} />
            <Label x={(node.x + leafX) / 2 - 6} y={(node.y + leaf.y) / 2 - 6} color={MANIM.white} p={hidden ? 0 : p} size={14} italic={false}>{fracLabel(leaf.p)}</Label>
            <Label x={leafX + 8} y={leaf.y + 5} anchor="start" color={color} p={p} size={15} italic={false}>{hidden ? leaf.label : `${leaf.label}: ${fracLabel(leaf.joint)}`}</Label>
          </g>
        )
      })}
      <Readout x={422} y={130} p={final} gap={30} lines={result} />
    </>
  )
}

/** Laplace, árbol y conjuntos: las tres formas de contar lo que importa en probabilidad. */
export function ProbabilityScene(props: SceneProps) {
  if (props.v.modo === 'venn') return <VennView {...props} />
  if (props.v.modo === 'arbol') return <ProbabilityTree {...props} conditional={false} />
  return <LaplaceView {...props} />
}

const choose = (n: number, k: number) => {
  let result = 1
  for (let i = 1; i <= k; i++) result = (result * (n - k + i)) / i
  return Math.round(result)
}

function BinomialView({ t, v }: SceneProps) {
  const n = Number(v.n)
  const p = parseFrac(v.p)
  const value = fracValue(p)
  const k = v.k === '' ? Math.round(n * value) : Math.min(n, Number(v.k))
  const probabilities = Array.from({ length: n + 1 }, (_, x) => choose(n, x) * value ** x * (1 - value) ** (n - x))
  const top = Math.max(...probabilities)
  const baseY = 300
  const width = Math.min(52, 400 / (n + 1))
  const x0 = 34
  const final = span(t, 0.8, 1)
  return (
    <>
      <Stroke d={`M 22 ${baseY} L ${x0 + (n + 1) * width + 12} ${baseY}`} color={MANIM.axis} p={span(t, 0, 0.1)} width={1.6} />
      {probabilities.map((probability, x) => {
        const grow = ease(span(t, 0.1 + (x / (n + 1)) * 0.5, 0.2 + (x / (n + 1)) * 0.5))
        const h = (probability / top) * 230 * grow
        const chosen = x === k
        return (
          <g key={x}>
            <rect x={x0 + x * width + 2} y={baseY - h} width={width - 4} height={h} fill={chosen ? MANIM.yellow : MANIM.cyan} fillOpacity={chosen ? 0.75 : 0.35} stroke={chosen ? MANIM.yellow : MANIM.cyan} strokeWidth={1.4} />
            <Label x={x0 + x * width + width / 2} y={baseY + 20} color={chosen ? MANIM.yellow : MANIM.axis} p={span(t, 0, 0.1)} size={14} italic={false}>{String(x)}</Label>
          </g>
        )
      })}
      <Readout x={456} y={80} p={final} gap={30} lines={[
        { text: `n = ${n}, p = ${fracLabel(p)}`, color: MANIM.white },
        { text: `P(X = ${k}) =`, color: MANIM.yellow },
        { text: `C(${n}, ${k}) · p^${k} · q^${n - k}`, color: MANIM.yellow },
        { text: `≈ ${fmt(probabilities[k], 4)}`, color: MANIM.yellow },
        { text: `media = n · p = ${fmt(n * value)}`, color: MANIM.axis },
      ]} />
    </>
  )
}

/** Principio multiplicativo: cada opción de la primera etapa se abre en todas las de la segunda. */
function CountingView({ t, v }: SceneProps) {
  const a = Number(v.a)
  const b = Number(v.b)
  const root: Point = { x: 40, y: 180 }
  const spacing = Math.min(46, 310 / (a * b))
  const top = 180 - ((a * b - 1) * spacing) / 2
  const final = span(t, 0.8, 1)
  const nodes = Array.from({ length: a }, (_, i) => ({ x: 170, y: top + (i * b + (b - 1) / 2) * spacing }))
  return (
    <>
      {nodes.map((node, i) => {
        const p = span(t, 0.04 + (i / a) * 0.28, 0.1 + (i / a) * 0.28)
        return (
          <g key={i}>
            <Stroke d={pathOf([root, node])} color={MANIM.cyan} p={p} />
            <Mark x={node.x} y={node.y} color={MANIM.cyan} p={p} />
            {Array.from({ length: b }, (_, j) => {
              const leafY = top + (i * b + j) * spacing
              const progress = (i * b + j) / (a * b)
              const q = span(t, 0.34 + progress * 0.42, 0.38 + progress * 0.42)
              return (
                <g key={j}>
                  <Stroke d={pathOf([node, { x: 330, y: leafY }])} color={MANIM.yellow} p={q} width={1.6} />
                  <Mark x={330} y={leafY} color={MANIM.yellow} p={q} r={3.5} />
                </g>
              )
            })}
          </g>
        )
      })}
      <Readout x={395} y={130} p={final} gap={32} lines={[
        { text: `primera etapa: ${a} opciones`, color: MANIM.cyan },
        { text: `segunda etapa: ${b} opciones`, color: MANIM.yellow },
        { text: `total = ${a} · ${b} = ${a * b}` },
      ]} />
    </>
  )
}

/** Condicional (árbol), distribución binomial (barras) y técnicas de conteo. */
export function ConditionalScene(props: SceneProps) {
  if (props.v.modo === 'binomial') return <BinomialView {...props} />
  if (props.v.modo === 'conteo') return <CountingView {...props} />
  return <ProbabilityTree {...props} conditional />
}
