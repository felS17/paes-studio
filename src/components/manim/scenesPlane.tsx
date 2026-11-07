import { ease, ellipse, fmt, frac, fracLabel, HEIGHT, MANIM, parseList, pathOf, span, WIDTH, type Point } from './manimMath'
import { Arrow, Guide, Label, Mark, Plane, Readout, Stroke, Ticks } from './primitives'
import type { SceneProps } from './sceneProps'

const CENTER = { x: 320, y: 180 }

/** Unidad que hace caber en la pizarra todos los puntos, sin pasar de `max` para que las escenas simples no se vean enormes. */
function fitUnit(points: readonly Point[], max = 30) {
  const reachX = Math.max(1, ...points.map((p) => Math.abs(p.x)))
  const reachY = Math.max(1, ...points.map((p) => Math.abs(p.y)))
  return Math.min(max, 280 / reachX, 145 / reachY)
}

const pointOf = (value: string | number): Point => {
  const [x, y] = parseList(value)
  return { x, y }
}

const toScreen = (unit: number) => (p: Point): Point => ({ x: CENTER.x + p.x * unit, y: CENTER.y - p.y * unit })
const coord = (p: Point) => `(${fmt(p.x)}, ${fmt(p.y)})`
const triangleAt = (P: Point): Point[] => [P, { x: P.x + 2, y: P.y }, { x: P.x + 1, y: P.y + 2 }]

function Grid({ unit, t }: { unit: number; t: number }) {
  return (
    <>
      <Plane cx={CENTER.x} cy={CENTER.y} unit={unit} p={span(t, 0, 0.1)} />
      <Ticks cx={CENTER.x} cy={CENTER.y} unit={unit} p={span(t, 0.04, 0.12)} />
    </>
  )
}

function CoordinatesView({ t, v }: SceneProps) {
  const P = pointOf(v.p)
  const unit = fitUnit([P])
  const to = toScreen(unit)
  const S = to(P)
  const final = span(t, 0.7, 1)
  return (
    <>
      <Grid unit={unit} t={t} />
      <Stroke d={pathOf([CENTER, { x: S.x, y: CENTER.y }])} color={MANIM.cyan} p={span(t, 0.12, 0.38)} width={3.5} />
      <Stroke d={pathOf([{ x: S.x, y: CENTER.y }, S])} color={MANIM.yellow} p={span(t, 0.38, 0.62)} width={3.5} />
      <Mark x={S.x} y={S.y} color={MANIM.coral} p={span(t, 0.6, 0.7)} r={6} />
      <Label x={S.x + (P.x < 0 ? -10 : 10)} y={S.y + (P.y < 0 ? 22 : -10)} anchor={P.x < 0 ? 'end' : 'start'} color={MANIM.coral} p={final} italic={false}>{`P ${coord(P)}`}</Label>
      <Readout x={22} y={32} p={final} lines={[{ text: `primero x = ${fmt(P.x)}`, color: MANIM.cyan }, { text: `luego y = ${fmt(P.y)}`, color: MANIM.yellow }]} />
    </>
  )
}

