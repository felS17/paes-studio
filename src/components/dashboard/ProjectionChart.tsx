import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { SUBJECTS, SUBJECT_ORDER } from '@/data/subjects'
import { useElementWidth } from '@/hooks/useElementWidth'
import { cn } from '@/lib/utils'
import type { AttemptRecord } from '@/types/analytics'
import { formatDate, formatShortDate } from '@/utils/format'
import { buildProjection, latestBySubject, MILESTONES, nextMilestone, type ProjectionPoint } from '@/utils/projection'
import { PAES_MAX, PAES_MIN } from '@/utils/scoring'

const PAD = { l: 40, r: 16, t: 14, b: 28 }
const MARKER_LIMIT = 40

interface Pt { x: number; y: number }

/** Curva monótona (Fritsch-Carlson): suave, sin rebases que inventen puntajes que nunca ocurrieron. */
function monotonePath(pts: Pt[]): string {
  const n = pts.length
  if (n < 2) return ''
  const dx: number[] = []
  const m: number[] = []
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x)
    m.push((pts[i + 1].y - pts[i].y) / dx[i])
  }
  const t: number[] = [m[0]]
  for (let i = 1; i < n - 1; i++) t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2)
  t.push(m[n - 2])
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0
      t[i + 1] = 0
      continue
    }
    const a = t[i] / m[i]
    const b = t[i + 1] / m[i]
    const s = a * a + b * b
    if (s > 9) {
      const tau = 3 / Math.sqrt(s)
      t[i] = tau * a * m[i]
      t[i + 1] = tau * b * m[i]
    }
  }
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3
    d += ` C${(pts[i].x + h).toFixed(1)},${(pts[i].y + t[i] * h).toFixed(1)} ${(pts[i + 1].x - h).toFixed(1)},${(pts[i + 1].y - t[i + 1] * h).toFixed(1)} ${pts[i + 1].x.toFixed(1)},${pts[i + 1].y.toFixed(1)}`
  }
  return d
}

