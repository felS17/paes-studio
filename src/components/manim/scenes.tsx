import { ease, fmt, HEIGHT, MANIM, pathOf, span, type Point } from './manimMath'
import { Arrow, Guide, Label, Mark, Plane, Readout, Stroke } from './primitives'

export interface SceneProps {
  t: number
  v: Record<string, string | number>
}

const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y })

/** Homotecia: la figura se proyecta desde O y cada punto queda a |k| veces su distancia original. */
export function HomotheticScene({ t, v }: SceneProps) {
  const k = Number(v.k)
  const O = { x: 250, y: 180 }
  const offsets = [{ x: 70, y: -50 }, { x: 130, y: 20 }, { x: 50, y: 50 }]
  const names = ['A', 'B', 'C']
  const base = offsets.map((o) => add(O, o))
  const scale = 1 + (k - 1) * ease(span(t, 0.5, 0.92))
  const image = offsets.map((o) => ({ x: O.x + o.x * scale, y: O.y + o.y * scale }))
  const reach = Math.max(1, Math.abs(k)) * 1.08
  const rays = span(t, 0.18, 0.48)
  const shown = span(t, 0.48, 0.56)
  const final = span(t, 0.9, 1)
  const verdict = k > 1 ? 'k > 1: la figura se amplía' : k > 0 ? '0 < k < 1: la figura se reduce' : 'k < 0: se invierte al otro lado de O'
  return (
    <>
      {offsets.map((o, i) => {
        const end = k < 0 ? { x: O.x + o.x * k * 1.06, y: O.y + o.y * k * 1.06 } : { x: O.x + o.x * reach, y: O.y + o.y * reach }
        const start = k < 0 ? { x: O.x + o.x * 1.06, y: O.y + o.y * 1.06 } : O
        return <Stroke key={i} d={pathOf([start, end])} color={MANIM.axis} p={rays} width={1.2} />
      })}
      <Stroke d={pathOf(base, true)} color={MANIM.cyan} p={span(t, 0, 0.18)} fill />
      {shown > 0 && <Stroke d={pathOf(image, true)} color={MANIM.yellow} p={shown} fill />}
      <Mark x={O.x} y={O.y} color={MANIM.coral} p={span(t, 0.1, 0.2)} />
      <Label x={O.x - 14} y={O.y + 22} color={MANIM.coral} p={span(t, 0.1, 0.2)}>O</Label>
      {base.map((p, i) => <Label key={names[i]} x={p.x + (i === 0 ? -2 : 14)} y={p.y - 8} color={MANIM.cyan} p={span(t, 0.1, 0.2)}>{names[i]}</Label>)}
      {image.map((p, i) => <Label key={`${names[i]}p`} x={p.x + (k < 0 ? -14 : 14)} y={p.y + (i === 2 ? 20 : -8)} color={MANIM.yellow} p={final}>{`${names[i]}′`}</Label>)}
      <Readout x={24} y={36} p={final} lines={[{ text: `k = ${fmt(k)}`, color: MANIM.yellow }, { text: `OA′ = |k| · OA = ${fmt(Math.abs(k))} · OA` }]} />
      <Label x={320} y={HEIGHT - 16} p={final} size={18} italic={false}>{verdict}</Label>
    </>
  )
}