function SumView({ t, v, subtract }: SceneProps & { subtract: boolean }) {
  const u = pointOf(v.u)
  const w = pointOf(v.w)
  const second = subtract ? { x: -w.x, y: -w.y } : w
  const sum = { x: u.x + second.x, y: u.y + second.y }
  const unit = fitUnit([u, second, sum, w])
  const to = toScreen(unit)
  const [U, W, Second, S] = [to(u), to(w), to(second), to(sum)]
  const copies = span(t, 0.58, 0.74)
  const result = span(t, 0.74, 0.92)
  const final = span(t, 0.9, 1)
  return (
    <>
      <Grid unit={unit} t={t} />
      <Guide x1={U.x} y1={U.y} x2={S.x} y2={S.y} color={MANIM.yellow} p={copies} />
      <Guide x1={Second.x} y1={Second.y} x2={S.x} y2={S.y} color={MANIM.cyan} p={copies} />
      <Arrow x1={CENTER.x} y1={CENTER.y} x2={U.x} y2={U.y} color={MANIM.cyan} p={ease(span(t, 0.1, 0.34))} />
      <Arrow x1={CENTER.x} y1={CENTER.y} x2={W.x} y2={W.y} color={MANIM.yellow} p={ease(span(t, 0.34, 0.58))} />
      {subtract && <Arrow x1={CENTER.x} y1={CENTER.y} x2={Second.x} y2={Second.y} color={MANIM.coral} p={ease(span(t, 0.48, 0.62))} />}
      <Arrow x1={CENTER.x} y1={CENTER.y} x2={S.x} y2={S.y} color={MANIM.green} p={ease(result)} width={3.5} />
      <Label x={U.x + 14} y={U.y + 6} color={MANIM.cyan} p={span(t, 0.28, 0.34)}>u</Label>
      <Label x={W.x + (w.x < 0 ? -14 : 14)} y={W.y - 4} color={MANIM.yellow} p={span(t, 0.52, 0.58)}>v</Label>
      {subtract && <Label x={Second.x + (second.x < 0 ? -14 : 14)} y={Second.y - 4} color={MANIM.coral} p={span(t, 0.56, 0.62)}>−v</Label>}
      <Readout x={22} y={32} p={final} lines={[
        { text: `u = ${coord(u)}`, color: MANIM.cyan },
        { text: `v = ${coord(w)}`, color: MANIM.yellow },
        { text: `u ${subtract ? '−' : '+'} v = ${coord(sum)}`, color: MANIM.green },
      ]} />
    </>
  )
}

function FigureMotion({ t, unit, from, to, rule, title, children }: {
  t: number
  unit: number
  from: Point[]
  to: (p: Point, progress: number) => Point
  rule: string
  title: string
  children?: React.ReactNode
}) {
  const screen = toScreen(unit)
  const progress = ease(span(t, 0.28, 0.82))
  const final = span(t, 0.82, 1)
  const image = from.map((p) => to(p, progress))
  const end = to(from[0], 1)
  const S = screen(end)
  return (
    <>
      <Grid unit={unit} t={t} />
      {children}
      <Stroke d={pathOf(from.map(screen), true)} color={MANIM.cyan} p={span(t, 0.1, 0.28)} fill />
      {progress > 0 && <Stroke d={pathOf(image.map(screen), true)} color={MANIM.yellow} fill />}
      <Mark x={screen(from[0]).x} y={screen(from[0]).y} color={MANIM.cyan} p={span(t, 0.2, 0.28)} />
      <Label x={screen(from[0]).x - 8} y={screen(from[0]).y + 20} anchor="end" color={MANIM.cyan} p={span(t, 0.2, 0.28)} italic={false}>{`P ${coord(from[0])}`}</Label>
      <Label x={S.x + (end.x < 0 ? -8 : 8)} y={S.y + (end.y < 0 ? 22 : -8)} anchor={end.x < 0 ? 'end' : 'start'} color={MANIM.yellow} p={final} italic={false}>{`P′ ${coord(end)}`}</Label>
      <Readout x={22} y={32} p={final} lines={[{ text: title }, { text: rule, color: MANIM.yellow }]} />
    </>
  )
}

function TranslationView({ t, v }: SceneProps) {
  const P = pointOf(v.p)
  const T = pointOf(v.t)
  const figure = triangleAt(P)
  const moved = figure.map((p) => ({ x: p.x + T.x, y: p.y + T.y }))
  const unit = fitUnit([...figure, ...moved])
  const screen = toScreen(unit)
  const [S, E] = [screen(P), screen(moved[0])]
  return (
    <FigureMotion
      t={t}
      unit={unit}
      from={figure}
      to={(p, f) => ({ x: p.x + T.x * f, y: p.y + T.y * f })}
      title={`traslación según T = ${coord(T)}`}
      rule={`(x, y) → (x ${T.x < 0 ? '−' : '+'} ${fmt(Math.abs(T.x))}, y ${T.y < 0 ? '−' : '+'} ${fmt(Math.abs(T.y))})`}
    >
      <Arrow x1={S.x} y1={S.y} x2={E.x} y2={E.y} color={MANIM.green} p={ease(span(t, 0.28, 0.82))} width={2.2} />
    </FigureMotion>
  )
}

