import { ease, fmt, HEIGHT, MANIM, pathOf, span, WIDTH, type Point } from './manimMath'
import { Arrow, Guide, Label, Mark, Readout, Stroke } from './primitives'
import type { SceneProps } from './sceneProps'

const rad = (deg: number) => (deg * Math.PI) / 180
const lerp = (a: Point, b: Point, p: number): Point => ({ x: a.x + (b.x - a.x) * p, y: a.y + (b.y - a.y) * p })

// ───────────────────────────── ondas y luz ─────────────────────────────

/** Onda que avanza: longitud de onda, amplitud y c = λ · f. Al subir la frecuencia, λ se acorta y c no cambia. */
function WaveView({ t, v }: SceneProps) {
  const high = String(v.f) === 'alta'
  const lambda = high ? 110 : 220
  const amp = 58
  const base = 190
  const left = 40
  const right = 600
  const phase = 2 * Math.PI * 2 * ease(span(t, 0, 0.8))
  const drawn = left + (right - left) * ease(span(t, 0.04, 0.4))
  const points: Point[] = []
  for (let x = left; x <= drawn; x += 3) points.push({ x, y: base - amp * Math.sin((2 * Math.PI * (x - left)) / lambda - phase + Math.PI / 2) })
  const crest1 = left
  const crest2 = left + lambda
  const marks = span(t, 0.82, 0.92)
  const final = span(t, 0.88, 1)
  return (
    <>
      <Stroke d={`M ${left} ${base} L ${right} ${base}`} color={MANIM.axis} p={span(t, 0, 0.08)} width={1.2} />
      {points.length > 1 && <path d={pathOf(points)} fill="none" stroke={MANIM.cyan} strokeWidth={3} strokeLinecap="round" />}
      <Arrow x1={crest1} y1={base - amp - 22} x2={crest2} y2={base - amp - 22} color={MANIM.yellow} p={marks} width={2} />
      <Arrow x1={crest2} y1={base - amp - 22} x2={crest1} y2={base - amp - 22} color={MANIM.yellow} p={marks} width={2} />
      <Label x={(crest1 + crest2) / 2} y={base - amp - 32} color={MANIM.yellow} p={marks} size={18}>λ</Label>
      <Guide x1={crest2} y1={base} x2={crest2} y2={base - amp} color={MANIM.green} p={marks} />
      <Label x={crest2 + 10} y={base - amp / 2} color={MANIM.green} p={marks} anchor="start" size={16}>A</Label>
      <Readout x={330} y={300} p={final} gap={24} lines={[
        { text: high ? 'frecuencia alta: λ más corta' : 'frecuencia baja: λ más larga', color: MANIM.white },
        { text: 'c = λ · f   y   T = 1 / f', color: MANIM.yellow },
      ]} />
    </>
  )
}

/** Reflexión: el ángulo de incidencia es igual al de reflexión, ambos medidos desde la normal. */
function ReflectionView({ t, v }: SceneProps) {
  const theta = Number(v.theta) || 40
  const hit = { x: 320, y: 250 }
  const len = 200
  const from = { x: hit.x - len * Math.sin(rad(theta)), y: hit.y - len * Math.cos(rad(theta)) }
  const to = { x: hit.x + len * Math.sin(rad(theta)), y: hit.y - len * Math.cos(rad(theta)) }
  const final = span(t, 0.85, 1)
  return (
    <>
      <Stroke d={`M 90 ${hit.y} L 550 ${hit.y}`} color={MANIM.white} p={span(t, 0, 0.12)} width={3} />
      <Label x={540} y={hit.y + 26} color={MANIM.axis} p={span(t, 0.05, 0.15)} anchor="end" size={15} italic={false}>espejo</Label>
      <Guide x1={hit.x} y1={hit.y} x2={hit.x} y2={40} p={span(t, 0.12, 0.22)} />
      <Label x={hit.x} y={32} color={MANIM.axis} p={span(t, 0.15, 0.25)} size={14} italic={false}>normal</Label>
      <Arrow x1={from.x} y1={from.y} x2={hit.x} y2={hit.y} color={MANIM.yellow} p={ease(span(t, 0.22, 0.5))} />
      <Arrow x1={hit.x} y1={hit.y} x2={to.x} y2={to.y} color={MANIM.cyan} p={ease(span(t, 0.5, 0.75))} />
      <Label x={hit.x - 34} y={hit.y - 70} color={MANIM.yellow} p={span(t, 0.7, 0.8)} size={17}>θᵢ</Label>
      <Label x={hit.x + 34} y={hit.y - 70} color={MANIM.cyan} p={span(t, 0.74, 0.84)} size={17}>θᵣ</Label>
      <Readout x={18} y={300} p={final} lines={[{ text: `θᵢ = θᵣ = ${fmt(theta)}°`, color: MANIM.green }, { text: 'los ángulos se miden desde la normal', color: MANIM.axis }]} />
    </>
  )
}

