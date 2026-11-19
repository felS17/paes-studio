import { useId } from 'react'

/*
 * Diagramas esquemáticos de los 17 subtemas vigentes de Ciencias (temario DEMRE 2027). Cada rótulo sale del temario
 * del repo (scripts/pipeline/temario/ciencias.py): si un dato no está ahí, no se dibuja. SVG monocromo con los
 * tokens del tema (`currentColor` y `--accent`), sin animación.
 */

const W = 360
const H = 200
const MUTED = 'var(--color-zinc-500)'

function Text({ x, y, children, anchor = 'middle', size = 11, muted, bold }: {
  x: number
  y: number
  children: React.ReactNode
  anchor?: 'start' | 'middle' | 'end'
  size?: number
  muted?: boolean
  bold?: boolean
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={bold ? 600 : 400} fill={muted ? MUTED : 'currentColor'}>
      {children}
    </text>
  )
}

/** Recuadro con una o dos líneas centradas. */
function Box({ x, y, w, h, lines, accent }: { x: number; y: number; w: number; h: number; lines: string[]; accent?: boolean }) {
  const top = y + h / 2 - ((lines.length - 1) * 12) / 2 + 4
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={5} fill="none" stroke={accent ? 'var(--accent)' : 'currentColor'} strokeWidth={accent ? 1.5 : 1} opacity={accent ? 1 : 0.7} />
      {lines.map((line, i) => <Text key={i} x={x + w / 2} y={top + i * 12} size={9.5}>{line}</Text>)}
    </g>
  )
}

function Arrow({ x1, y1, x2, y2, marker, accent }: { x1: number; y1: number; x2: number; y2: number; marker: string; accent?: boolean }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={accent ? 'var(--accent)' : 'currentColor'} strokeWidth={1.2} markerEnd={`url(#${marker})`} />
}

function Frame({ label, children }: { label: string; children: (marker: string) => React.ReactNode }) {
  const marker = `flecha-${useId().replace(/:/g, '')}`
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full text-zinc-800 dark:text-zinc-200">
      <defs>
        <marker id={marker} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" />
        </marker>
      </defs>
      {children(marker)}
    </svg>
  )
}

/** Cadena de recuadros en una fila (o dos), unidos por flechas. */
function Flow({ label, steps, note, rows = 1 }: { label: string; steps: string[][]; note?: string; rows?: 1 | 2 }) {
  const perRow = Math.ceil(steps.length / rows)
  const gap = 14
  const w = (W - 16 - gap * (perRow - 1)) / perRow
  const h = 46
  const rowY = rows === 1 ? [68] : [34, 116]
  return (
    <Frame label={label}>
      {(m) => (
        <>
          {steps.map((lines, i) => {
            const row = Math.floor(i / perRow)
            const col = i % perRow
            const x = 8 + col * (w + gap)
            const y = rowY[row]
            const last = i === steps.length - 1
            const endOfRow = col === perRow - 1
            return (
              <g key={i}>
                <Box x={x} y={y} w={w} h={h} lines={lines} accent={last} />
                {!last && !endOfRow && <Arrow x1={x + w + 1} y1={y + h / 2} x2={x + w + gap - 1} y2={y + h / 2} marker={m} />}
                {!last && endOfRow && <Arrow x1={x + w / 2} y1={y + h + 1} x2={8 + w / 2} y2={rowY[row + 1] - 1} marker={m} />}
              </g>
            )
          })}
          {note && <Text x={W / 2} y={H - 10} muted>{note}</Text>}
        </>
      )}
    </Frame>
  )
}

// ───────────────────────────── Biología ─────────────────────────────