const ROTATION_RULES: Record<number, { rule: string; apply: (p: Point) => Point }> = {
  90: { rule: '(x, y) → (−y, x)', apply: (p) => ({ x: -p.y, y: p.x }) },
  180: { rule: '(x, y) → (−x, −y)', apply: (p) => ({ x: -p.x, y: -p.y }) },
  270: { rule: '(x, y) → (y, −x)', apply: (p) => ({ x: p.y, y: -p.x }) },
}

function RotationView({ t, v }: SceneProps) {
  const angle = Number(v.giro)
  const { rule, apply } = ROTATION_RULES[angle] ?? ROTATION_RULES[90]
  const figure = triangleAt(pointOf(v.p))
  const unit = fitUnit([...figure, ...figure.map(apply)])
  const rotate = (p: Point, f: number) => {
    // El final usa la regla exacta: así la cifra de P′ nunca arrastra un error de redondeo.
    if (f >= 1) return apply(p)
    const a = (angle * f * Math.PI) / 180
    return { x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) }
  }
  const trail: Point[] = []
  const swept = ease(span(t, 0.28, 0.82))
  for (let i = 0; i <= 40; i++) trail.push(toScreen(unit)(rotate(figure[0], (swept * i) / 40)))
  return (
    <FigureMotion t={t} unit={unit} from={figure} to={rotate} title={`rotación de ${angle}° en torno al origen`} rule={rule}>
      {swept > 0 && <Stroke d={pathOf(trail)} color={MANIM.white} width={1.4} />}
    </FigureMotion>
  )
}

function ReflectionView({ t, v }: SceneProps) {
  const axis = String(v.eje)
  const figure = triangleAt(pointOf(v.p))
  const sx = axis === 'x' ? 1 : -1
  const sy = axis === 'y' ? 1 : -1
  const reflect = (p: Point, f: number) => ({ x: p.x * (1 + (sx - 1) * f), y: p.y * (1 + (sy - 1) * f) })
  const unit = fitUnit([...figure, ...figure.map((p) => reflect(p, 1))])
  const rule = axis === 'x' ? '(x, y) → (x, −y)' : axis === 'y' ? '(x, y) → (−x, y)' : '(x, y) → (−x, −y)'
  const title = axis === 'origen' ? 'reflexión central en el origen' : `reflexión respecto del eje ${axis}`
  const line = span(t, 0.1, 0.24)
  return (
    <FigureMotion t={t} unit={unit} from={figure} to={reflect} title={title} rule={rule}>
      {axis === 'x' && <Stroke d={`M 0 ${CENTER.y} L ${WIDTH} ${CENTER.y}`} color={MANIM.coral} p={line} />}
      {axis === 'y' && <Stroke d={`M ${CENTER.x} ${HEIGHT} L ${CENTER.x} 0`} color={MANIM.coral} p={line} />}
      {axis === 'origen' && <Mark x={CENTER.x} y={CENTER.y} color={MANIM.coral} p={line} r={6} />}
    </FigureMotion>
  )
}

/** Plano cartesiano, vectores y transformaciones isométricas. */
export function VectorsScene(props: SceneProps) {
  switch (props.v.modo) {
    case 'plano': return <CoordinatesView {...props} />
    case 'resta': return <SumView {...props} subtract />
    case 'traslacion': return <TranslationView {...props} />
    case 'rotacion': return <RotationView {...props} />
    case 'reflexion': return <ReflectionView {...props} />
    default: return <SumView {...props} subtract={false} />
  }
}