/** Función cuadrática en su forma canónica: a, el vértice (h, k) y lo que el discriminante dice sobre las raíces. */
export function QuadraticScene({ t, v }: SceneProps) {
  const a = Number(v.a)
  const h = 1
  const k = v.delta === 'positivo' ? -Math.sign(a) * 2 : v.delta === 'cero' ? 0 : Math.sign(a) * 1.5
  const delta = -4 * a * k
  const toX = (x: number) => 300 + x * 40
  const toY = (y: number) => 190 - y * 30
  const points: Point[] = []
  for (let x = -7.5; x <= 8.5; x += 0.1) {
    const y = a * (x - h) ** 2 + k
    if (Math.abs(y) <= 6) points.push({ x: toX(x), y: toY(y) })
  }
  const roots = delta > 0 ? [h - Math.sqrt(-k / a), h + Math.sqrt(-k / a)] : delta === 0 ? [h] : []
  const signed = k === 0 ? '' : k > 0 ? ` + ${fmt(k)}` : ` − ${fmt(-k)}`
  const lead = a === 1 ? '' : a === -1 ? '−' : fmt(a)
  const vertexP = span(t, 0.6, 0.72)
  const rootP = span(t, 0.72, 0.86)
  const final = span(t, 0.86, 1)
  const verdict = delta > 0 ? 'Δ > 0: dos raíces reales' : delta === 0 ? 'Δ = 0: una raíz real' : 'Δ < 0: sin raíces reales'
  return (
    <>
      <Plane cx={300} cy={190} unit={30} p={span(t, 0, 0.14)} />
      <Stroke d={pathOf(points)} color={MANIM.cyan} p={span(t, 0.14, 0.6)} width={3} />
      <Guide x1={toX(h)} y1={0} x2={toX(h)} y2={HEIGHT} color={MANIM.yellow} p={vertexP} />
      <Mark x={toX(h)} y={toY(k)} color={MANIM.yellow} p={vertexP} r={5.5} />
      <Label x={toX(h) + 12} y={toY(k) + (a > 0 ? 24 : -12)} color={MANIM.yellow} p={vertexP} anchor="start" italic={false}>{`(${h}, ${fmt(k)})`}</Label>
      {roots.map((r) => <Mark key={r} x={toX(r)} y={toY(0)} color={MANIM.coral} p={rootP} r={5.5} />)}
      <Readout x={18} y={34} p={final} lines={[{ text: `f(x) = ${lead}(x − ${h})²${signed}`, color: MANIM.cyan }, { text: `vértice (h, k) = (${h}, ${fmt(k)})`, color: MANIM.yellow }, { text: `Δ = ${fmt(delta)}`, color: MANIM.coral }]} />
      <Label x={320} y={HEIGHT - 14} p={final} italic={false}>{`${a > 0 ? 'a > 0: abre hacia arriba' : 'a < 0: abre hacia abajo'}. ${verdict}`}</Label>
    </>
  )
}

function ThalesView({ t, v }: SceneProps) {
  const V = { x: 60, y: 310 }
  const R1 = { x: 610, y: 60 }
  const R2 = { x: 610, y: 310 }
  const f1 = 0.4
  const f2 = Number(v.paralela)
  const on = (end: Point, f: number) => ({ x: V.x + (end.x - V.x) * f, y: V.y + (end.y - V.y) * f })
  const A1 = on(R1, f1)
  const A2 = on(R1, f2)
  const B1 = on(R2, f1)
  const B2 = on(R2, f2)
  const units = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y) / 50
  const a = units(V, A1)
  const b = units(A1, A2)
  const c = units(V, B1)
  const d = units(B1, B2)
  const seg = span(t, 0.62, 0.82)
  const final = span(t, 0.82, 1)
  return (
    <>
      <Stroke d={pathOf([V, R1])} color={MANIM.axis} p={span(t, 0, 0.14)} width={1.6} />
      <Stroke d={pathOf([V, R2])} color={MANIM.axis} p={span(t, 0.1, 0.24)} width={1.6} />
      <Stroke d={pathOf([{ x: A1.x, y: A1.y - 28 }, { x: B1.x, y: B1.y + 20 }])} color={MANIM.green} p={span(t, 0.24, 0.42)} />
      <Stroke d={pathOf([{ x: A2.x, y: A2.y - 28 }, { x: B2.x, y: B2.y + 20 }])} color={MANIM.green} p={span(t, 0.42, 0.6)} />
      <Stroke d={pathOf([V, A1])} color={MANIM.cyan} p={seg} width={4} />
      <Stroke d={pathOf([A1, A2])} color={MANIM.yellow} p={seg} width={4} />
      <Stroke d={pathOf([V, B1])} color={MANIM.cyan} p={seg} width={4} />
      <Stroke d={pathOf([B1, B2])} color={MANIM.yellow} p={seg} width={4} />
      <Label x={(V.x + A1.x) / 2 - 12} y={(V.y + A1.y) / 2 - 8} color={MANIM.cyan} p={seg}>a</Label>
      <Label x={(A1.x + A2.x) / 2 - 12} y={(A1.y + A2.y) / 2 - 8} color={MANIM.yellow} p={seg}>b</Label>
      <Label x={(V.x + B1.x) / 2} y={B1.y + 24} color={MANIM.cyan} p={seg}>c</Label>
      <Label x={(B1.x + B2.x) / 2} y={B1.y + 24} color={MANIM.yellow} p={seg}>d</Label>
      <Readout x={22} y={34} p={final} lines={[
        { text: 'Si las rectas verdes son paralelas:', color: MANIM.green },
        { text: 'a / b = c / d' },
        { text: `${fmt(a)} / ${fmt(b)} = ${fmt(c)} / ${fmt(d)} = ${fmt(a / b)}` },
      ]} />
    </>
  )
}