function Tooltip({ point, prev, left, top, width }: { point: ProjectionPoint; prev?: ProjectionPoint; left: number; top: number; width: number }) {
  const delta = prev ? point.avg - prev.avg : null
  const shift = left < 110 ? '0%' : left > width - 110 ? '-100%' : '-50%'
  return (
    <div
      role="presentation"
      className="pointer-events-none absolute z-10 w-56 rounded-lg border border-zinc-200/80 bg-white px-3 py-2.5 dark:border-zinc-700/80 dark:bg-[#18181b]"
      style={{ left, top, transform: `translate(${shift}, calc(-100% - 12px))` }}
    >
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(point.finishedAt)}</p>
      <p className="mt-0.5 flex items-baseline gap-1.5">
        <span className="font-mono text-[20px] leading-none font-semibold tracking-tight tabular-nums">{point.avg}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">pts de promedio</span>
        {delta !== null && delta !== 0 && (
          <span className="ml-auto font-mono text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
            {delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`}
          </span>
        )}
      </p>
      <p className="mt-2 flex items-center gap-1.5 border-t border-zinc-200/80 pt-2 text-xs dark:border-zinc-800/80">
        <span className="text-zinc-500 dark:text-zinc-400">{SUBJECTS[point.subject].short}</span>
        <span className="min-w-0 flex-1 truncate">{point.examTitle}</span>
        <span className="font-mono font-medium tabular-nums">{point.score}</span>
      </p>
    </div>
  )
}

function ProjectionTable({ points }: { points: ProjectionPoint[] }) {
  return (
    <div className="max-h-72 overflow-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
      <table className="w-full text-left text-[12.5px] tabular-nums">
        <caption className="sr-only">Promedio de tu proyección después de cada ensayo entregado</caption>
        <thead className="sticky top-0 bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium">Fecha</th>
            <th scope="col" className="px-3 py-2 font-medium">Ensayo</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Puntaje</th>
            <th scope="col" className="px-3 py-2 text-right font-medium">Promedio</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.attemptId} className="border-t border-zinc-200/80 dark:border-zinc-800/80">
              <td className="px-3 py-2 whitespace-nowrap">{formatShortDate(p.finishedAt)}</td>
              <td className="max-w-[16rem] truncate px-3 py-2">{p.examTitle}</td>
              <td className="px-3 py-2 text-right font-mono">{p.score}</td>
              <td className="px-3 py-2 text-right font-mono font-medium">{p.avg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Plot({ points, width, onStart }: { points: ProjectionPoint[]; width: number; onStart: () => void }) {
  const [active, setActive] = useState<number | null>(null)
  const height = width < 520 ? 250 : 300
  const plotW = Math.max(10, width - PAD.l - PAD.r)
  const plotH = height - PAD.t - PAD.b
  const n = points.length
  const y = (v: number) => PAD.t + (1 - (v - PAES_MIN) / (PAES_MAX - PAES_MIN)) * plotH
  const x = (i: number) => (n === 1 ? PAD.l + plotW / 2 : PAD.l + (i / (n - 1)) * plotW)
  const pts = points.map((p, i) => ({ x: x(i), y: y(p.avg) }))
  const baseY = y(PAES_MIN)
  const line = monotonePath(pts)
  const current = n ? points[n - 1].avg : null
  const band = n > 1 ? plotW / (n - 1) : plotW
  const showAll = n <= MARKER_LIMIT
  const label =
    n === 0
      ? 'Gráfico de proyección vacío: escala de 100 a 1000 puntos con hitos en 600, 750, 900 y 1000. Aún no hay ensayos entregados.'
      : `Gráfico de proyección: ${n} ${n === 1 ? 'ensayo entregado' : 'ensayos entregados'}, de ${points[0].avg} a ${current} puntos de promedio en la escala de 100 a 1000. Hitos en 600, 750, 900 y 1000. Hay una vista de tabla con los mismos datos.`

  return (
    <div className="relative" style={{ height }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
        className="block overflow-visible text-zinc-900 dark:text-zinc-100"
        onPointerLeave={() => setActive(null)}
      >
        {/* hitos */}
        {MILESTONES.map((m) => {
          const reached = current !== null && current >= m
          return (
            <g key={m}>
              <line
                x1={PAD.l} x2={width - PAD.r} y1={y(m)} y2={y(m)}
                strokeWidth={1} strokeDasharray="2 5" strokeLinecap="round"
                className={reached ? 'stroke-zinc-500 dark:stroke-zinc-400' : 'stroke-zinc-300 dark:stroke-zinc-700'}
              />
              <text
                x={PAD.l - 8} y={y(m)} textAnchor="end" dominantBaseline="middle"
                className={cn('font-mono text-[11px] tabular-nums', reached ? 'fill-zinc-900 font-semibold dark:fill-zinc-100' : 'fill-zinc-500 dark:fill-zinc-400')}
              >
                {m}
              </text>
            </g>
          )
        })}
        <line x1={PAD.l} x2={width - PAD.r} y1={baseY} y2={baseY} strokeWidth={1} className="stroke-zinc-300 dark:stroke-zinc-700" />
        <text x={PAD.l - 8} y={baseY} textAnchor="end" dominantBaseline="middle" className="fill-zinc-500 font-mono text-[11px] tabular-nums dark:fill-zinc-400">
          {PAES_MIN}
        </text>

        {n > 0 && (
          <>
            <text x={PAD.l} y={height - 6} className="fill-zinc-500 text-[11px] tabular-nums dark:fill-zinc-400">{formatShortDate(points[0].finishedAt)}</text>
            {n > 1 && (
              <text x={width - PAD.r} y={height - 6} textAnchor="end" className="fill-zinc-500 text-[11px] tabular-nums dark:fill-zinc-400">
                {formatShortDate(points[n - 1].finishedAt)}
              </text>
            )}
          </>
        )}

        {n > 1 && <path d={line} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />}

        {active !== null && (
          <line x1={pts[active].x} x2={pts[active].x} y1={PAD.t} y2={baseY} strokeWidth={1} className="stroke-zinc-400 dark:stroke-zinc-500" />
        )}

        {pts.map((p, i) => {
          const isLast = i === n - 1
          const isActive = i === active
          if (!showAll && !isLast && !isActive) return null
          return (
            <circle
              key={points[i].attemptId}
              cx={p.x} cy={p.y} r={isLast || isActive ? 4.5 : 3.5}
              fill="currentColor" strokeWidth={2} className="stroke-white dark:stroke-[#121215]"
            />
          )
        })}

        {n > 0 && active === null && (
          <text
            x={Math.min(Math.max(pts[n - 1].x, 24), width - 24)} y={pts[n - 1].y - 14} textAnchor="middle"
            className="fill-zinc-900 font-mono text-[12px] font-semibold tabular-nums dark:fill-zinc-100"
          >
            {current}
          </text>
        )}

        {/* zonas de hover más grandes que la marca */}
        {pts.map((p, i) => (
          <rect
            key={points[i].attemptId}
            x={Math.max(PAD.l - 8, p.x - band / 2)} y={PAD.t - 6}
            width={Math.min(band, plotW + 16)} height={plotH + 12}
            fill="transparent"
            onPointerEnter={() => setActive(i)}
            onPointerDown={() => setActive(i)}
          />
        ))}
      </svg>

      {active !== null && (
        <Tooltip point={points[active]} prev={points[active - 1]} left={pts[active].x} top={pts[active].y} width={width} />
      )}

      {n === 0 && (
        <div className="absolute inset-x-4 bottom-9 mx-auto flex max-w-sm flex-col items-center gap-3 rounded-xl border border-zinc-200/80 bg-white/95 px-4 py-4 text-center dark:border-zinc-800/80 dark:bg-[#121215]/95">
          <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
            Tu curva aparece aquí cuando entregues tu primer ensayo. Cada intento mueve el punto un poco más cerca del siguiente hito.
          </p>
          <Button variant="primary" onClick={onStart}>Rendir mi primer ensayo</Button>
        </div>
      )}
    </div>
  )
}

/** Dashboard: proyección del promedio en la escala PAES, con hitos y el último puntaje por asignatura. */
export function ProjectionChart({ attempts }: { attempts: AttemptRecord[] }) {
  const [setEl, width] = useElementWidth()
  const [asTable, setAsTable] = useState(false)
  const points = buildProjection(attempts)
  const latest = latestBySubject(attempts)
  const n = points.length
  const current = n ? points[n - 1].avg : null
  const next = current !== null ? nextMilestone(current) : null

  const goToList = () => {
    const el = document.getElementById('lista-ensayos')
    el?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
    el?.focus({ preventScroll: true })
  }

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 px-5 pt-4 sm:px-6">
        <div className="min-w-0 max-w-xl">
          <h2 className="text-[15px] leading-tight font-semibold tracking-tight">Hacia dónde va tu puntaje</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {n === 0
              ? 'Cada ensayo que entregues suma un punto a esta curva: el promedio de tu último puntaje en cada asignatura. Los hitos marcan el camino hacia los puntajes que abren más puertas.'
              : next
                ? <>Cada ensayo sube o ajusta tu promedio actual. Estás en <span className="font-mono font-medium text-zinc-900 tabular-nums dark:text-zinc-100">{current}</span> y te faltan <span className="font-mono font-medium text-zinc-900 tabular-nums dark:text-zinc-100">{next - current!}</span> puntos para llegar al hito de <span className="font-mono font-medium text-zinc-900 tabular-nums dark:text-zinc-100">{next}</span>.</>
                : 'Llegaste a los 1000 puntos de promedio, el máximo de la escala. Mantén el ritmo con repasos.'}
          </p>
        </div>
        {n > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setAsTable((v) => !v)} aria-pressed={asTable}>
            {asTable ? 'Ver gráfico' : 'Ver como tabla'}
          </Button>
        )}
      </div>

      <div className="grid gap-x-6 gap-y-5 px-3 pt-4 pb-5 sm:px-5 lg:grid-cols-[minmax(0,1fr)_15.5rem]">
        <div ref={setEl} className="min-w-0">
          {asTable ? (
            <ProjectionTable points={points} />
          ) : width > 0 ? (
            <Plot points={points} width={width} onStart={goToList} />
          ) : (
            <div className="h-[250px]" />
          )}
        </div>

        <aside aria-label="Último puntaje por asignatura" className="px-2 lg:px-0">
          <div className="mb-3 flex items-end justify-between gap-3 lg:block">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Promedio actual</p>
              <p className="font-mono text-[32px] leading-[1.15] font-semibold tracking-tight tabular-nums">
                {current ?? <span className="font-sans text-[15px] font-normal tracking-normal text-zinc-500 dark:text-zinc-400">Sin ensayos</span>}
                {current !== null && <span className="ml-1 font-sans text-[13px] font-normal tracking-normal text-zinc-500 dark:text-zinc-400">pts</span>}
              </p>
            </div>
          </div>
          <ul className="divide-y divide-zinc-200/80 border-y border-zinc-200/80 dark:divide-zinc-800/80 dark:border-zinc-800/80">
            {SUBJECT_ORDER.map((id) => {
              const l = latest.get(id)
              return (
                <li key={id} className="flex items-center gap-2.5 py-2">
                  <span className={cn('min-w-0 flex-1 truncate text-[12.5px]', !l && 'text-zinc-500 dark:text-zinc-400')}>{SUBJECTS[id].short}</span>
                  <span className={cn('font-mono text-[14px] font-semibold tabular-nums', !l && 'font-normal text-zinc-400 dark:text-zinc-600')}>
                    {l ? l.score : '–'}
                  </span>
                </li>
              )
            })}
          </ul>
        </aside>
      </div>
    </Panel>
  )
}