/** Pendiente desde dos puntos: el avance y la subida forman un triángulo, y su razón es m. */
export function LineScene({ t, v }: SceneProps) {
  const A = pointOf(v.a)
  const B = pointOf(v.b)
  const mode = String(v.modo)
  const dx = B.x - A.x
  const dy = B.y - A.y
  const slope = frac(dy, dx)
  const m = dy / dx
  const unit = fitUnit([A, B], 26)
  const to = toScreen(unit)
  const [SA, SB, SC] = [to(A), to(B), to({ x: B.x, y: A.y })]
  const lineAt = (through: Point, slopeValue: number) => {
    const span_ = 40
    return pathOf([to({ x: through.x - span_, y: through.y - span_ * slopeValue }), to({ x: through.x + span_, y: through.y + span_ * slopeValue })])
  }
  const mid = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 }
  const second = span(t, 0.66, 0.84)
  const final = span(t, 0.84, 1)
  const degrees = (Math.atan(m) * 180) / Math.PI
  const perpendicular = frac(-dx, dy)
  const extra = mode === 'paralelas'
    ? [{ text: 'paralelas: m₁ = m₂', color: MANIM.coral }]
    : mode === 'perpendiculares'
      ? dy === 0
        ? [{ text: 'perpendicular a una horizontal: recta vertical', color: MANIM.coral }]
        : [{ text: `perpendicular: m₂ = ${fracLabel(perpendicular)}`, color: MANIM.coral }, { text: 'm₁ · m₂ = −1', color: MANIM.coral }]
      : [{ text: `inclinación ≈ ${fmt(degrees, 0)}°`, color: MANIM.axis }]
  return (
    <>
      <Grid unit={unit} t={t} />
      <Stroke d={lineAt(A, m)} color={MANIM.green} p={ease(span(t, 0.5, 0.66))} />
      {mode === 'paralelas' && <Stroke d={lineAt({ x: A.x, y: A.y - 3 }, m)} color={MANIM.coral} p={ease(second)} />}
      {mode === 'perpendiculares' && dy !== 0 && <Stroke d={lineAt(mid, -dx / dy)} color={MANIM.coral} p={ease(second)} />}
      {mode === 'perpendiculares' && dy === 0 && <Stroke d={`M ${to(mid).x} 0 L ${to(mid).x} ${HEIGHT}`} color={MANIM.coral} p={ease(second)} />}
      <Stroke d={pathOf([SA, SC])} color={MANIM.cyan} p={span(t, 0.2, 0.35)} width={3.5} />
      <Stroke d={pathOf([SC, SB])} color={MANIM.yellow} p={span(t, 0.35, 0.5)} width={3.5} />
      <Mark x={SA.x} y={SA.y} p={span(t, 0.1, 0.18)} r={5.5} />
      <Mark x={SB.x} y={SB.y} p={span(t, 0.14, 0.2)} r={5.5} />
      <Label x={SA.x - 8} y={SA.y - 8} anchor="end" p={span(t, 0.1, 0.18)} size={15} italic={false}>{coord(A)}</Label>
      <Label x={SB.x + 8} y={SB.y - 8} anchor="start" p={span(t, 0.14, 0.2)} size={15} italic={false}>{coord(B)}</Label>
      <Label x={(SA.x + SC.x) / 2} y={SA.y + (dy < 0 ? -10 : 22)} color={MANIM.cyan} p={span(t, 0.28, 0.35)} size={15} italic={false}>{`x₂ − x₁ = ${fmt(dx)}`}</Label>
      <Label x={SC.x + (dx < 0 ? -10 : 10)} y={(SC.y + SB.y) / 2} anchor={dx < 0 ? 'end' : 'start'} color={MANIM.yellow} p={span(t, 0.43, 0.5)} size={15} italic={false}>{`y₂ − y₁ = ${fmt(dy)}`}</Label>
      <Readout x={18} y={30} p={final} lines={[{ text: `m = ${fmt(dy)} / ${fmt(dx)} = ${fracLabel(slope)}`, color: MANIM.green }, ...extra]} />
    </>
  )
}