/** Refracción: al entrar al agua la luz va más lenta y su rayo se acerca a la normal; la frecuencia no cambia. */
function RefractionView({ t, v }: SceneProps) {
  const theta = Number(v.theta) || 50
  const theta2 = Math.asin(Math.sin(rad(theta)) / 1.33)
  const hit = { x: 320, y: 170 }
  const from = { x: hit.x - 190 * Math.sin(rad(theta)), y: hit.y - 190 * Math.cos(rad(theta)) }
  const to = { x: hit.x + 190 * Math.sin(theta2), y: hit.y + 190 * Math.cos(theta2) }
  const final = span(t, 0.85, 1)
  return (
    <>
      {span(t, 0, 0.12) > 0 && <rect x={0} y={hit.y} width={WIDTH} height={HEIGHT - hit.y} fill={MANIM.cyan} opacity={0.1 * span(t, 0, 0.12)} />}
      <Stroke d={`M 0 ${hit.y} L ${WIDTH} ${hit.y}`} color={MANIM.cyan} p={span(t, 0, 0.12)} width={1.6} />
      <Label x={24} y={hit.y - 12} color={MANIM.axis} p={span(t, 0.05, 0.15)} anchor="start" size={15} italic={false}>aire</Label>
      <Label x={24} y={hit.y + 26} color={MANIM.cyan} p={span(t, 0.05, 0.15)} anchor="start" size={15} italic={false}>agua</Label>
      <Guide x1={hit.x} y1={20} x2={hit.x} y2={HEIGHT - 10} p={span(t, 0.12, 0.22)} />
      <Arrow x1={from.x} y1={from.y} x2={hit.x} y2={hit.y} color={MANIM.yellow} p={ease(span(t, 0.22, 0.5))} />
      <Arrow x1={hit.x} y1={hit.y} x2={to.x} y2={to.y} color={MANIM.yellow} p={ease(span(t, 0.5, 0.75))} />
      <Label x={hit.x - 30} y={hit.y - 60} color={MANIM.yellow} p={span(t, 0.7, 0.8)} size={17}>θ₁</Label>
      <Label x={hit.x + 22} y={hit.y + 80} color={MANIM.yellow} p={span(t, 0.74, 0.84)} size={17}>θ₂</Label>
      <Readout x={400} y={60} p={final} gap={24} lines={[
        { text: 'más lenta en el agua:', color: MANIM.white },
        { text: 'se acerca a la normal', color: MANIM.white },
        { text: 'n = c / v', color: MANIM.green },
      ]} />
    </>
  )
}

export function WavesScene(props: SceneProps) {
  if (props.v.modo === 'reflexion') return <ReflectionView {...props} />
  if (props.v.modo === 'refraccion') return <RefractionView {...props} />
  return <WaveView {...props} />
}

// ───────────────────────────── reacción química ─────────────────────────────

interface Atom {
  el: 'H' | 'O'
  from: Point
  to: Point
}

const H = (x: number, y: number) => ({ x, y })