function PythagorasView({ t, v }: SceneProps) {
  const [a, b] = String(v.catetos).split('-').map(Number)
  const c = Math.hypot(a, b)
  const u = 210 / (a + b)
  const O = { x: 215, y: 222 }
  const A = { x: O.x + a * u, y: O.y }
  const B = { x: O.x, y: O.y - b * u }
  const across = { x: b * u, y: -a * u }
  const squareA = [O, A, { x: A.x, y: A.y + a * u }, { x: O.x, y: O.y + a * u }]
  const squareB = [O, B, { x: B.x - b * u, y: B.y }, { x: O.x - b * u, y: O.y }]
  const squareC = [A, add(A, across), add(B, across), B]
  const final = span(t, 0.86, 1)
  const center = (points: Point[]) => ({ x: points.reduce((s, p) => s + p.x, 0) / 4, y: points.reduce((s, p) => s + p.y, 0) / 4 })
  return (
    <>
      <Stroke d={pathOf(squareA, true)} color={MANIM.cyan} p={span(t, 0.18, 0.42)} fill />
      <Stroke d={pathOf(squareB, true)} color={MANIM.yellow} p={span(t, 0.42, 0.64)} fill />
      <Stroke d={pathOf(squareC, true)} color={MANIM.green} p={span(t, 0.64, 0.86)} fill />
      <Stroke d={pathOf([O, A, B], true)} color={MANIM.white} p={span(t, 0, 0.18)} width={3} />
      <Label x={center(squareA).x} y={center(squareA).y + 6} color={MANIM.cyan} p={span(t, 0.3, 0.42)} italic={false}>{`a² = ${a * a}`}</Label>
      <Label x={center(squareB).x} y={center(squareB).y + 6} color={MANIM.yellow} p={span(t, 0.52, 0.64)} italic={false}>{`b² = ${b * b}`}</Label>
      <Label x={center(squareC).x} y={center(squareC).y + 6} color={MANIM.green} p={span(t, 0.74, 0.86)} italic={false}>{`c² = ${fmt(c * c, 0)}`}</Label>
      <Readout x={622} y={290} anchor="end" p={final} lines={[{ text: `${a}² + ${b}² = ${fmt(c, 0)}²` }, { text: `${a * a} + ${b * b} = ${fmt(c * c, 0)}` }]} />
    </>
  )
}

/** Thales: paralelas que cortan dos rectas dejan segmentos proporcionales. Pitágoras: las áreas de los cuadrados. */
export function ThalesScene(props: SceneProps) {
  return props.v.modo === 'pitagoras' ? <PythagorasView {...props} /> : <ThalesView {...props} />
}

