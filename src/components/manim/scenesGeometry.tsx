import { ease, ellipse, fmt, HEIGHT, MANIM, pathOf, span, type Point } from './manimMath'
import { Guide, Label, Mark, Readout, Stroke } from './primitives'
import type { SceneProps } from './sceneProps'

const READOUT_X = 385
/** Centro y ancho de las figuras: el resto de la pizarra queda para las lecturas. */
const FIG_X = 190
const FIG_W = 290

function RectangleView({ t, v }: SceneProps) {
  const a = Number(v.a)
  const b = Number(v.b)
  const u = Math.min(FIG_W / a, 230 / b)
  const x0 = FIG_X + 10 - (a * u) / 2
  const y0 = 190 - (b * u) / 2
  const corners = [{ x: x0, y: y0 }, { x: x0 + a * u, y: y0 }, { x: x0 + a * u, y: y0 + b * u }, { x: x0, y: y0 + b * u }]
  const final = span(t, 0.8, 1)
  return (
    <>
      <Stroke d={pathOf(corners, true)} color={MANIM.cyan} p={span(t, 0, 0.35)} width={3} />
      <Stroke d={pathOf(corners, true)} color={MANIM.cyan} p={span(t, 0.35, 0.55)} width={0} fill />
      <Guide x1={corners[0].x} y1={corners[0].y} x2={corners[2].x} y2={corners[2].y} color={MANIM.yellow} p={span(t, 0.55, 0.75)} />
      <Label x={x0 + (a * u) / 2} y={y0 + b * u + 24} color={MANIM.cyan} p={span(t, 0.1, 0.2)} italic={false}>{`a = ${fmt(a)}`}</Label>
      <Label x={x0 - 10} y={y0 + (b * u) / 2 + 6} anchor="end" color={MANIM.cyan} p={span(t, 0.2, 0.3)} italic={false}>{`b = ${fmt(b)}`}</Label>
      <Readout x={READOUT_X} y={110} p={final} gap={32} lines={[
        { text: `P = 2(a + b) = ${fmt(2 * (a + b))}`, color: MANIM.white },
        { text: `A = a · b = ${fmt(a * b)}`, color: MANIM.cyan },
        { text: `d = √(a² + b²) ≈ ${fmt(Math.hypot(a, b))}`, color: MANIM.yellow },
      ]} />
    </>
  )
}

function TriangleView({ t, v }: SceneProps) {
  const b = Number(v.a)
  const h = Number(v.h)
  const u = Math.min(FIG_W / b, 230 / h)
  const x0 = FIG_X - (b * u) / 2
  const y0 = 190 + (h * u) / 2
  const footX = x0 + b * u * 0.38
  const A = { x: x0, y: y0 }
  const B = { x: x0 + b * u, y: y0 }
  const C = { x: footX, y: y0 - h * u }
  const final = span(t, 0.82, 1)
  return (
    <>
      <Stroke d={pathOf([A, B, { x: B.x, y: C.y }, { x: A.x, y: C.y }], true)} color={MANIM.axis} p={span(t, 0.48, 0.68)} width={1} />
      <Stroke d={pathOf([A, B, C], true)} color={MANIM.cyan} p={span(t, 0, 0.32)} width={3} fill />
      <Guide x1={footX} y1={y0} x2={footX} y2={C.y} color={MANIM.yellow} p={span(t, 0.32, 0.48)} />
      <Label x={(A.x + B.x) / 2} y={y0 + 24} color={MANIM.cyan} p={span(t, 0.1, 0.2)} italic={false}>{`base = ${fmt(b)}`}</Label>
      <Label x={footX + 8} y={y0 - (h * u) / 2} anchor="start" color={MANIM.yellow} p={span(t, 0.4, 0.48)} italic={false}>{`altura = ${fmt(h)}`}</Label>
      <Readout x={READOUT_X} y={120} p={final} gap={32} lines={[
        { text: 'la mitad del rectángulo', color: MANIM.axis },
        { text: 'A = base · altura / 2', color: MANIM.white },
        { text: `= ${fmt(b)} · ${fmt(h)} / 2 = ${fmt((b * h) / 2)}`, color: MANIM.cyan },
      ]} />
    </>
  )
}

