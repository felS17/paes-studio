import { useMemo, useRef, useState } from 'react'
import { Panel } from '@/components/ui/panel'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useStreakStore } from '@/store/useStreakStore'
import { activityByDay, activityLevel, describeDay, heatmapColumns, monthLabels } from '@/utils/activity'
import { localDateKey } from '@/utils/daily'
import { plural } from '@/utils/format'

const WEEKS = 20
/** Celda de 11 px más 3 px de separación. */
const STEP = 14
const LEVELS = [0, 1, 2, 3, 4] as const
const WEEKDAYS = ['L', '', 'X', '', 'V', '', '']

function HeatCell({ level, className }: { level: number; className?: string }) {
  return (
    <span
      className={cn('block size-[11px] rounded-[2px]', className)}
      style={{ background: `var(--heat-${level})`, boxShadow: 'inset 0 0 0 1px var(--heat-edge)' }}
    />
  )
}

/** Actividad de estudio, día por día: cada cuadrito se pinta según lo que respondiste y repasaste. */
export function ActivityHeatmap() {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const days = useStreakStore((s) => s.days)
  const [today] = useState(() => localDateKey())
  const columns = useMemo(() => heatmapColumns(today, WEEKS), [today])
  const labels = useMemo(() => monthLabels(columns), [columns])
  const activity = useMemo(() => activityByDay(attempts, days), [attempts, days])
  const keys = useMemo(() => columns.flat(), [columns])
  const [activeKey, setActiveKey] = useState(today)
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null)
  const grid = useRef<HTMLDivElement>(null)

  const totals = useMemo(() => {
    const out = { questions: 0, flashcards: 0, sessions: 0 }
    for (const key of keys) {
      const day = activity.get(key)
      if (!day) continue
      out.questions += day.questions
      out.flashcards += day.flashcards
      out.sessions += day.sessions
    }
    return out
  }, [activity, keys])

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

  const empty = !totals.questions && !totals.flashcards

  return (
    <Panel aria-labelledby="actividad" className="min-w-0 p-4 sm:p-5">
      <h2 id="actividad" className="text-[15px] leading-tight font-semibold tracking-tight">Tu actividad de estudio</h2>
      <p className="mt-1 max-w-[42ch] text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
        {empty
          ? 'Cada pregunta que respondas y cada flashcard que repases pinta un cuadrito.'
          : `${plural(totals.questions, 'pregunta')}, ${plural(totals.flashcards, 'flashcard')} y ${plural(totals.sessions, 'sesión terminada', 'sesiones terminadas')} en estas ${WEEKS} semanas.`}
      </p>

      <div className="mt-3 overflow-x-auto pb-1">
        <div className="w-fit">
          <div aria-hidden className="relative ml-[18px] h-4 text-[11px] text-zinc-500 dark:text-zinc-400">
            {labels.map(({ column, label }) => (
              <span key={column} className="absolute top-0" style={{ left: column * STEP }}>{label}</span>
            ))}
          </div>
          <div className="flex">
            <div aria-hidden className="mr-1 grid w-[14px] grid-rows-7 gap-[3px] text-[10px] leading-[11px] text-zinc-500 dark:text-zinc-400">
              {WEEKDAYS.map((d, i) => <span key={i}>{d}</span>)}
            </div>
            <div
              ref={grid}
              role="group"
              aria-label={`Actividad de las últimas ${WEEKS} semanas`}
              className="flex gap-[3px]"
              onPointerLeave={() => setTip(null)}
            >
              {columns.map((column) => (
                <div key={column[0]} className="grid grid-rows-7 gap-[3px]">
                  {column.map((key) => {
                    const text = describeDay(key, activity.get(key))
                    return (
                      <span
                        key={key}
                        role="img"
                        aria-label={text}
                        data-day={key}
                        tabIndex={key === activeKey ? 0 : -1}
                        className="block rounded-[2px]"
                        onPointerEnter={(e) => showTip(key, e.currentTarget)}
                        onFocus={(e) => {
                          setActiveKey(key)
                          showTip(key, e.currentTarget)
                        }}
                        onBlur={() => setTip(null)}
                        onKeyDown={(e) => move(e, key)}
                      >
                        <HeatCell level={activityLevel(activity.get(key))} className={cn(key === today && 'ring-1 ring-accent')} />
                      </span>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div aria-hidden className="mt-2 flex items-center justify-end gap-[3px] text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="mr-1">Menos</span>
        {LEVELS.map((level) => <HeatCell key={level} level={level} />)}
        <span className="ml-1">Más</span>
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
    </Panel>
  )
}