/** Circunferencia unitaria: el coseno, el seno y la tangente son trazos reales que cambian con el ángulo. */
export function TrigonometryScene({ t, v }: SceneProps) {
  const target = Number(v.alfa)
  const alpha = (target * ease(span(t, 0.18, 0.78)) * Math.PI) / 180
  const c = { x: 215, y: 180 }
  const r = 125
  const cos = Math.cos(alpha)
  const sin = Math.sin(alpha)
  const P = { x: c.x + r * cos, y: c.y - r * sin }
  const foot = { x: P.x, y: c.y }
  const lines = span(t, 0.18, 0.28)
  const circle: Point[] = []
  for (let a = 0; a <= 360; a += 4) circle.push({ x: c.x + r * Math.cos((a * Math.PI) / 180), y: c.y - r * Math.sin((a * Math.PI) / 180) })
  const arc: Point[] = []
  for (let a = 0; a <= (alpha * 180) / Math.PI; a += 3) arc.push({ x: c.x + 30 * Math.cos((a * Math.PI) / 180), y: c.y - 30 * Math.sin((a * Math.PI) / 180) })
  const finalDeg = ((target % 360) + 360) % 360
  const undefinedTan = finalDeg === 90 || finalDeg === 270
  const tanNow = Math.tan(alpha)
  const showTan = Math.abs(cos) > 0.01 && Math.abs(tanNow) <= 1.35
  const tip = { x: c.x + r, y: c.y - r * tanNow }
  const final = span(t, 0.78, 1)
  const finalRad = (target * Math.PI) / 180
  return (
    <>
      <Plane cx={c.x} cy={c.y} unit={r} p={span(t, 0, 0.08)} labels={false} />
      <Stroke d={pathOf(circle)} color={MANIM.white} p={span(t, 0, 0.18)} width={2} />
      {arc.length > 1 && <Stroke d={pathOf(arc)} color={MANIM.white} p={lines} width={2} />}
      {showTan && <Guide x1={c.x} y1={c.y} x2={tip.x} y2={tip.y} color={MANIM.green} p={lines} />}
      {showTan && <Stroke d={pathOf([{ x: c.x + r, y: c.y }, tip])} color={MANIM.green} p={lines} width={3.5} />}
      <Stroke d={pathOf([c, foot])} color={MANIM.cyan} p={lines} width={4} />
      <Stroke d={pathOf([foot, P])} color={MANIM.coral} p={lines} width={4} />
      <Stroke d={pathOf([c, P])} color={MANIM.yellow} p={lines} width={3} />
      <Mark x={P.x} y={P.y} color={MANIM.yellow} p={lines} />
      <Label x={c.x + 42} y={c.y - 8} p={lines} size={16}>α</Label>
      <Readout x={402} y={92} p={final} gap={32} lines={[
        { text: `α = ${fmt(target, 0)}°`, color: MANIM.white },
        { text: `cos α = ${fmt(Math.cos(finalRad))}`, color: MANIM.cyan },
        { text: `sen α = ${fmt(Math.sin(finalRad))}`, color: MANIM.coral },
        { text: `tan α = ${undefinedTan ? 'no definida' : fmt(Math.tan(finalRad))}`, color: MANIM.green },
      ]} />
      <Label x={402} y={252} p={final} anchor="start" size={15} italic={false} color={MANIM.axis}>radio 1, así la hipotenusa vale 1</Label>
    </>
  )
}

function SumView({ t, v }: SceneProps) {
  const o = { x: 240, y: 240 }
  const unit = 30
  const to = (x: number, y: number) => ({ x: o.x + x * unit, y: o.y - y * unit })
  const u = { x: 4, y: 1 }
  const [vx, vy] = String(v.vector).split(',').map(Number)
  const sum = { x: u.x + vx, y: u.y + vy }
  const U = to(u.x, u.y)
  const W = to(vx, vy)
  const S = to(sum.x, sum.y)
  const copies = span(t, 0.58, 0.74)
  const result = span(t, 0.74, 0.92)
  const final = span(t, 0.9, 1)
  return (
    <>
      <Plane cx={o.x} cy={o.y} unit={unit} p={span(t, 0, 0.1)} />
      <Guide x1={U.x} y1={U.y} x2={S.x} y2={S.y} color={MANIM.yellow} p={copies} />
      <Guide x1={W.x} y1={W.y} x2={S.x} y2={S.y} color={MANIM.cyan} p={copies} />
      <Arrow x1={o.x} y1={o.y} x2={U.x} y2={U.y} color={MANIM.cyan} p={ease(span(t, 0.1, 0.34))} />
      <Arrow x1={o.x} y1={o.y} x2={W.x} y2={W.y} color={MANIM.yellow} p={ease(span(t, 0.34, 0.58))} />
      <Arrow x1={o.x} y1={o.y} x2={S.x} y2={S.y} color={MANIM.green} p={ease(result)} width={3.5} />
      <Label x={U.x + 16} y={U.y + 6} color={MANIM.cyan} p={span(t, 0.28, 0.34)}>u</Label>
      <Label x={W.x + (vx < 0 ? -14 : 14)} y={W.y - 4} color={MANIM.yellow} p={span(t, 0.52, 0.58)}>v</Label>
      <Readout x={22} y={32} p={final} lines={[
        { text: `u = (${u.x}, ${u.y})`, color: MANIM.cyan },
        { text: `v = (${fmt(vx)}, ${fmt(vy)})`, color: MANIM.yellow },
        { text: `u + v = (${fmt(sum.x)}, ${fmt(sum.y)})`, color: MANIM.green },
      ]} />
    </>
  )
}