/** Figura en L: el área se obtiene al separarla en dos rectángulos. */
function CompositeView({ t, v }: SceneProps) {
  const a = Number(v.a)
  const h = Number(v.h)
  const c = Number(v.c)
  const d = Number(v.d)
  const u = Math.min(FIG_W / a, 230 / h)
  const x0 = FIG_X - (a * u) / 2
  const y0 = 190 - (h * u) / 2
  const at = (x: number, y: number) => ({ x: x0 + x * u, y: y0 + y * u })
  const shape = [at(0, 0), at(a - c, 0), at(a - c, d), at(a, d), at(a, h), at(0, h)]
  const left = [at(0, 0), at(a - c, 0), at(a - c, h), at(0, h)]
  const right = [at(a - c, d), at(a, d), at(a, h), at(a - c, h)]
  const area1 = (a - c) * h
  const area2 = c * (h - d)
  return (
    <>
      <Stroke d={pathOf(shape, true)} color={MANIM.white} p={span(t, 0, 0.3)} width={3} />
      <Stroke d={pathOf(left, true)} color={MANIM.cyan} p={span(t, 0.3, 0.55)} fill />
      <Stroke d={pathOf(right, true)} color={MANIM.yellow} p={span(t, 0.55, 0.8)} fill />
      <Label x={at((a - c) / 2, 0).x} y={at(0, h / 2).y} color={MANIM.cyan} p={span(t, 0.45, 0.55)} italic={false}>{fmt(area1)}</Label>
      <Label x={at(a - c / 2, 0).x} y={at(0, (h + d) / 2).y} color={MANIM.yellow} p={span(t, 0.7, 0.8)} italic={false}>{fmt(area2)}</Label>
      <Readout x={READOUT_X} y={130} p={span(t, 0.82, 1)} gap={32} lines={[
        { text: 'dos rectángulos', color: MANIM.axis },
        { text: `A = ${fmt(area1)} + ${fmt(area2)} = ${fmt(area1 + area2)}` },
      ]} />
    </>
  )
}

function CircleView({ t, v }: SceneProps) {
  const r = Number(v.r)
  const angle = Number(v.angulo)
  const c = { x: 195, y: 185 }
  const R = 130
  const swept = angle * ease(span(t, 0.48, 0.72))
  const sector = [c, ...ellipse(c.x, c.y, R, R, 0, swept)]
  const final = span(t, 0.8, 1)
  const end = { x: c.x + R * Math.cos((angle * Math.PI) / 180), y: c.y - R * Math.sin((angle * Math.PI) / 180) }
  return (
    <>
      <Stroke d={pathOf(ellipse(c.x, c.y, R, R))} color={MANIM.white} p={span(t, 0, 0.25)} width={2.5} />
      {swept > 0 && <path d={`${pathOf(sector)} Z`} fill={MANIM.green} fillOpacity={0.28} stroke={MANIM.green} strokeWidth={2} />}
      <Guide x1={c.x - R} y1={c.y} x2={c.x} y2={c.y} color={MANIM.yellow} p={span(t, 0.36, 0.48)} />
      <Stroke d={pathOf([c, { x: c.x + R, y: c.y }])} color={MANIM.cyan} p={span(t, 0.25, 0.36)} width={3.5} />
      <Mark x={c.x} y={c.y} p={span(t, 0.2, 0.25)} />
      <Label x={c.x + R / 2} y={c.y + 22} color={MANIM.cyan} p={span(t, 0.3, 0.36)} italic={false}>{`r = ${fmt(r)}`}</Label>
      <Label x={c.x - R / 2} y={c.y + 22} color={MANIM.yellow} p={span(t, 0.42, 0.48)} italic={false}>{`d = ${fmt(2 * r)}`}</Label>
      {final > 0 && <Label x={c.x + (end.x - c.x) * 0.45 + 8} y={c.y + (end.y - c.y) * 0.45 - 8} color={MANIM.green} p={final} anchor="start">{`${fmt(angle, 0)}°`}</Label>}
      <Readout x={READOUT_X} y={100} p={final} gap={32} lines={[
        { text: `perímetro = 2πr = ${fmt(2 * r)}π` },
        { text: `A = πr² = ${fmt(r * r)}π`, color: MANIM.cyan },
        { text: `sector = (${fmt(angle, 0)}/360) · πr²`, color: MANIM.green },
        { text: `= ${fmt((angle / 360) * r * r)}π`, color: MANIM.green },
      ]} />
    </>
  )
}