/** 2 H₂ + O₂ → 2 H₂O, o con O₂ de más para ver el reactivo limitante. */
const REACTIONS = {
  balance: {
    atoms: [
      { el: 'H', from: H(60, 130), to: H(452, 136) },
      { el: 'H', from: H(86, 130), to: H(500, 136) },
      { el: 'H', from: H(60, 230), to: H(452, 236) },
      { el: 'H', from: H(86, 230), to: H(500, 236) },
      { el: 'O', from: H(190, 180), to: H(476, 118) },
      { el: 'O', from: H(222, 180), to: H(476, 218) },
    ] as Atom[],
    before: [[0, 1], [2, 3], [4, 5]],
    after: [[0, 4], [1, 4], [2, 5], [3, 5]],
    equation: '2 H₂ + O₂ → 2 H₂O',
    note: [{ text: 'H: 4 → 4    O: 2 → 2', color: MANIM.green }, { text: 'los átomos se reordenan: la masa se conserva', color: MANIM.axis }],
  },
  limitante: {
    atoms: [
      { el: 'H', from: H(60, 130), to: H(452, 136) },
      { el: 'H', from: H(86, 130), to: H(500, 136) },
      { el: 'H', from: H(60, 230), to: H(452, 236) },
      { el: 'H', from: H(86, 230), to: H(500, 236) },
      { el: 'O', from: H(190, 130), to: H(476, 118) },
      { el: 'O', from: H(222, 130), to: H(476, 218) },
      { el: 'O', from: H(190, 230), to: H(570, 300) },
      { el: 'O', from: H(222, 230), to: H(602, 300) },
    ] as Atom[],
    before: [[0, 1], [2, 3], [4, 5], [6, 7]],
    after: [[0, 4], [1, 4], [2, 5], [3, 5], [6, 7]],
    equation: '2 H₂ + 2 O₂ → 2 H₂O + O₂',
    note: [{ text: 'limitante: H₂, se acaba primero', color: MANIM.yellow }, { text: 'sobra 1 O₂: está en exceso', color: MANIM.coral }],
  },
} as const

export function ReactionScene({ t, v }: SceneProps) {
  const reaction = REACTIONS[(String(v.modo) as keyof typeof REACTIONS)] ?? REACTIONS.balance
  const move = ease(span(t, 0.3, 0.72))
  const atoms = reaction.atoms.map((a) => ({ ...a, at: lerp(a.from, a.to, move) }))
  const oldBonds = 1 - span(t, 0.22, 0.34)
  const newBonds = span(t, 0.68, 0.8)
  const final = span(t, 0.84, 1)
  const key = ([a, b]: readonly number[]) => `${a}-${b}`
  const kept = new Set(reaction.before.map(key).filter((k) => reaction.after.some((b) => key(b) === k)))
  const bond = ([a, b]: readonly number[], opacity: number, stage: string) => (
    <line key={`${stage}${key([a, b])}`} x1={atoms[a].at.x} y1={atoms[a].at.y} x2={atoms[b].at.x} y2={atoms[b].at.y} stroke={MANIM.white} strokeWidth={4} opacity={opacity} />
  )
  const shown = span(t, 0.08, 0.2)
  return (
    <>
      <Label x={130} y={40} color={MANIM.axis} p={span(t, 0, 0.12)} size={15} italic={false}>reactantes</Label>
      <Label x={490} y={40} color={MANIM.axis} p={span(t, 0, 0.12)} size={15} italic={false}>productos</Label>
      <Arrow x1={270} y1={35} x2={360} y2={35} color={MANIM.white} p={span(t, 0.05, 0.2)} width={2} />
      {reaction.before.map((b) => bond(b, kept.has(key(b)) ? shown : oldBonds * shown, 'antes'))}
      {reaction.after.filter((b) => !kept.has(key(b))).map((b) => bond(b, newBonds, 'despues'))}
      {atoms.map((a, i) => (
        <g key={i} opacity={span(t, 0.04 + i * 0.012, 0.12 + i * 0.012)}>
          <circle cx={a.at.x} cy={a.at.y} r={a.el === 'O' ? 16 : 10} fill={a.el === 'O' ? MANIM.coral : MANIM.white} />
          <text x={a.at.x} y={a.at.y + 5} textAnchor="middle" fontSize={a.el === 'O' ? 15 : 12} fill={MANIM.bg} fontWeight={600}>{a.el}</text>
        </g>
      ))}
      <Label x={320} y={HEIGHT - 52} p={span(t, 0.75, 0.88)} size={20} italic={false}>{reaction.equation}</Label>
      <Readout x={320} y={HEIGHT - 26} anchor="middle" p={final} gap={22} lines={reaction.note} />
    </>
  )
}

