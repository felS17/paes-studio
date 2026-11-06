import { useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useStreakStore } from '@/store/useStreakStore'
import { activityByDay, activityLevel, describeDay, heatmapColumns } from '@/utils/activity'
import { localDateKey } from '@/utils/daily'

const WEEKS = 26

/** Actividad de estudio en el pie del Inicio: reducida y discreta. El detalle de cada día va en su tooltip. */
export function ActivityHeatmap() {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const days = useStreakStore((s) => s.days)
  const [today] = useState(() => localDateKey())
  const columns = useMemo(() => heatmapColumns(today, WEEKS), [today])
  const activity = useMemo(() => activityByDay(attempts, days), [attempts, days])
  const keys = useMemo(() => columns.flat(), [columns])
  const [activeKey, setActiveKey] = useState(today)
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null)
  const grid = useRef<HTMLDivElement>(null)

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
    <section aria-label="Tu actividad de estudio" className="overflow-x-auto">
      <div
        ref={grid}
        role="group"
        aria-label={`Actividad de las últimas ${WEEKS} semanas`}
        className="flex w-fit gap-[2px] p-px"
        onPointerLeave={() => setTip(null)}
      >
        {columns.map((column) => (
          <div key={column[0]} className="grid grid-rows-7 gap-[2px]">
            {column.map((key) => (
              <span
                key={key}
                role="img"
                aria-label={describeDay(key, activity.get(key))}
                data-day={key}
                tabIndex={key === activeKey ? 0 : -1}
                className={cn('block size-[9px] rounded-[2px]', key === today && 'ring-1 ring-accent')}
                style={{ background: `var(--heat-${activityLevel(activity.get(key))})`, boxShadow: 'inset 0 0 0 1px var(--heat-edge)' }}
                onPointerEnter={(e) => showTip(key, e.currentTarget)}
                onFocus={(e) => {
                  setActiveKey(key)
                  showTip(key, e.currentTarget)
                }}
                onBlur={() => setTip(null)}
                onKeyDown={(e) => move(e, key)}
              />
            ))}
          </div>
        ))}
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
