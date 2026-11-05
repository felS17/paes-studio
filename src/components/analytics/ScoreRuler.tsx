import { cn } from '@/lib/utils'
import { PAES_MAX, PAES_MIN, scaleRatio } from '@/utils/scoring'

export interface RulerMarker {
  value: number
  label: string
  detail?: string
  emphasis?: boolean
}

const TICKS = Array.from({ length: (PAES_MAX - PAES_MIN) / 50 + 1 }, (_, i) => PAES_MIN + i * 50)

/**
 * La regla PAES: escala de medición 100–1000 con marcas cada 50 puntos y etiquetas cada 100.
 * Los marcadores se apilan en filas cuando quedan demasiado cerca para no superponer etiquetas.
 */
export function ScoreRuler({ markers, className, compact = false }: {
  markers: RulerMarker[]
  className?: string
  compact?: boolean
}) {
  const sorted = [...markers].sort((a, b) => a.value - b.value)
  const rows: number[] = []
  const lastInRow: number[] = []
  for (const m of sorted) {
    const r = scaleRatio(m.value)
    let row = 0
    while (lastInRow[row] !== undefined && r - lastInRow[row] < 0.085) row++
    lastInRow[row] = r
    rows.push(row)
  }
  const rowCount = Math.max(1, ...rows.map((r) => r + 1))
  const labelBand = compact ? 0 : rowCount * 22 + 6

  return (
    <div
      className={cn('relative select-none', className)}
      role="img"
      aria-label={
        markers.length
          ? `Escala PAES de 100 a 1000. ${markers.map((m) => `${m.label}: ${m.value}`).join('; ')}.`
          : 'Escala PAES de 100 a 1000, sin puntajes registrados.'
      }
      style={{ paddingTop: labelBand }}
    >
      <div className="relative mx-3 h-9">
        {/* línea base */}
        <div className="absolute inset-x-0 top-0 h-px bg-zinc-300 dark:bg-zinc-700" />
        {TICKS.map((t) => {
          const major = t % 100 === 0
          return (
            <div key={t} className="absolute top-0" style={{ left: `${scaleRatio(t) * 100}%` }}>
              <div className={cn('w-px -translate-x-1/2 bg-zinc-300 dark:bg-zinc-700', major ? 'h-2.5' : 'h-1.5')} />
              {major && (
                <span className="absolute top-3.5 left-0 -translate-x-1/2 font-mono text-[10px] text-zinc-400 tabular-nums dark:text-zinc-500">
                  {t}
                </span>
              )}
            </div>
          )
        })}
        {sorted.map((m, i) => {
          const rise = compact ? 14 : 8 + (rowCount - rows[i]) * 22 - 14
          const r = scaleRatio(m.value)
          const anchor = r > 0.88 ? '-translate-x-full' : r < 0.12 ? 'translate-x-0' : '-translate-x-1/2'
          return (
            <div
              key={`${m.label}-${i}`}
              className="group absolute bottom-full"
              style={{ left: `${scaleRatio(m.value) * 100}%`, marginBottom: -1 }}
              title={m.detail ?? `${m.label}: ${m.value}`}
            >
              <div
                className={cn('absolute bottom-0 w-0.5 -translate-x-1/2', m.emphasis ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-400 dark:bg-zinc-600')}
                style={{ height: rise }}
              />
              <div
                className={cn(
                  'absolute size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-surface',
                  m.emphasis ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-400 dark:bg-zinc-500',
                )}
                style={{ bottom: rise }}
              />
              {!compact && (
                <span
                  className={cn(
                    'absolute flex items-baseline gap-1 whitespace-nowrap text-[11px]',
                    anchor,
                    m.emphasis ? 'font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400',
                  )}
                  style={{ bottom: rise + 8 }}
                >
                  {m.label}
                  <span className="font-mono tabular-nums">{m.value}</span>
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