// ───────────────────────────── tectónica de placas ─────────────────────────────

/** Borde convergente como el chileno: Nazca subduce bajo la Sudamericana; hipocentro en profundidad, epicentro arriba. */
function ConvergentView({ t }: SceneProps) {
  const surface = 150
  const hypo = { x: 400, y: 238 }
  const epi = { x: 400, y: surface - 8 }
  const waves = span(t, 0.6, 0.9)
  const final = span(t, 0.86, 1)
  const slabTop = pathOf([{ x: 20, y: surface }, { x: 300, y: surface }, { x: 380, y: 200 }, { x: 520, y: 330 }])
  const slabBottom = pathOf([{ x: 20, y: surface + 30 }, { x: 290, y: surface + 30 }, { x: 360, y: 228 }, { x: 480, y: 345 }])
  const continent = pathOf([{ x: 300, y: surface }, { x: 360, y: surface - 4 }, { x: 420, y: surface - 40 }, { x: 450, y: surface - 70 }, { x: 470, y: surface - 52 }, { x: 520, y: surface - 30 }, { x: 620, y: surface - 10 }])
  return (
    <>
      {span(t, 0, 0.1) > 0 && <rect x={0} y={surface - 22} width={300} height={22} fill={MANIM.cyan} opacity={0.12 * span(t, 0, 0.1)} />}
      <Stroke d={slabTop} color={MANIM.cyan} p={ease(span(t, 0.02, 0.3))} width={3} />
      <Stroke d={slabBottom} color={MANIM.cyan} p={ease(span(t, 0.08, 0.34))} width={1.6} />
      <Stroke d={continent} color={MANIM.white} p={ease(span(t, 0.12, 0.38))} width={3} />
      <Stroke d={pathOf([{ x: 450, y: surface - 70 }, { x: 446, y: surface - 82 }, { x: 456, y: surface - 92 }])} color={MANIM.coral} p={span(t, 0.38, 0.46)} width={2.5} />
      <Arrow x1={120} y1={surface - 36} x2={220} y2={surface - 36} color={MANIM.cyan} p={span(t, 0.3, 0.42)} />
      <Arrow x1={600} y1={surface - 50} x2={540} y2={surface - 50} color={MANIM.white} p={span(t, 0.32, 0.44)} />
      <Label x={30} y={surface + 54} color={MANIM.cyan} p={span(t, 0.34, 0.44)} anchor="start" size={15} italic={false}>placa de Nazca (oceánica)</Label>
      <Label x={630} y={surface + 40} color={MANIM.white} p={span(t, 0.36, 0.46)} anchor="end" size={15} italic={false}>placa Sudamericana (continental)</Label>
      <Label x={456} y={surface - 102} color={MANIM.coral} p={span(t, 0.44, 0.52)} size={14} italic={false}>volcán</Label>
      {[0, 1, 2].map((i) => {
        const r = 14 + (i * 22 + waves * 60)
        return waves > 0 ? <circle key={i} cx={hypo.x} cy={hypo.y} r={r} fill="none" stroke={MANIM.yellow} strokeWidth={1.5} opacity={(1 - waves) * 0.9 + 0.1} /> : null
      })}
      <Mark x={hypo.x} y={hypo.y} color={MANIM.yellow} p={span(t, 0.5, 0.58)} r={6} />
      <Guide x1={hypo.x} y1={hypo.y} x2={epi.x} y2={epi.y + 8} color={MANIM.yellow} p={span(t, 0.56, 0.66)} />
      <Mark x={epi.x} y={epi.y + 8} color={MANIM.green} p={span(t, 0.64, 0.72)} r={6} />
      <Label x={hypo.x + 14} y={hypo.y + 22} color={MANIM.yellow} p={span(t, 0.56, 0.64)} anchor="start" size={16} italic={false}>hipocentro</Label>
      <Label x={epi.x - 12} y={epi.y - 8} color={MANIM.green} p={span(t, 0.68, 0.76)} anchor="end" size={16} italic={false}>epicentro</Label>
      <Readout x={18} y={30} p={final} lines={[{ text: 'borde convergente: subducción', color: MANIM.white }, { text: 'sismos, volcanes y cordilleras', color: MANIM.axis }]} />
    </>
  )
}