/** Prisma en proyección oblicua: la base se levanta hasta la altura `h`. */
function PrismView({ t, v }: SceneProps) {
  const a = Number(v.a)
  const b = Number(v.b)
  const h = Number(v.h)
  const u = Math.min(210 / (a + b * 0.5), 200 / (h + b * 0.35))
  const O = { x: 75, y: 300 }
  const dx = b * u * 0.5
  const dy = -b * u * 0.35
  const lift = ease(span(t, 0.25, 0.68)) * h * u
  const base = [O, { x: O.x + a * u, y: O.y }, { x: O.x + a * u + dx, y: O.y + dy }, { x: O.x + dx, y: O.y + dy }]
  const top = base.map((p) => ({ x: p.x, y: p.y - lift }))
  const final = span(t, 0.75, 1)
  return (
    <>
      <Stroke d={pathOf(base, true)} color={MANIM.cyan} p={span(t, 0, 0.25)} fill />
      {lift > 0 && (
        <>
          <Guide x1={base[3].x} y1={base[3].y} x2={top[3].x} y2={top[3].y} />
          <Stroke d={pathOf([base[0], base[1], top[1], top[0]], true)} color={MANIM.white} width={2.2} fill fillOpacity={0.08} />
          <Stroke d={pathOf([base[1], base[2], top[2], top[1]], true)} color={MANIM.white} width={2.2} fill fillOpacity={0.05} />
          <Stroke d={pathOf(top, true)} color={MANIM.cyan} fill />
        </>
      )}
      <Label x={O.x + (a * u) / 2} y={O.y + 24} color={MANIM.cyan} p={span(t, 0.12, 0.25)} italic={false}>{`a = ${fmt(a)}`}</Label>
      <Label x={base[1].x + dx / 2 + 8} y={O.y + dy / 2 + 12} anchor="start" color={MANIM.cyan} p={span(t, 0.12, 0.25)} italic={false}>{`b = ${fmt(b)}`}</Label>
      <Label x={O.x - 10} y={O.y - lift / 2 + 5} anchor="end" color={MANIM.yellow} p={span(t, 0.5, 0.68)} italic={false}>{`h = ${fmt(h)}`}</Label>
      <Readout x={READOUT_X} y={120} p={final} gap={32} lines={[
        { text: 'área basal · altura', color: MANIM.axis },
        { text: `V = a · b · h`, color: MANIM.white },
        { text: `= ${fmt(a)} · ${fmt(b)} · ${fmt(h)} = ${fmt(a * b * h)}`, color: MANIM.cyan },
      ]} />
    </>
  )
}

function CylinderConeView({ t, v, cone }: SceneProps & { cone: boolean }) {
  const r = Number(v.r)
  const h = Number(v.h)
  const u = Math.min(120 / r, 220 / h)
  const rx = r * u
  const ry = rx * 0.3
  const c = { x: FIG_X, y: 295 }
  const lift = ease(span(t, 0.25, 0.68)) * h * u
  const volume = cone ? (r * r * h) / 3 : r * r * h
  const final = span(t, 0.75, 1)
  return (
    <>
      <Stroke d={pathOf(ellipse(c.x, c.y, rx, ry))} color={MANIM.cyan} p={span(t, 0, 0.25)} fill />
      {lift > 0 && (
        <>
          <Stroke d={pathOf([{ x: c.x - rx, y: c.y }, cone ? { x: c.x, y: c.y - lift } : { x: c.x - rx, y: c.y - lift }])} color={MANIM.white} />
          <Stroke d={pathOf([{ x: c.x + rx, y: c.y }, cone ? { x: c.x, y: c.y - lift } : { x: c.x + rx, y: c.y - lift }])} color={MANIM.white} />
          {!cone && <Stroke d={pathOf(ellipse(c.x, c.y - lift, rx, ry))} color={MANIM.cyan} fill />}
          <Guide x1={c.x} y1={c.y} x2={c.x} y2={c.y - lift} color={MANIM.yellow} />
        </>
      )}
      <Stroke d={pathOf([c, { x: c.x + rx, y: c.y }])} color={MANIM.coral} p={span(t, 0.12, 0.25)} width={3} />
      <Label x={c.x + rx / 2} y={c.y + ry + 22} color={MANIM.coral} p={span(t, 0.18, 0.25)} italic={false}>{`r = ${fmt(r)}`}</Label>
      <Label x={c.x + 8} y={c.y - lift / 2} anchor="start" color={MANIM.yellow} p={span(t, 0.5, 0.68)} italic={false}>{`h = ${fmt(h)}`}</Label>
      <Readout x={READOUT_X} y={120} p={final} gap={32} lines={[
        { text: cone ? 'un tercio del cilindro' : 'área basal · altura', color: MANIM.axis },
        { text: cone ? 'V = π r² h / 3' : 'V = π r² h' },
        { text: `= ${fmt(volume)}π`, color: MANIM.cyan },
      ]} />
    </>
  )
}