function RotationView({ t, v }: SceneProps) {
  const o = { x: 320, y: 180 }
  const unit = 30
  const angle = Number(v.giro)
  const P = { x: 4, y: 2 }
  const turn = (ease(span(t, 0.24, 0.84)) * angle * Math.PI) / 180
  const Q = { x: P.x * Math.cos(turn) - P.y * Math.sin(turn), y: P.x * Math.sin(turn) + P.y * Math.cos(turn) }
  const to = (p: Point) => ({ x: o.x + p.x * unit, y: o.y - p.y * unit })
  const trail: Point[] = []
  const radius = Math.hypot(P.x, P.y)
  const start = Math.atan2(P.y, P.x)
  for (let a = 0; a <= turn; a += 0.05) trail.push(to({ x: radius * Math.cos(start + a), y: radius * Math.sin(start + a) }))
  const exact = angle === 90 ? { x: -P.y, y: P.x } : angle === 180 ? { x: -P.x, y: -P.y } : { x: P.y, y: -P.x }
  const rule = angle === 90 ? '(x, y) → (−y, x)' : angle === 180 ? '(x, y) → (−x, −y)' : '(x, y) → (y, −x)'
  const final = span(t, 0.84, 1)
  const startP = to(P)
  const endP = to(Q)
  return (
    <>
      <Plane cx={o.x} cy={o.y} unit={unit} p={span(t, 0, 0.1)} />
      {trail.length > 1 && <Stroke d={pathOf(trail)} color={MANIM.white} width={1.6} />}
      <Arrow x1={o.x} y1={o.y} x2={startP.x} y2={startP.y} color={MANIM.cyan} p={ease(span(t, 0.08, 0.24))} />
      <Arrow x1={o.x} y1={o.y} x2={endP.x} y2={endP.y} color={MANIM.yellow} p={span(t, 0.24, 0.26)} />
      <Label x={startP.x + 8} y={startP.y - 8} color={MANIM.cyan} p={span(t, 0.18, 0.24)} anchor="start" italic={false}>{`P (${P.x}, ${P.y})`}</Label>
      <Label x={endP.x + (exact.x < 0 ? -8 : 8)} y={endP.y + (exact.y < 0 ? 22 : -8)} color={MANIM.yellow} p={final} anchor={exact.x < 0 ? 'end' : 'start'} italic={false}>{`P′ (${fmt(exact.x)}, ${fmt(exact.y)})`}</Label>
      <Readout x={22} y={32} p={final} lines={[{ text: `rotación de ${angle}° en torno al origen` }, { text: rule, color: MANIM.yellow }]} />
    </>
  )
}

/** Vectores: suma por la ley del paralelogramo y rotaciones de 90°, 180° y 270° en el plano cartesiano. */
export function VectorsScene(props: SceneProps) {
  return props.v.modo === 'rotacion' ? <RotationView {...props} /> : <SumView {...props} />
}