function Celula() {
  const labels: [number, string][] = [
    [62, 'núcleo: material genético'],
    [92, 'mitocondria: respiración (ATP)'],
    [122, 'ribosomas: síntesis de proteínas'],
    [152, 'Golgi y retículo: transporte'],
    [182, 'lisosoma: digestión celular'],
  ]
  const targets = [[92, 92], [130, 60], [70, 126], [128, 134], [52, 70]]
  return (
    <Frame label="Célula eucarionte animal con sus organelos y la función de cada uno">
      {() => (
        <>
          <ellipse cx={90} cy={104} rx={80} ry={76} fill="none" stroke="currentColor" strokeWidth={1.5} />
          <circle cx={92} cy={92} r={24} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
          <ellipse cx={130} cy={60} rx={18} ry={9} fill="none" stroke="currentColor" />
          <path d="M116 60 q4 -6 8 0 t8 0 t8 0" fill="none" stroke="currentColor" strokeWidth={0.8} />
          {[[64, 122], [72, 130], [80, 124], [60, 134]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={2} fill="currentColor" />)}
          {[0, 6, 12].map((d) => <path key={d} d={`M${112 + d / 2} ${126 + d} q16 -8 32 0`} fill="none" stroke="currentColor" />)}
          <circle cx={52} cy={70} r={7} fill="none" stroke="currentColor" />
          <Text x={90} y={20} muted size={10}>membrana plasmática</Text>
          {labels.map(([y, text], i) => (
            <g key={text}>
              <line x1={targets[i][0]} y1={targets[i][1]} x2={178} y2={y - 4} stroke={MUTED} strokeWidth={0.6} />
              <Text x={182} y={y} anchor="start" size={9.5}>{text}</Text>
            </g>
          ))}
          <Text x={182} y={22} anchor="start" size={9} muted>la vegetal tiene además pared</Text>
          <Text x={182} y={34} anchor="start" size={9} muted>celular, cloroplastos y vacuola</Text>
        </>
      )}
    </Frame>
  )
}

function Nervioso() {
  return (
    <Frame label="Neurona con dendritas, soma y axón, y el recorrido del arco reflejo">
      {(m) => (
        <>
          <circle cx={60} cy={44} r={14} fill="none" stroke="currentColor" strokeWidth={1.3} />
          {[-50, -20, 20, 50].map((a) => {
            const r = (a * Math.PI) / 180
            return <line key={a} x1={60 - 14 * Math.cos(r)} y1={44 - 14 * Math.sin(r)} x2={60 - 34 * Math.cos(r)} y2={44 - 34 * Math.sin(r)} stroke="currentColor" />
          })}
          <line x1={74} y1={44} x2={250} y2={44} stroke="var(--accent)" strokeWidth={2} />
          <path d="M250 44 l10 -8 M250 44 l10 8 M250 44 l12 0" stroke="currentColor" fill="none" />
          <Text x={8} y={88} anchor="start" size={10}>dendritas: reciben</Text>
          <Text x={60} y={20} size={10} muted>soma</Text>
          <Text x={162} y={36} size={10}>axón: conduce el impulso</Text>
          <Text x={300} y={74} size={10}>sinapsis:</Text>
          <Text x={300} y={87} size={9.5} muted>neurotransmisores</Text>
          <Text x={8} y={112} anchor="start" size={10} bold>arco reflejo (sin pasar por el cerebro)</Text>
          {[['receptor'], ['neurona', 'sensitiva'], ['médula', 'espinal'], ['neurona', 'motora'], ['efector']].map((t, i) => (
            <g key={t.join()}>
              <Box x={8 + i * 70} y={124} w={60} h={36} lines={t} accent={i === 2} />
              {i < 4 && <Arrow x1={69 + i * 70} y1={142} x2={77 + i * 70} y2={142} marker={m} />}
            </g>
          ))}
          <Text x={W / 2} y={186} muted size={10}>efector: músculo o glándula</Text>
        </>
      )}
    </Frame>
  )
}

