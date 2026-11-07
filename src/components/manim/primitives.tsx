import { MANIM, HEIGHT, WIDTH } from './manimMath'

const SERIF = "'Newsreader Variable', 'Source Serif 4', Georgia, serif"

export function Stage({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={label} className="block h-auto w-full rounded-md" style={{ background: MANIM.bg }}>
      {children}
    </svg>
  )
}

/** Trazo que se dibuja solo: con `pathLength` en 1, `stroke-dashoffset` indica cuánto falta por recorrer. */
export function Stroke({ d, color, p = 1, width = 2.5, fill, fillOpacity = 0.16 }: {
  d: string
  color: string
  p?: number
  width?: number
  fill?: boolean
  fillOpacity?: number
}) {
  if (p <= 0) return null
  return (
    <path
      d={d}
      pathLength={1}
      fill={fill ? color : 'none'}
      fillOpacity={fill ? fillOpacity * p : 0}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={1}
      strokeDashoffset={1 - p}
    />
  )
}

/** Línea punteada de apoyo: aparece gradualmente porque su patrón ya ocupa el `stroke-dasharray`. */
export function Guide({ x1, y1, x2, y2, color = MANIM.axis, p = 1 }: { x1: number; y1: number; x2: number; y2: number; color?: string; p?: number }) {
  if (p <= 0) return null
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.2} strokeDasharray="5 5" opacity={p * 0.85} />
}

/** Flecha que crece desde su origen; la punta acompaña al trazo. */
export function Arrow({ x1, y1, x2, y2, color, p = 1, width = 3 }: { x1: number; y1: number; x2: number; y2: number; color: string; p?: number; width?: number }) {
  if (p <= 0) return null
  const tipX = x1 + (x2 - x1) * p
  const tipY = y1 + (y2 - y1) * p
  const length = Math.hypot(tipX - x1, tipY - y1)
  if (length < 1) return null
  const ux = (tipX - x1) / length
  const uy = (tipY - y1) / length
  const head = Math.min(11, length * 0.6)
  const baseX = tipX - ux * head
  const baseY = tipY - uy * head
  const side = head * 0.5
  return (
    <g>
      <line x1={x1} y1={y1} x2={baseX} y2={baseY} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon points={`${tipX},${tipY} ${baseX - uy * side},${baseY + ux * side} ${baseX + uy * side},${baseY - ux * side}`} fill={color} />
    </g>
  )
}

export function Mark({ x, y, color = MANIM.white, p = 1, r = 4.5 }: { x: number; y: number; color?: string; p?: number; r?: number }) {
  if (p <= 0) return null
  return <circle cx={x} cy={y} r={r * p} fill={color} />
}

export function Label({ x, y, children, color = MANIM.white, p = 1, size = 18, anchor = 'middle', italic = true }: {
  x: number
  y: number
  children: React.ReactNode
  color?: string
  p?: number
  size?: number
  anchor?: 'start' | 'middle' | 'end'
  italic?: boolean
}) {
  if (p <= 0) return null
  return (
    // El halo del color de la pizarra mantiene legible el texto cuando pasa sobre un trazo.
    <text x={x} y={y} fill={color} opacity={p} fontSize={size} textAnchor={anchor} fontFamily={SERIF} fontStyle={italic ? 'italic' : 'normal'} stroke={MANIM.bg} strokeWidth={4} paintOrder="stroke">
      {children}
    </text>
  )
}

/** Bloque de lecturas a un costado de la pizarra, cada línea con su color. */
export function Readout({ x, y, lines, p = 1, anchor = 'start', gap = 25 }: {
  x: number
  y: number
  lines: readonly { text: string; color?: string }[]
  p?: number
  anchor?: 'start' | 'middle' | 'end'
  gap?: number
}) {
  return (
    <>
      {lines.map((line, i) => (
        <Label key={line.text} x={x} y={y + i * gap} color={line.color} p={p} anchor={anchor} size={19} italic={false}>{line.text}</Label>
      ))}
    </>
  )
}

/** Cuadrícula tenue con ejes que se trazan desde el origen, centrada en (cx, cy). */
export function Plane({ cx, cy, unit, p = 1, labels = true }: { cx: number; cy: number; unit: number; p?: number; labels?: boolean }) {
  const vertical: number[] = []
  const horizontal: number[] = []
  for (let x = cx % unit; x <= WIDTH; x += unit) vertical.push(x)
  for (let y = cy % unit; y <= HEIGHT; y += unit) horizontal.push(y)
  return (
    <g>
      <g stroke={MANIM.grid} strokeWidth={1} opacity={p}>
        {vertical.map((x) => <line key={`v${x}`} x1={x} y1={0} x2={x} y2={HEIGHT} />)}
        {horizontal.map((y) => <line key={`h${y}`} x1={0} y1={y} x2={WIDTH} y2={y} />)}
      </g>
      <Stroke d={`M 0 ${cy} L ${WIDTH} ${cy}`} color={MANIM.axis} p={p} width={1.6} />
      <Stroke d={`M ${cx} ${HEIGHT} L ${cx} 0`} color={MANIM.axis} p={p} width={1.6} />
      {labels && (
        <>
          <Label x={WIDTH - 12} y={cy - 8} color={MANIM.axis} p={p} size={16}>x</Label>
          <Label x={cx + 12} y={16} color={MANIM.axis} p={p} size={16}>y</Label>
        </>
      )}
    </g>
  )
}

/** Cifras sobre los ejes, para leer coordenadas. Si las unidades quedan muy juntas, marca de a 2 o de a 5. */
export function Ticks({ cx, cy, unit, p = 1 }: { cx: number; cy: number; unit: number; p?: number }) {
  if (p <= 0) return null
  const step = unit >= 20 ? 1 : unit >= 10 ? 2 : 5
  const ticks: { key: string; x: number; y: number; text: number; anchor: 'middle' | 'end' }[] = []
  for (let n = step; n * unit < WIDTH / 2 + Math.abs(WIDTH / 2 - cx); n += step) {
    for (const sign of [1, -1]) {
      const x = cx + sign * n * unit
      if (x > 8 && x < WIDTH - 24) ticks.push({ key: `x${sign * n}`, x, y: cy + 15, text: sign * n, anchor: 'middle' })
      const y = cy - sign * n * unit
      if (y > 24 && y < HEIGHT - 8) ticks.push({ key: `y${sign * n}`, x: cx - 7, y: y + 4, text: sign * n, anchor: 'end' })
    }
  }
  return (
    <g>
      {ticks.map((tick) => (
        <Label key={tick.key} x={tick.x} y={tick.y} color={MANIM.axis} p={p} size={12} anchor={tick.anchor} italic={false}>
          {String(tick.text).replace('-', '−')}
        </Label>
      ))}
    </g>
  )
}