/** Homotecia: la figura se proyecta desde O y cada punto queda a |k| veces su distancia original. */
export function HomotheticScene({ t, v }: SceneProps) {
  const k = Number(v.k)
  const shape = [{ x: 60, y: -40 }, { x: 110, y: 15 }, { x: 40, y: 45 }]
  const names = ['A', 'B', 'C']
  const reach = Math.max(1, Math.abs(k)) * 1.08
  const O = k < 0 ? { x: 320, y: 180 } : { x: 70, y: 185 }
  // Con k < 0 la imagen cae al otro lado de O, y la base a su derecha: cada lado limita su propia escala.
  const fit = k < 0
    ? Math.min(280 / (110 * Math.max(1, -k)), 135 / (45 * Math.max(1, -k)))
    : Math.min(1.5, 520 / (110 * reach), 120 / (45 * reach))
  const offsets = shape.map((p) => ({ x: p.x * fit, y: p.y * fit }))
  const base = offsets.map((o) => ({ x: O.x + o.x, y: O.y + o.y }))
  const scale = 1 + (k - 1) * ease(span(t, 0.5, 0.92))
  const image = offsets.map((o) => ({ x: O.x + o.x * scale, y: O.y + o.y * scale }))
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
      <Label x={320} y={HEIGHT - 12} p={final} size={18} italic={false}>{verdict}</Label>
    </>
  )
}

function RightTriangleView({ t, v }: SceneProps) {
  const rad = (Number(v.alfa) * Math.PI) / 180
  const byAngle = !Number(v.op)
  const op = byAngle ? Math.tan(rad) : Number(v.op)
  const ady = byAngle ? 1 : Number(v.ady)
  const hip = Math.hypot(op, ady)
  const angle = Math.atan2(op, ady)
  const u = Math.min(310 / ady, 240 / op)
  const A = { x: 60, y: 300 }
  const B = { x: A.x + ady * u, y: A.y }
  const C = { x: B.x, y: A.y - op * u }
  const final = span(t, 0.72, 1)
  const box = 13
  const ratio = (top: number, bottom: number) => (byAngle ? fmt(top / bottom) : `${fmt(top)}/${fmt(bottom)} = ${fmt(top / bottom)}`)
  return (
    <>
      <Stroke d={pathOf([A, B])} color={MANIM.cyan} p={span(t, 0, 0.2)} width={4} />
      <Stroke d={pathOf([B, C])} color={MANIM.coral} p={span(t, 0.2, 0.4)} width={4} />
      <Stroke d={pathOf([A, C])} color={MANIM.yellow} p={span(t, 0.4, 0.6)} width={4} />
      <Stroke d={pathOf([{ x: B.x - box, y: B.y }, { x: B.x - box, y: B.y - box }, { x: B.x, y: B.y - box }])} color={MANIM.white} p={span(t, 0.58, 0.64)} width={1.4} />
      <Stroke d={pathOf(ellipse(A.x, A.y, 36, 36, 0, (angle * 180) / Math.PI))} color={MANIM.white} p={span(t, 0.6, 0.7)} width={2} />
      <Label x={A.x + 46} y={A.y - 8} p={span(t, 0.62, 0.7)} size={16}>α</Label>
      <Label x={(A.x + B.x) / 2} y={A.y + 24} color={MANIM.cyan} p={span(t, 0.12, 0.2)} size={16} italic={false}>{byAngle ? 'adyacente' : `adyacente = ${fmt(ady)}`}</Label>
      <Label x={B.x + 10} y={(B.y + C.y) / 2} anchor="start" color={MANIM.coral} p={span(t, 0.32, 0.4)} size={16} italic={false}>{byAngle ? 'opuesto' : `opuesto = ${fmt(op)}`}</Label>
      <Label x={(A.x + C.x) / 2 - 12} y={(A.y + C.y) / 2 - 8} anchor="end" color={MANIM.yellow} p={span(t, 0.52, 0.6)} size={16} italic={false}>{byAngle ? 'hipotenusa' : `hipotenusa = ${fmt(hip)}`}</Label>
      <Readout x={WIDTH - 18} y={36} anchor="end" p={final} gap={28} lines={[
        ...(byAngle ? [{ text: `α = ${fmt(Number(v.alfa), 0)}°`, color: MANIM.white }] : []),
        { text: `sen α = ${ratio(op, hip)}`, color: MANIM.coral },
        { text: `cos α = ${ratio(ady, hip)}`, color: MANIM.cyan },
        { text: `tan α = ${ratio(op, ady)}`, color: MANIM.green },
      ]} />
    </>
  )
}