function SphereView({ t, v }: SceneProps) {
  const r = Number(v.r)
  const c = { x: FIG_X, y: 185 }
  const R = 130
  const final = span(t, 0.75, 1)
  return (
    <>
      <Stroke d={pathOf(ellipse(c.x, c.y, R, R))} color={MANIM.white} p={span(t, 0, 0.3)} width={3} fill fillOpacity={0.05} />
      <Stroke d={pathOf(ellipse(c.x, c.y, R, R * 0.3))} color={MANIM.cyan} p={span(t, 0.3, 0.55)} />
      <Stroke d={pathOf([c, { x: c.x + R, y: c.y }])} color={MANIM.coral} p={span(t, 0.55, 0.72)} width={3} />
      <Label x={c.x + R / 2} y={c.y - 10} color={MANIM.coral} p={span(t, 0.62, 0.72)} italic={false}>{`r = ${fmt(r)}`}</Label>
      <Readout x={READOUT_X} y={120} p={final} gap={32} lines={[
        { text: `V = 4πr³/3 ≈ ${fmt((4 * r ** 3) / 3)}π`, color: MANIM.cyan },
        { text: `S = 4πr² = ${fmt(4 * r * r)}π`, color: MANIM.white },
      ]} />
    </>
  )
}

/** Figuras planas y cuerpos: lados, alturas, áreas por descomposición, sector circular y volumen por proyección de la base. */
export function FigurasScene(props: SceneProps) {
  switch (props.v.forma) {
    case 'triangulo': return <TriangleView {...props} />
    case 'compuesta': return <CompositeView {...props} />
    case 'circulo': return <CircleView {...props} />
    case 'prisma': return <PrismView {...props} />
    case 'cilindro': return <CylinderConeView {...props} cone={false} />
    case 'cono': return <CylinderConeView {...props} cone />
    case 'esfera': return <SphereView {...props} />
    default: return <RectangleView {...props} />
  }
}

function ThalesView({ t, v }: SceneProps) {
  const a = Number(v.a)
  const b = Number(v.b)
  const c = Number(v.c)
  const d = Number(v.d)
  const V = { x: 60, y: 315 }
  const R1 = { x: 610, y: 90 }
  const R2 = { x: 610, y: 315 }
  const f1 = (0.92 * a) / (a + b)
  const f2 = 0.92
  const on = (end: Point, f: number) => ({ x: V.x + (end.x - V.x) * f, y: V.y + (end.y - V.y) * f })
  const A1 = on(R1, f1)
  const A2 = on(R1, f2)
  const B1 = on(R2, f1)
  const B2 = on(R2, f2)
  const seg = span(t, 0.62, 0.82)
  const final = span(t, 0.82, 1)
  return (
    <>
      <Stroke d={pathOf([V, R1])} color={MANIM.axis} p={span(t, 0, 0.14)} width={1.6} />
      <Stroke d={pathOf([V, R2])} color={MANIM.axis} p={span(t, 0.1, 0.24)} width={1.6} />
      <Stroke d={pathOf([{ x: A1.x, y: A1.y - 22 }, { x: B1.x, y: B1.y + 14 }])} color={MANIM.green} p={span(t, 0.24, 0.42)} />
      <Stroke d={pathOf([{ x: A2.x, y: A2.y - 22 }, { x: B2.x, y: B2.y + 14 }])} color={MANIM.green} p={span(t, 0.42, 0.6)} />
      <Stroke d={pathOf([V, A1])} color={MANIM.cyan} p={seg} width={4} />
      <Stroke d={pathOf([A1, A2])} color={MANIM.yellow} p={seg} width={4} />
      <Stroke d={pathOf([V, B1])} color={MANIM.cyan} p={seg} width={4} />
      <Stroke d={pathOf([B1, B2])} color={MANIM.yellow} p={seg} width={4} />
      <Label x={(V.x + A1.x) / 2 - 8} y={(V.y + A1.y) / 2 - 10} color={MANIM.cyan} p={seg} italic={false}>{fmt(a)}</Label>
      <Label x={(A1.x + A2.x) / 2 - 8} y={(A1.y + A2.y) / 2 - 10} color={MANIM.yellow} p={seg} italic={false}>{fmt(b)}</Label>
      <Label x={(V.x + B1.x) / 2} y={B1.y + 34} color={MANIM.cyan} p={seg} italic={false}>{fmt(c)}</Label>
      <Label x={(B1.x + B2.x) / 2} y={B1.y + 34} color={MANIM.yellow} p={seg} italic={false}>{fmt(d)}</Label>
      <Readout x={22} y={34} p={final} lines={[
        { text: 'las rectas verdes son paralelas, así que', color: MANIM.green },
        { text: `${fmt(a)} / ${fmt(b)} = ${fmt(c)} / ${fmt(d)}` },
        { text: 'y los dos triángulos con vértice común son semejantes', color: MANIM.axis },
      ]} />
    </>
  )
}