function Reproduccion() {
  const x = (day: number) => 16 + ((day - 1) / 27) * 328
  const parts: [number, number, string][] = [[1, 5, 'menstruación'], [6, 13, 'fase folicular'], [15, 28, 'fase lútea']]
  return (
    <Frame label="Ciclo de 28 días: menstruación, fase folicular, ovulación cerca del día 14 y fase lútea">
      {() => (
        <>
          <Text x={8} y={30} anchor="start" size={10} bold>ciclo de 28 días</Text>
          {parts.map(([a, b, label]) => (
            <g key={label}>
              <rect x={x(a)} y={70} width={x(b + 1) - x(a) - 2} height={26} rx={4} fill="none" stroke="currentColor" opacity={0.75} />
              <Text x={(x(a) + x(b + 1)) / 2} y={87} size={a === 1 ? 8 : 10}>{label}</Text>
              <Text x={(x(a) + x(b + 1)) / 2} y={114} size={9.5} muted>{`días ${a}–${b}`}</Text>
            </g>
          ))}
          <line x1={x(14.5)} y1={56} x2={x(14.5)} y2={104} stroke="var(--accent)" strokeWidth={2} />
          <Text x={x(14.5)} y={50} size={10.5} bold>ovulación (día 14 aprox.)</Text>
          <Text x={W / 2} y={150} size={10}>el endometrio se engrosa en la fase folicular</Text>
          <Text x={W / 2} y={168} size={10} muted>sin fecundación, bajan las hormonas y parte otro ciclo</Text>
        </>
      )}
    </Frame>
  )
}

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number) {
  const p = (a: number) => [cx + r * Math.cos(((a - 90) * Math.PI) / 180), cy + r * Math.sin(((a - 90) * Math.PI) / 180)]
  const [x0, y0] = p(a0)
  const [x1, y1] = p(a1)
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`
}

function Genetica() {
  const cx = 92
  const cy = 104
  const phases: [number, number, string][] = [[0, 130, 'G₁'], [134, 230, 'S'], [234, 300, 'G₂'], [304, 356, 'M']]
  return (
    <Frame label="Ciclo celular: interfase con G1, S y G2, y mitosis; comparación entre mitosis y meiosis">
      {() => (
        <>
          {phases.map(([a, b, label]) => {
            const mid = ((a + b) / 2 - 90) * (Math.PI / 180)
            return (
              <g key={label}>
                <path d={arcPath(cx, cy, 62, a, b)} fill="none" stroke={label === 'M' ? 'var(--accent)' : 'currentColor'} strokeWidth={label === 'M' ? 4 : 3} />
                <Text x={cx + 80 * Math.cos(mid)} y={cy + 80 * Math.sin(mid) + 4} size={11} bold>{label}</Text>
              </g>
            )
          })}
          <Text x={cx} y={cy - 4} size={10.5} bold>interfase</Text>
          <Text x={cx} y={cy + 10} size={9.5} muted>G₁ + S + G₂</Text>
          <Text x={cx} y={cy + 24} size={9.5} muted>en S se replica el ADN</Text>
          <Text x={196} y={36} anchor="start" size={10.5} bold>M: mitosis</Text>
          <Text x={196} y={50} anchor="start" size={9.5} muted>profase, metafase, anafase, telofase</Text>
          <Text x={196} y={84} anchor="start" size={10.5}>mitosis: 2n → 2 células 2n</Text>
          <Text x={196} y={98} anchor="start" size={9.5} muted>idénticas: crecimiento y reparación</Text>
          <Text x={196} y={124} anchor="start" size={10.5}>meiosis: 2n → 4 células n</Text>
          <Text x={196} y={138} anchor="start" size={9.5} muted>distintas: gametos (variabilidad)</Text>
          <Text x={196} y={170} anchor="start" size={9.5} muted>humanos: 2n = 46, n = 23</Text>
        </>
      )}
    </Frame>
  )
}

const Evolucion = () => (
  <Flow
    label="Selección natural: variabilidad, presión del ambiente, reproducción diferencial y cambio en la población"
    steps={[['variabilidad', 'heredable'], ['presión del', 'ambiente'], ['supervivencia', 'y reproducción', 'diferencial'], ['cambia la', 'frecuencia', 'de los rasgos']]}
    note="evolucionan las poblaciones, no los individuos"
  />
)

function Ecologia() {
  return (
    <Frame label="Fotosíntesis en el cloroplasto y respiración celular en la mitocondria: la materia se recicla y la energía fluye">
      {(m) => (
        <>
          <Box x={16} y={62} w={120} h={56} lines={['cloroplasto', 'fotosíntesis']} accent />
          <Box x={224} y={62} w={120} h={56} lines={['mitocondria', 'respiración celular']} />
          <Arrow x1={140} y1={76} x2={220} y2={76} marker={m} />
          <Text x={180} y={68} size={10}>glucosa + O₂</Text>
          <Arrow x1={220} y1={106} x2={140} y2={106} marker={m} />
          <Text x={180} y={124} size={10}>CO₂ + H₂O</Text>
          <Arrow x1={76} y1={22} x2={76} y2={58} marker={m} accent />
          <Text x={84} y={30} anchor="start" size={10}>luz</Text>
          <Arrow x1={284} y1={122} x2={284} y2={156} marker={m} />
          <Text x={292} y={150} anchor="start" size={10}>ATP</Text>
          <Text x={W / 2} y={186} size={10} muted>la materia se recicla; la energía fluye</Text>
        </>
      )}
    </Frame>
  )
}

// ───────────────────────────── Física ─────────────────────────────

function Luz() {
  const bands = ['radio', 'microondas', 'infrarrojo', 'visible', 'UV', 'rayos X', 'gamma']
  const w = (W - 16) / bands.length
  return (
    <Frame label="Espectro electromagnético ordenado por frecuencia, de las ondas de radio a los rayos gamma">
      {(m) => (
        <>
          <Text x={8} y={30} anchor="start" size={10} bold>espectro electromagnético</Text>
          {bands.map((b, i) => (
            <g key={b}>
              <rect x={8 + i * w} y={52} width={w - 3} height={34} rx={4} fill="none" stroke={b === 'visible' ? 'var(--accent)' : 'currentColor'} strokeWidth={b === 'visible' ? 1.5 : 1} opacity={b === 'visible' ? 1 : 0.7} />
              <Text x={8 + i * w + (w - 3) / 2} y={73} size={8.5}>{b}</Text>
            </g>
          ))}
          <Arrow x1={16} y1={110} x2={W - 16} y2={110} marker={m} />
          <Text x={W / 2} y={128} size={10}>más frecuencia · menor longitud de onda · más energía</Text>
          <Text x={W / 2} y={156} size={10.5}>c = λ · f    T = 1 / f    n = c / v</Text>
          <Text x={W / 2} y={178} size={10} muted>en el vacío todas viajan a c = 3 · 10⁸ m/s</Text>
        </>
      )}
    </Frame>
  )
}

function Cinematica() {
  const graph = (ox: number, title: string, area: boolean, label: string, yLabel: string, note: string) => (
    <g>
      <line x1={ox} y1={150} x2={ox + 140} y2={150} stroke="currentColor" />
      <line x1={ox} y1={150} x2={ox} y2={40} stroke="currentColor" />
      <Text x={ox + 140} y={164} anchor="end" size={9.5} muted>t</Text>
      <Text x={ox - 4} y={44} anchor="end" size={9.5} muted>{yLabel}</Text>
      {area && <polygon points={`${ox},150 ${ox + 120},150 ${ox + 120},62`} fill="var(--accent)" opacity={0.15} />}
      <line x1={ox} y1={area ? 150 : 140} x2={ox + 120} y2={area ? 62 : 58} stroke="var(--accent)" strokeWidth={2} />
      <Text x={ox + 70} y={26} size={10.5} bold>{title}</Text>
      <Text x={ox + 70} y={180} size={10}>{label}</Text>
      <Text x={ox + 70} y={194} size={9.5} muted>{note}</Text>
    </g>
  )
  return (
    <Frame label="Gráfico posición-tiempo del MRU, cuya pendiente es la velocidad, y velocidad-tiempo del MRUA, cuya área es el desplazamiento">
      {() => (
        <>
          {graph(28, 'MRU: x–t', false, 'pendiente = velocidad', 'x', 'x = x₀ + v·t')}
          {graph(204, 'MRUA: v–t', true, 'área = desplazamiento', 'v', 'pendiente = aceleración')}
        </>
      )}
    </Frame>
  )
}

function Dinamica() {
  return (
    <Frame label="Diagrama de fuerzas sobre un bloque: peso, normal, fuerza aplicada y roce">
      {(m) => (
        <>
          <line x1={20} y1={130} x2={250} y2={130} stroke="currentColor" />
          <rect x={100} y={90} width={60} height={40} rx={3} fill="none" stroke="currentColor" strokeWidth={1.5} />
          <Arrow x1={130} y1={110} x2={130} y2={172} marker={m} />
          <Text x={138} y={170} anchor="start" size={10}>P = m·g</Text>
          <Arrow x1={130} y1={90} x2={130} y2={38} marker={m} />
          <Text x={138} y={44} anchor="start" size={10}>N</Text>
          <Arrow x1={160} y1={106} x2={222} y2={106} marker={m} accent />
          <Text x={226} y={102} anchor="start" size={10}>F</Text>
          <Arrow x1={100} y1={124} x2={52} y2={124} marker={m} />
          <Text x={48} y={118} anchor="end" size={10}>fᵣ = μ·N</Text>
          <Text x={262} y={40} anchor="start" size={10.5} bold>leyes de Newton</Text>
          <Text x={262} y={60} anchor="start" size={9.5}>1.ª: F neta = 0 →</Text>
          <Text x={262} y={73} anchor="start" size={9.5} muted>reposo o v constante</Text>
          <Text x={262} y={95} anchor="start" size={9.5}>2.ª: F neta = m·a</Text>
          <Text x={262} y={117} anchor="start" size={9.5}>3.ª: acción y reacción</Text>
          <Text x={262} y={130} anchor="start" size={9.5} muted>en cuerpos distintos</Text>
          <Text x={262} y={152} anchor="start" size={9.5}>resorte: F = k·x</Text>
        </>
      )}
    </Frame>
  )
}

function Universo() {
  return (
    <Frame label="Órbita elíptica con el Sol en un foco: el planeta va más rápido en el perihelio que en el afelio">
      {() => (
        <>
          <ellipse cx={150} cy={92} rx={120} ry={56} fill="none" stroke="currentColor" />
          <circle cx={70} cy={92} r={10} fill="var(--accent)" />
          <Text x={70} y={116} size={10}>Sol (foco)</Text>
          <circle cx={30} cy={92} r={4} fill="currentColor" />
          <Text x={30} y={78} size={9.5}>perihelio</Text>
          <Text x={30} y={130} size={9.5} muted>más rápido</Text>
          <circle cx={270} cy={92} r={4} fill="currentColor" />
          <Text x={270} y={78} size={9.5}>afelio</Text>
          <Text x={270} y={130} size={9.5} muted>más lento</Text>
          <Text x={W / 2} y={16} size={10.5} bold>leyes de Kepler</Text>
          <Text x={W / 2} y={172} size={9.5}>1.ª órbitas elípticas · 2.ª áreas iguales en tiempos iguales</Text>
          <Text x={W / 2} y={188} size={9.5}>3.ª T² ∝ a³ (el cuadrado del período, al cubo del semieje)</Text>
        </>
      )}
    </Frame>
  )
}

function Tierra() {
  const cx = 110
  const cy = 196
  return (
    <Frame label="Capas de la geosfera: corteza, manto y núcleo; la litosfera se divide en placas que se mueven sobre la astenosfera">
      {() => (
        <>
          <path d={`M${cx - 100} ${cy} A100 100 0 0 1 ${cx + 100} ${cy}`} fill="none" stroke="var(--accent)" strokeWidth={3} />
          <path d={`M${cx - 92} ${cy} A92 92 0 0 1 ${cx + 92} ${cy}`} fill="none" stroke="currentColor" strokeDasharray="3 3" />
          <path d={`M${cx - 44} ${cy} A44 44 0 0 1 ${cx + 44} ${cy}`} fill="none" stroke="currentColor" strokeWidth={1.5} />
          <Text x={cx} y={cy - 16} size={10.5}>núcleo</Text>
          <Text x={cx} y={cy - 62} size={10.5}>manto</Text>
          <line x1={cx + 60} y1={cy - 80} x2={232} y2={58} stroke={MUTED} strokeWidth={0.6} />
          <Text x={236} y={50} anchor="start" size={10}>corteza</Text>
          <line x1={cx + 66} y1={cy - 64} x2={232} y2={92} stroke={MUTED} strokeWidth={0.6} />
          <Text x={236} y={88} anchor="start" size={10}>litosfera: corteza +</Text>
          <Text x={236} y={101} anchor="start" size={10}>parte superior del manto</Text>
          <Text x={236} y={114} anchor="start" size={9.5} muted>dividida en placas</Text>
          <line x1={cx + 84} y1={cy - 34} x2={232} y2={146} stroke={MUTED} strokeWidth={0.6} />
          <Text x={236} y={146} anchor="start" size={10}>astenosfera</Text>
          <Text x={236} y={159} anchor="start" size={9.5} muted>las placas se desplazan</Text>
          <Text x={236} y={172} anchor="start" size={9.5} muted>sobre ella (convección)</Text>
        </>
      )}
    </Frame>
  )
}

function Battery({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <line x1={x - 8} y1={y - 6} x2={x - 8} y2={y + 6} stroke="currentColor" strokeWidth={1.5} />
      <line x1={x - 3} y1={y - 11} x2={x - 3} y2={y + 11} stroke="currentColor" strokeWidth={1.5} />
    </g>
  )
}

function Resistor({ x, y, vertical }: { x: number; y: number; vertical?: boolean }) {
  return vertical
    ? <rect x={x - 5} y={y - 14} width={10} height={28} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.5} />
    : <rect x={x - 14} y={y - 5} width={28} height={10} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.5} />
}

function Electricidad() {
  return (
    <Frame label="Circuito en serie y circuito en paralelo con una batería y dos resistencias">
      {() => (
        <>
          <rect x={20} y={40} width={130} height={90} fill="none" stroke="currentColor" />
          <Battery x={20} y={85} />
          <Resistor x={62} y={40} />
          <Resistor x={110} y={40} />
          <Text x={85} y={28} size={10.5} bold>serie</Text>
          <Text x={85} y={150} size={10}>misma corriente</Text>
          <Text x={85} y={164} size={10}>los voltajes se suman</Text>
          <Text x={85} y={182} size={9.5} muted>R = R₁ + R₂</Text>

          <rect x={210} y={40} width={130} height={90} fill="none" stroke="currentColor" />
          <line x1={275} y1={40} x2={275} y2={130} stroke="currentColor" />
          <Battery x={210} y={85} />
          <Resistor x={275} y={85} vertical />
          <Resistor x={340} y={85} vertical />
          <Text x={275} y={28} size={10.5} bold>paralelo</Text>
          <Text x={275} y={150} size={10}>mismo voltaje</Text>
          <Text x={275} y={164} size={10}>las corrientes se suman</Text>
          <Text x={275} y={182} size={9.5} muted>R equivalente menor que cada una</Text>
          <Text x={W / 2} y={12} size={9.5} muted>V = I·R · P = V·I · E = P·t</Text>
        </>
      )}
    </Frame>
  )
}

// ───────────────────────────── Química ─────────────────────────────

function Atomo() {
  const cx = 84
  const cy = 92
  return (
    <Frame label="Modelo de Bohr: núcleo con protones y neutrones y electrones en niveles de energía; número atómico y número másico">
      {(m) => (
        <>
          <circle cx={cx} cy={cy} r={34} fill="none" stroke="currentColor" opacity={0.6} />
          <circle cx={cx} cy={cy} r={62} fill="none" stroke="currentColor" opacity={0.6} />
          <circle cx={cx} cy={cy} r={12} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
          <Text x={cx} y={cy + 4} size={9}>p⁺ n⁰</Text>
          {[[cx + 34, cy], [cx - 34, cy], [cx, cy - 62], [cx + 44, cy + 44], [cx - 44, cy + 44]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r={3.5} fill="currentColor" />)}
          <Text x={cx + 48} y={cy - 40} anchor="start" size={9.5} muted>e⁻</Text>
          <Text x={176} y={40} anchor="start" size={10.5}>Z = número de protones</Text>
          <Text x={176} y={58} anchor="start" size={10.5}>A = protones + neutrones</Text>
          <Text x={176} y={76} anchor="start" size={10.5}>neutrones = A − Z</Text>
          <Text x={176} y={94} anchor="start" size={9.5} muted>isótopos: igual Z, distinto A</Text>
          <Text x={176} y={112} anchor="start" size={9.5} muted>catión: perdió e⁻ · anión: ganó e⁻</Text>
          {['Dalton', 'Thomson', 'Rutherford', 'Bohr'].map((t, i) => (
            <g key={t}>
              <Text x={30 + i * 92} y={182} size={10} bold={t === 'Bohr'}>{t}</Text>
              {i < 3 && <Arrow x1={62 + i * 92} y1={178} x2={88 + i * 92} y2={178} marker={m} />}
            </g>
          ))}
        </>
      )}
    </Frame>
  )
}

function Organica() {
  const row = (y: number, bonds: 1 | 2 | 3, hyb: string, geo: string, extra: string) => (
    <g key={hyb}>
      <Text x={36} y={y + 4} size={12} bold>C</Text>
      <Text x={124} y={y + 4} size={12} bold>C</Text>
      {Array.from({ length: bonds }, (_, i) => (
        <line key={i} x1={46} y1={y + (i - (bonds - 1) / 2) * 5} x2={114} y2={y + (i - (bonds - 1) / 2) * 5} stroke={i === 0 ? 'currentColor' : 'var(--accent)'} strokeWidth={1.3} />
      ))}
      <Text x={152} y={y + 4} anchor="start" size={10.5}>{hyb}</Text>
      <Text x={190} y={y + 4} anchor="start" size={10}>{geo}</Text>
      <Text x={262} y={y + 4} anchor="start" size={9.5} muted>{extra}</Text>
    </g>
  )
  return (
    <Frame label="Hibridación del carbono según sus enlaces: sp3 con enlaces simples, sp2 con un doble enlace y sp con un triple enlace">
      {() => (
        <>
          <Text x={8} y={22} anchor="start" size={10} bold>el carbono forma 4 enlaces</Text>
          {row(56, 1, 'sp³', 'tetraédrica', 'solo simples')}
          {row(100, 2, 'sp²', 'plana', '1 enlace π')}
          {row(144, 3, 'sp', 'lineal', '2 enlaces π')}
          <Text x={W / 2} y={186} size={9.5} muted>cada doble enlace aporta un enlace π · alcanos: CₙH₂ₙ₊₂</Text>
        </>
      )}
    </Frame>
  )
}

function Reacciones() {
  return (
    <Frame label="Ecuación balanceada: la masa se conserva; y el paso de gramos a moles y a partículas">
      {(m) => (
        <>
          <Box x={16} y={22} w={130} h={40} lines={['2 H₂ + O₂', 'reactantes']} />
          <Arrow x1={150} y1={42} x2={206} y2={42} marker={m} accent />
          <Box x={212} y={22} w={130} h={40} lines={['2 H₂O', 'productos']} />
          <Text x={W / 2} y={84} size={10}>masa de reactantes = masa de productos (Lavoisier)</Text>
          <Text x={W / 2} y={98} size={9.5} muted>los coeficientes relacionan moles, no gramos</Text>
          <Box x={16} y={124} w={90} h={36} lines={['masa (g)']} />
          <Arrow x1={110} y1={142} x2={140} y2={142} marker={m} />
          <Box x={144} y={124} w={72} h={36} lines={['moles (n)']} accent />
          <Arrow x1={220} y1={142} x2={250} y2={142} marker={m} />
          <Box x={254} y={124} w={90} h={36} lines={['partículas (N)']} />
          <Text x={125} y={176} size={9.5} muted>n = m / M</Text>
          <Text x={235} y={176} size={9.5} muted>N = n · 6,02·10²³</Text>
        </>
      )}
    </Frame>
  )
}

function Beaker({ x, label, level }: { x: number; label: string; level: number }) {
  return (
    <g>
      <path d={`M${x} 60 L${x} 140 Q${x} 148 ${x + 8} 148 L${x + 52} 148 Q${x + 60} 148 ${x + 60} 140 L${x + 60} 60`} fill="none" stroke="currentColor" strokeWidth={1.3} />
      <rect x={x + 2} y={148 - level} width={56} height={level - 2} fill="var(--accent)" opacity={0.15} />
      <Text x={x + 30} y={166} size={9.5}>{label}</Text>
    </g>
  )
}

function Disoluciones() {
  return (
    <Frame label="Disolución: soluto más disolvente; al diluir se mantiene la cantidad de soluto">
      {(m) => (
        <>
          <Text x={8} y={22} anchor="start" size={10.5}>disolución = soluto + disolvente (mezcla homogénea)</Text>
          <Text x={8} y={38} anchor="start" size={10}>M = moles de soluto / litros de disolución</Text>
          <Beaker x={40} label="C₁, V₁" level={40} />
          <Arrow x1={112} y1={104} x2={172} y2={104} marker={m} accent />
          <Text x={142} y={96} size={9.5} muted>+ disolvente</Text>
          <Beaker x={184} label="C₂, V₂" level={74} />
          <Text x={258} y={88} anchor="start" size={10.5} bold>C₁·V₁ = C₂·V₂</Text>
          <Text x={258} y={104} anchor="start" size={9.5} muted>los moles de</Text>
          <Text x={258} y={117} anchor="start" size={9.5} muted>soluto no cambian</Text>
          <Text x={W / 2} y={188} size={9.5} muted>molalidad: por kg de disolvente</Text>
        </>
      )}
    </Frame>
  )
}

const Habilidades = () => (
  <Flow
    rows={2}
    label="Esquema de una investigación: observación, pregunta, hipótesis, diseño experimental, resultados y conclusión"
    steps={[['observación'], ['pregunta de', 'investigación'], ['hipótesis'], ['diseño: variables', 'y grupo control'], ['resultados'], ['conclusión']]}
    note="independiente: la que cambias · dependiente: la que mides"
  />
)

const DIAGRAMS: Record<string, { title: string; Component: () => React.ReactNode }> = {
  'cs-celula': { title: 'célula eucarionte', Component: Celula },
  'cs-nervioso': { title: 'neurona y arco reflejo', Component: Nervioso },
  'cs-reproduccion': { title: 'ciclo menstrual', Component: Reproduccion },
  'cs-genetica': { title: 'ciclo celular', Component: Genetica },
  'cs-evolucion': { title: 'selección natural', Component: Evolucion },
  'cs-ecologia': { title: 'fotosíntesis y respiración', Component: Ecologia },
  'cs-luz': { title: 'espectro electromagnético', Component: Luz },
  'cs-cinematica': { title: 'gráficos del movimiento', Component: Cinematica },
  'cs-dinamica': { title: 'diagrama de fuerzas', Component: Dinamica },
  'cs-universo': { title: 'órbita de un planeta', Component: Universo },
  'cs-tierra': { title: 'capas de la Tierra', Component: Tierra },
  'cs-electricidad': { title: 'circuitos en serie y en paralelo', Component: Electricidad },
  'cs-atomo': { title: 'estructura del átomo', Component: Atomo },
  'cs-organica': { title: 'enlaces del carbono', Component: Organica },
  'cs-reacciones': { title: 'reacción y mol', Component: Reacciones },
  'cs-disoluciones': { title: 'disolución y dilución', Component: Disoluciones },
  'cs-habilidades': { title: 'esquema de una investigación', Component: Habilidades },
}

/** Diagrama esquemático al inicio del resumen de un subtema de Ciencias. Sin diagrama, no ocupa lugar. */
export function ScienceDiagram({ id }: { id: string }) {
  const entry = DIAGRAMS[id]
  if (!entry) return null
  const { Component, title } = entry
  return (
    // Los rótulos científicos (ADN, G₁, Z, Sol) conservan sus mayúsculas.
    <figure className="rounded-lg border border-zinc-200/80 bg-surface px-2 pt-2 pb-1 normal-case dark:border-zinc-800/80">
      <Component />
      <figcaption className="px-1 pt-1 font-mono text-[11px] text-zinc-500 lowercase dark:text-zinc-400">esquema: {title}</figcaption>
    </figure>
  )
}