/** Circunferencia unitaria: el coseno, el seno y la tangente son trazos reales que cambian con el ángulo. */
function UnitCircleView({ t, v }: SceneProps) {
  const target = Number(v.alfa)
  const alpha = (target * ease(span(t, 0.18, 0.78)) * Math.PI) / 180
  const c = { x: 215, y: 180 }
  const r = 125
  const cos = Math.cos(alpha)
  const sin = Math.sin(alpha)
  const P = { x: c.x + r * cos, y: c.y - r * sin }
  const foot = { x: P.x, y: c.y }
  const lines = span(t, 0.18, 0.28)
  const arc = ellipse(c.x, c.y, 30, 30, 0, (alpha * 180) / Math.PI)
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
      <Stroke d={pathOf(ellipse(c.x, c.y, r, r))} color={MANIM.white} p={span(t, 0, 0.18)} width={2} />
      <Stroke d={pathOf(arc)} color={MANIM.white} p={lines} width={2} />
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

/** Arco y cuerda de un mismo ángulo central. */
function ChordView({ t, v }: SceneProps) {
  const target = Number(v.alfa)
  const swept = target * ease(span(t, 0.2, 0.62))
  const c = { x: 195, y: 185 }
  const R = 130
  const point = (deg: number) => ({ x: c.x + R * Math.cos((deg * Math.PI) / 180), y: c.y - R * Math.sin((deg * Math.PI) / 180) })
  const start = point(0)
  const end = point(swept)
  const final = span(t, 0.8, 1)
  const rad = (target * Math.PI) / 180
  return (
    <>
      <Stroke d={pathOf(ellipse(c.x, c.y, R, R))} color={MANIM.axis} p={span(t, 0, 0.2)} width={1.6} />
      <Stroke d={pathOf([c, start])} color={MANIM.white} p={span(t, 0.1, 0.2)} />
      {swept > 0 && <Stroke d={pathOf(ellipse(c.x, c.y, R, R, 0, swept))} color={MANIM.yellow} width={4} />}
      {swept > 0 && <Stroke d={pathOf([c, end])} color={MANIM.white} />}
      <Stroke d={pathOf([point(0), point(target)])} color={MANIM.coral} p={span(t, 0.62, 0.8)} width={3.5} />
      <Mark x={c.x} y={c.y} p={span(t, 0.1, 0.2)} />
      <Readout x={345} y={105} p={final} gap={32} lines={[
        { text: `ángulo central α = ${fmt(target, 0)}°`, color: MANIM.white },
        { text: `arco = α/360 · 2πr ≈ ${fmt(rad)} r`, color: MANIM.yellow },
        { text: `cuerda = 2r sen(α/2) ≈ ${fmt(2 * Math.sin(rad / 2))} r`, color: MANIM.coral },
      ]} />
    </>
  )
}

/** Razones trigonométricas: en el triángulo rectángulo, en la circunferencia unitaria, y arcos y cuerdas. */
export function TrigonometryScene(props: SceneProps) {
  if (props.v.modo === 'unitaria') return <UnitCircleView {...props} />
  if (props.v.modo === 'cuerda') return <ChordView {...props} />
  return <RightTriangleView {...props} />
}