function PythagorasView({ t, v }: SceneProps) {
  const [a, b] = String(v.catetos).split('-').map(Number)
  const squared = a * a + b * b
  const c = Math.sqrt(squared)
  const exact = Number.isInteger(c)
  const u = 150 / Math.max(a, b)
  const O = { x: 215, y: 205 }
  const A = { x: O.x + a * u * 0.72, y: O.y }
  const B = { x: O.x, y: O.y - b * u * 0.72 }
  const k = u * 0.72
  const across = { x: b * k, y: -a * k }
  const add = (p: Point, q: Point) => ({ x: p.x + q.x, y: p.y + q.y })
  const squareA = [O, A, { x: A.x, y: A.y + a * k }, { x: O.x, y: O.y + a * k }]
  const squareB = [O, B, { x: B.x - b * k, y: B.y }, { x: O.x - b * k, y: O.y }]
  const squareC = [A, add(A, across), add(B, across), B]
  const final = span(t, 0.86, 1)
  const center = (points: Point[]) => ({ x: points.reduce((s, p) => s + p.x, 0) / 4, y: points.reduce((s, p) => s + p.y, 0) / 4 })
  // Con catetos muy distintos, un cuadrado queda chico: el rótulo no debe taparlo.
  const clampY = (y: number) => Math.min(HEIGHT - 12, Math.max(18, y))
  return (
    <>
      <Stroke d={pathOf(squareA, true)} color={MANIM.cyan} p={span(t, 0.18, 0.42)} fill />
      <Stroke d={pathOf(squareB, true)} color={MANIM.yellow} p={span(t, 0.42, 0.64)} fill />
      <Stroke d={pathOf(squareC, true)} color={MANIM.green} p={span(t, 0.64, 0.86)} fill />
      <Stroke d={pathOf([O, A, B], true)} color={MANIM.white} p={span(t, 0, 0.18)} width={3} />
      <Label x={center(squareA).x} y={clampY(center(squareA).y + 6)} color={MANIM.cyan} p={span(t, 0.3, 0.42)} italic={false}>{`a² = ${fmt(a * a)}`}</Label>
      <Label x={center(squareB).x} y={clampY(center(squareB).y + 6)} color={MANIM.yellow} p={span(t, 0.52, 0.64)} italic={false}>{`b² = ${fmt(b * b)}`}</Label>
      <Label x={center(squareC).x} y={clampY(center(squareC).y + 6)} color={MANIM.green} p={span(t, 0.74, 0.86)} italic={false}>{`c² = ${fmt(squared)}`}</Label>
      <Readout x={622} y={300} anchor="end" p={final} lines={[
        { text: `${fmt(a)}² + ${fmt(b)}² = ${fmt(squared)}` },
        { text: exact ? `hipotenusa = ${fmt(c)}` : `hipotenusa = √${fmt(squared)} ≈ ${fmt(c)}`, color: MANIM.green },
      ]} />
    </>
  )
}

/** Thales: paralelas que cortan dos rectas dejan segmentos proporcionales. Pitágoras: las áreas de los cuadrados. */
export function ThalesScene(props: SceneProps) {
  return props.v.modo === 'pitagoras' ? <PythagorasView {...props} /> : <ThalesView {...props} />
}