function KinematicsView({ t, v }: SceneProps) {
  const profiles: Record<string, { v0: number; a: number; name: string }> = {
    mru: { v0: 2, a: 0, name: 'velocidad constante: tramos iguales' },
    acelera: { v0: 0.5, a: 0.8, name: 'acelera: tramos cada vez más largos' },
    frena: { v0: 4, a: -0.8, name: 'frena: tramos cada vez más cortos' },
  }
  const { v0, a, name } = profiles[String(v.movimiento)]
  const duration = 5
  const time = t * duration
  const position = (s: number) => v0 * s + 0.5 * a * s * s
  const toX = (x: number) => 40 + x * 36
  const y = 200
  const speed = v0 + a * time
  const px = toX(position(time))
  const ticks = Array.from({ length: Math.floor(time) + 1 }, (_, s) => s)
  return (
    <>
      <Stroke d={`M 30 ${y} L 620 ${y}`} color={MANIM.axis} width={1.6} />
      {Array.from({ length: 16 }, (_, x) => <line key={x} x1={toX(x)} y1={y - 4} x2={toX(x)} y2={y + 4} stroke={MANIM.axis} strokeWidth={1} />)}
      {ticks.map((s) => (
        <g key={s}>
          <circle cx={toX(position(s))} cy={y} r={3.5} fill={MANIM.white} opacity={0.75} />
          <Label x={toX(position(s))} y={y + 26} color={MANIM.axis} size={14} italic={false}>{`${s} s`}</Label>
        </g>
      ))}
      {speed > 0.01 && <Arrow x1={px} y1={y - 16} x2={px + speed * 22} y2={y - 16} color={MANIM.cyan} />}
      {a !== 0 && <Arrow x1={px} y1={y - 36} x2={px + a * 70} y2={y - 36} color={MANIM.coral} />}
      {speed > 0.01 && <Label x={px + speed * 22 + 8} y={y - 11} color={MANIM.cyan} anchor="start">v</Label>}
      {a !== 0 && <Label x={px + a * 70 + (a > 0 ? 8 : -8)} y={y - 31} color={MANIM.coral} anchor={a > 0 ? 'start' : 'end'}>a</Label>}
      <Mark x={px} y={y} color={MANIM.yellow} r={7} />
      <Readout x={22} y={34} lines={[
        { text: `t = ${fmt(time, 1)} s` },
        { text: `x = ${fmt(position(time), 1)} m`, color: MANIM.yellow },
        { text: `v = ${fmt(speed, 1)} m/s`, color: MANIM.cyan },
        { text: `a = ${fmt(a, 1)} m/s²`, color: MANIM.coral },
      ]} />
      <Label x={320} y={HEIGHT - 22} italic={false} p={span(t, 0.2, 0.4)}>{name}</Label>
    </>
  )
}

function WaveView({ t, v }: SceneProps) {
  const scale = 40
  const amplitude = Number(v.amplitud)
  const wavelength = Number(v.longitud)
  const A = amplitude * scale
  const lambda = wavelength * scale
  const y0 = 190
  const x0 = 30
  const travel = span(t, 0.3, 1)
  const phase = travel * 4 * Math.PI
  const points: Point[] = []
  for (let x = x0; x <= 620; x += 3) points.push({ x, y: y0 - A * Math.sin((2 * Math.PI * (x - x0)) / lambda - phase) })
  const crest1 = x0 + lambda / 4
  const crest2 = crest1 + lambda
  const top = y0 - A
  const final = span(t, 0.9, 1)
  return (
    <>
      <Stroke d={`M 20 ${y0} L 625 ${y0}`} color={MANIM.axis} p={span(t, 0, 0.1)} width={1.6} />
      <Stroke d={pathOf(points)} color={MANIM.cyan} p={span(t, 0.05, 0.3)} width={3} />
      <Arrow x1={crest1} y1={y0} x2={crest1} y2={top} color={MANIM.coral} p={final} />
      <Label x={crest1 + 10} y={y0 - A / 2 + 6} color={MANIM.coral} p={final} anchor="start">A</Label>
      {crest2 < 625 && (
        <>
          <Guide x1={crest1} y1={top} x2={crest1} y2={top - 22} color={MANIM.yellow} p={final} />
          <Guide x1={crest2} y1={top} x2={crest2} y2={top - 22} color={MANIM.yellow} p={final} />
          <Arrow x1={crest1} y1={top - 16} x2={crest2} y2={top - 16} color={MANIM.yellow} p={final} width={2} />
          <Label x={(crest1 + crest2) / 2} y={top - 24} color={MANIM.yellow} p={final}>λ</Label>
        </>
      )}
      <Readout x={22} y={32} p={final} lines={[{ text: `A = ${fmt(amplitude)} m`, color: MANIM.coral }, { text: `λ = ${fmt(wavelength)} m`, color: MANIM.yellow }]} />
    </>
  )
}

/** Física: partícula con sus vectores velocidad y aceleración, y onda sinusoidal con amplitud y longitud de onda. */
export function PhysicsScene(props: SceneProps) {
  return props.v.modo === 'ondas' ? <WaveView {...props} /> : <KinematicsView {...props} />
}