/** Borde divergente: las placas se separan y el magma que sube forma nuevo suelo oceánico (dorsal). */
function DivergentView({ t }: SceneProps) {
  const surface = 170
  const gap = 8 + 26 * ease(span(t, 0.2, 0.7))
  const final = span(t, 0.84, 1)
  return (
    <>
      <Stroke d={`M 20 ${surface} L ${320 - gap} ${surface}`} color={MANIM.white} p={span(t, 0, 0.15)} width={3} />
      <Stroke d={`M ${320 + gap} ${surface} L 620 ${surface}`} color={MANIM.white} p={span(t, 0, 0.15)} width={3} />
      <Stroke d={`M 20 ${surface + 34} L ${320 - gap} ${surface + 34}`} color={MANIM.white} p={span(t, 0.05, 0.2)} width={1.5} />
      <Stroke d={`M ${320 + gap} ${surface + 34} L 620 ${surface + 34}`} color={MANIM.white} p={span(t, 0.05, 0.2)} width={1.5} />
      <Stroke d={pathOf([{ x: 320, y: 330 }, { x: 320, y: surface + 30 }, { x: 320, y: surface - 6 }])} color={MANIM.coral} p={ease(span(t, 0.25, 0.65))} width={Math.max(4, gap * 0.6)} />
      <Arrow x1={260} y1={surface - 30} x2={150} y2={surface - 30} color={MANIM.cyan} p={span(t, 0.2, 0.4)} />
      <Arrow x1={380} y1={surface - 30} x2={490} y2={surface - 30} color={MANIM.cyan} p={span(t, 0.2, 0.4)} />
      <Label x={350} y={HEIGHT - 12} color={MANIM.coral} p={span(t, 0.6, 0.72)} anchor="start" size={15} italic={false}>el magma sube y forma corteza nueva</Label>
      <Readout x={18} y={30} p={final} lines={[{ text: 'borde divergente: las placas se separan', color: MANIM.white }, { text: 'dorsal oceánica y nuevo suelo oceánico', color: MANIM.axis }]} />
    </>
  )
}

/** Borde transformante, visto desde arriba: las placas se deslizan de lado y generan sismos. */
function TransformView({ t }: SceneProps) {
  const shift = 40 * ease(span(t, 0.25, 0.8))
  const final = span(t, 0.84, 1)
  return (
    <>
      <Stroke d={pathOf([{ x: 120, y: 70 - shift }, { x: 315, y: 70 - shift }, { x: 315, y: 250 - shift }, { x: 120, y: 250 - shift }], true)} color={MANIM.white} p={span(t, 0, 0.2)} />
      <Stroke d={pathOf([{ x: 325, y: 70 + shift }, { x: 520, y: 70 + shift }, { x: 520, y: 250 + shift }, { x: 325, y: 250 + shift }], true)} color={MANIM.cyan} p={span(t, 0, 0.2)} />
      <Guide x1={320} y1={20} x2={320} y2={HEIGHT - 20} color={MANIM.yellow} p={span(t, 0.15, 0.25)} />
      <Arrow x1={217} y1={210} x2={217} y2={110} color={MANIM.white} p={span(t, 0.25, 0.45)} />
      <Arrow x1={422} y1={110} x2={422} y2={210} color={MANIM.cyan} p={span(t, 0.25, 0.45)} />
      <Label x={330} y={36} color={MANIM.yellow} p={span(t, 0.2, 0.3)} anchor="start" size={15} italic={false}>falla</Label>
      <Readout x={18} y={HEIGHT - 32} p={final} lines={[{ text: 'borde transformante: se deslizan de lado', color: MANIM.white }, { text: 'sismos, como en la falla de San Andrés', color: MANIM.axis }]} />
    </>
  )
}

export function TectonicsScene(props: SceneProps) {
  if (props.v.modo === 'divergente') return <DivergentView {...props} />
  if (props.v.modo === 'transformante') return <TransformView {...props} />
  return <ConvergentView {...props} />
}

// ───────────────────────────── movimiento ─────────────────────────────

