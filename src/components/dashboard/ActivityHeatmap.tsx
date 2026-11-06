import { useMemo, useRef, useState } from 'react'
import { useElementWidth } from '@/hooks/useElementWidth'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useStreakStore } from '@/store/useStreakStore'
import { activityByDay, activityLevel, describeDay, heatmapColumns, monthLabels } from '@/utils/activity'
import { localDateKey } from '@/utils/daily'
import { cn } from '@/lib/utils'

const MAX_WEEKS = 52
const MIN_WEEKS = 13
/** Por debajo de 9 px un cuadrito ya no se distingue: en pantallas angostas se muestran menos semanas, no más chicas. */
const MIN_STEP = 12
const GAP = 3
const LABEL_COLUMN = 22
const LEVELS = [0, 1, 2, 3, 4] as const
const WEEKDAYS = ['l', '', 'x', '', 'v', '', '']

const heatStyle = (level: number) => ({ background: `var(--heat-${level})`, boxShadow: 'inset 0 0 0 1px var(--heat-edge)' })

/**
 * Actividad de estudio del mismo ancho que la ventana del Inicio: el año completo, con cuadritos que crecen hasta llenar
 * el ancho de punta a punta. El detalle de cada día va en su tooltip.
 */
export function ActivityHeatmap() {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const days = useStreakStore((s) => s.days)
  const [today] = useState(() => localDateKey())
  const [setWidthEl, width] = useElementWidth()
  const weeks = width ? Math.max(MIN_WEEKS, Math.min(MAX_WEEKS, Math.floor((width - LABEL_COLUMN) / MIN_STEP))) : MAX_WEEKS
  const columns = useMemo(() => heatmapColumns(today, weeks), [today, weeks])
  const labels = useMemo(() => monthLabels(columns), [columns])
  const activity = useMemo(() => activityByDay(attempts, days), [attempts, days])
  const keys = useMemo(() => columns.flat(), [columns])
  const [activeKey, setActiveKey] = useState(today)
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null)
  const grid = useRef<HTMLDivElement>(null)

  const monthAnswers = useMemo(() => {
    let total = 0
    for (const [key, day] of activity) if (key.startsWith(today.slice(0, 7))) total += day.questions
    return total
  }, [activity, today])

  const showTip = (key: string, el: Element) => {
    const rect = el.getBoundingClientRect()
    const margin = 130
    setTip({
      text: describeDay(key, activity.get(key)),
      x: Math.min(window.innerWidth - margin, Math.max(margin, rect.left + rect.width / 2)),
      y: rect.top,
    })
  }

  const move = (e: React.KeyboardEvent, key: string) => {
    const delta = e.key === 'ArrowRight' ? 7 : e.key === 'ArrowLeft' ? -7 : e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = keys[keys.indexOf(key) + delta]
    if (!next) return
    setActiveKey(next)
    grid.current?.querySelector<HTMLElement>(`[data-day="${next}"]`)?.focus()
  }

  return (
    <section aria-labelledby="actividad" className="rounded-xl border border-zinc-200/80 bg-surface p-4 sm:p-5 dark:border-zinc-800/80">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 font-mono text-[12px] text-zinc-500 dark:text-zinc-400">
        <h2 id="actividad" className="font-normal">
          <span className="text-zinc-900 dark:text-zinc-100">actividad</span>
          <span aria-hidden> · </span>
          <span className="tabular-nums">{monthAnswers}</span> {monthAnswers === 1 ? 'respuesta' : 'respuestas'} este mes
        </h2>
        <span aria-hidden className="flex items-center gap-[3px]">
          <span className="mr-1">menos</span>
          {LEVELS.map((level) => <span key={level} className="size-2.5 rounded-[2px]" style={heatStyle(level)} />)}
          <span className="ml-1">más</span>
        </span>
      </div>

      <div ref={setWidthEl}>
        <div
          ref={grid}
          role="group"
          aria-label={`Actividad de las últimas ${weeks} semanas`}
          className="grid"
          style={{ gap: GAP, gridTemplateColumns: `${LABEL_COLUMN - GAP}px repeat(${columns.length}, minmax(0, 1fr))` }}
          onPointerLeave={() => setTip(null)}
        >
          {labels.map(({ column, label }) => (
            <span key={column} aria-hidden className="text-[11px] leading-4 whitespace-nowrap text-zinc-500 dark:text-zinc-400" style={{ gridColumn: column + 2, gridRow: 1 }}>
              {label}
            </span>
          ))}
          {WEEKDAYS.map((day, i) => day && (
            <span key={day} aria-hidden className="self-center font-mono text-[10px] leading-none text-zinc-500 dark:text-zinc-400" style={{ gridColumn: 1, gridRow: i + 2 }}>
              {day}
            </span>
          ))}
          {columns.map((column, c) => column.map((key, r) => (
            <span
              key={key}
              role="img"
              aria-label={describeDay(key, activity.get(key))}
              data-day={key}
              tabIndex={key === activeKey ? 0 : -1}
              className={cn('block aspect-square rounded-[2px]', key === today && 'ring-1 ring-accent')}
              style={{ ...heatStyle(activityLevel(activity.get(key))), gridColumn: c + 2, gridRow: r + 2 }}
              onPointerEnter={(e) => showTip(key, e.currentTarget)}
              onFocus={(e) => {
                setActiveKey(key)
                showTip(key, e.currentTarget)
              }}
              onBlur={() => setTip(null)}
              onKeyDown={(e) => move(e, key)}
            />
          )))}
        </div>
      </div>

      {tip && (
        <p
          role="tooltip"
          className="pointer-events-none fixed z-30 rounded-md border border-zinc-200/80 bg-surface px-2 py-1 text-xs whitespace-nowrap text-zinc-900 dark:border-zinc-700/80 dark:text-zinc-100"
          style={{ left: tip.x, top: tip.y, transform: 'translate(-50%, calc(-100% - 6px))' }}
        >
          {tip.text}
        </p>
      )}
    </section>
  )
}