/**
 * MRU: marcas igualmente espaciadas y gráfico posición–tiempo recto (pendiente = velocidad).
 * MRUA desde el reposo: marcas cada vez más separadas y gráfico velocidad–tiempo cuya área es el desplazamiento.
 */
export function MotionScene({ t, v }: SceneProps) {
  const accelerated = v.modo === 'mrua'
  const speed = Number(v.v) || 4
  const a = 1.6
  const seconds = 5
  const time = seconds * span(t, 0.05, 0.7)
  const position = (s: number) => (accelerated ? 0.5 * a * s * s : speed * s)
  const total = position(seconds)
  const meter = 520 / total
  const trackY = 62
  const x0 = 60
  const origin = { x: 90, y: 320 }
  const gw = 440
  const gh = 190
  const yMax = accelerated ? a * seconds : total
  const gx = (s: number) => origin.x + (s / seconds) * gw
  const gy = (value: number) => origin.y - (value / yMax) * gh
  const curveTo = (limit: number) => {
    const points: Point[] = []
    for (let i = 0; i <= 40; i++) {
      const s = (limit * i) / 40
      points.push({ x: gx(s), y: gy(accelerated ? a * s : position(s)) })
    }
    return pathOf(points)
  }
  const final = span(t, 0.84, 1)
  const area = span(t, 0.7, 0.84)
  return (
    <>
      <Stroke d={`M ${x0 - 20} ${trackY} L ${x0 + 540} ${trackY}`} color={MANIM.axis} p={span(t, 0, 0.06)} width={1.4} />
      {Array.from({ length: seconds + 1 }, (_, s) => (
        <g key={s} opacity={time >= s ? 1 : 0}>
          <line x1={x0 + position(s) * meter} y1={trackY - 9} x2={x0 + position(s) * meter} y2={trackY + 9} stroke={MANIM.yellow} strokeWidth={2} />
          {(s === 0 || (position(s) - position(s - 1)) * meter > 28) && (
            <text x={x0 + position(s) * meter} y={trackY + 26} textAnchor="middle" fontSize={12} fill={MANIM.axis}>{`${s} s`}</text>
          )}
        </g>
      ))}
      <Mark x={x0 + position(time) * meter} y={trackY} color={MANIM.cyan} r={8} p={span(t, 0, 0.05)} />

      <Stroke d={`M ${origin.x} ${origin.y} L ${origin.x + gw + 10} ${origin.y}`} color={MANIM.axis} p={span(t, 0, 0.08)} width={1.4} />
      <Stroke d={`M ${origin.x} ${origin.y} L ${origin.x} ${origin.y - gh - 10}`} color={MANIM.axis} p={span(t, 0, 0.08)} width={1.4} />
      <Label x={origin.x + gw + 14} y={origin.y + 18} color={MANIM.axis} p={span(t, 0, 0.1)} anchor="end" size={14} italic={false}>t (s)</Label>
      <Label x={origin.x - 8} y={origin.y - gh - 14} color={MANIM.axis} p={span(t, 0, 0.1)} anchor="end" size={14} italic={false}>{accelerated ? 'v (m/s)' : 'x (m)'}</Label>
      {accelerated && area > 0 && (
        <polygon points={`${gx(0)},${gy(0)} ${gx(seconds)},${gy(0)} ${gx(seconds)},${gy(a * seconds)}`} fill={MANIM.green} opacity={0.22 * area} />
      )}
      {time > 0 && <path d={curveTo(time)} fill="none" stroke={MANIM.cyan} strokeWidth={3} strokeLinecap="round" />}
      <Readout x={origin.x + 20} y={origin.y - gh + 8} p={final} gap={24} lines={accelerated ? [
        { text: `v = a · t,  a = ${fmt(a)} m/s²`, color: MANIM.cyan },
        { text: `área = ½ · ${seconds} · ${fmt(a * seconds)} = ${fmt(total)} m`, color: MANIM.green },
        { text: 'el área bajo v–t es el desplazamiento', color: MANIM.axis },
      ] : [
        { text: `x = v · t,  v = ${fmt(speed)} m/s`, color: MANIM.cyan },
        { text: 'la pendiente de x–t es la velocidad', color: MANIM.axis },
      ]} />
    </>
  )
}
