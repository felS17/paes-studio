import { useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SUBJECT_TABS } from '@/data/subjects'
import { SUBTOPICS_BY_ID } from '@/data/temario'
import { usePaesCountdown } from '@/hooks/usePaesCountdown'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useInspectorStore } from '@/store/useInspectorStore'
import { useProgressStore } from '@/store/useProgressStore'
import type { StudyPlan } from '@/types/analytics'
import type { SubjectId } from '@/types/exam'
import { latestResults } from '@/utils/analytics'
import { localDateKey, previousDateKey } from '@/utils/dateKey'
import { plural } from '@/utils/format'
import { buildStudyPlan, studyDates } from '@/utils/studyPlan'
import { subtopicDrillDraft, subtopicStats } from '@/utils/subtopics'

/** De lunes a domingo, con el número de día de `Date.getDay()`. */
const WEEKDAYS: { day: number; label: string; name: string }[] = [
  { day: 1, label: 'lu', name: 'lunes' },
  { day: 2, label: 'ma', name: 'martes' },
  { day: 3, label: 'mi', name: 'miércoles' },
  { day: 4, label: 'ju', name: 'jueves' },
  { day: 5, label: 'vi', name: 'viernes' },
  { day: 6, label: 'sá', name: 'sábado' },
  { day: 0, label: 'do', name: 'domingo' },
]

const dayFmt = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
const formatDay = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return dayFmt.format(new Date(y, m - 1, d, 12))
}

const LIST = 'divide-y divide-zinc-200/80 border-y border-zinc-200/80 dark:divide-zinc-800/80 dark:border-zinc-800/80'
const HEADING = 'mb-1.5 font-mono text-[12px] text-zinc-500 dark:text-zinc-400'
const CHIP = 'h-9 min-w-11 rounded-lg border px-3 font-mono text-[12.5px] transition-colors duration-150'
const CHIP_ON = 'border-accent bg-accent/[0.04] text-zinc-900 ring-1 ring-accent dark:text-zinc-100'
const CHIP_OFF = 'border-zinc-200/80 bg-surface text-zinc-500 hover:border-zinc-300 dark:border-zinc-800/80 dark:text-zinc-400 dark:hover:border-zinc-700'

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

function Setup({ initial, today, until, onCreate }: {
  initial: StudyPlan | null
  today: string
  until: string
  onCreate: (subjects: SubjectId[], weekdays: number[]) => void
}) {
  const [subjects, setSubjects] = useState<SubjectId[]>(initial?.subjects ?? ['lectora', 'm1'])
  const [weekdays, setWeekdays] = useState<number[]>(initial?.weekdays ?? [1, 2, 3, 4, 5])
  const days = studyDates(today, until, weekdays).length
  const ready = subjects.length > 0 && days > 0
  return (
    <div className="space-y-6">
      <fieldset>
        <legend className={HEADING}>materias</legend>
        <div className="flex flex-wrap gap-2">
          {SUBJECT_TABS.map((s) => (
            <button key={s} type="button" aria-pressed={subjects.includes(s)} onClick={() => setSubjects(toggle(subjects, s))} className={cn(CHIP, subjects.includes(s) ? CHIP_ON : CHIP_OFF)}>
              {s}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className={HEADING}>días en que puedes estudiar</legend>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map(({ day, label, name }) => (
            <button key={day} type="button" aria-pressed={weekdays.includes(day)} aria-label={name} title={name} onClick={() => setWeekdays(toggle(weekdays, day))} className={cn(CHIP, weekdays.includes(day) ? CHIP_ON : CHIP_OFF)}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" size="lg" disabled={!ready} onClick={() => onCreate(subjects, weekdays)}>armar plan</Button>
        <span className="font-mono text-[12px] text-zinc-500 tabular-nums dark:text-zinc-400" role="status">
          {plural(days, 'día')} de estudio hasta el {formatDay(until)}
        </span>
      </div>
    </div>
  )
}

function DayTopics({ ids, onPractice }: { ids: string[]; onPractice: (id: string) => void }) {
  const openInspector = useInspectorStore((s) => s.openInspector)
  return (
    <ul className={LIST}>
      {ids.map((id) => {
        const sub = SUBTOPICS_BY_ID.get(id)
        if (!sub) return null
        return (
          <li key={id} className="flex min-h-11 items-center gap-2 py-1">
            <button
              type="button"
              onClick={() => openInspector({ kind: 'subtopic', id })}
              title={`resumen de ${sub.title}`}
              className="min-w-0 flex-1 rounded-sm text-left text-[13.5px] underline-offset-4 hover:underline sm:truncate"
            >
              {sub.title}
            </button>
            <span className="shrink-0 font-mono text-[12px] text-zinc-500 dark:text-zinc-400">{sub.subject}</span>
            <Button size="sm" className="w-[4.75rem] shrink-0" disabled={!sub.questionCount} onClick={() => onPractice(id)} aria-label={`Practicar ${sub.title}`}>
              practicar
            </Button>
          </li>
        )
      })}
    </ul>
  )
}

/** Plan de repaso (`/plan`): eliges materias y días, y reparte los temas hasta la víspera de la prueba, lo más débil primero. */
export function StudyPlanPage() {
  const plan = useProgressStore((s) => s.plan)
  const setPlan = useProgressStore((s) => s.setPlan)
  const attempts = useAnalyticsStore((s) => s.attempts)
  const start = useStartPracticeSet()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const latest = useMemo(() => latestResults(attempts), [attempts])

  const today = localDateKey()
  const { date: test } = usePaesCountdown()
  const until = previousDateKey(localDateKey(test.at))

  const create = (subjects: SubjectId[], weekdays: number[]) => {
    try {
      setPlan(buildStudyPlan({ subjects, weekdays }, subtopicStats(attempts, latest), today, until))
      setEditing(false)
      setError(null)
    } catch {
      setError('no pudimos armar el plan. inténtalo de nuevo.')
    }
  }

  const upcoming = plan?.days.filter((d) => d.date >= today && d.subtopics.length) ?? []
  const [next, ...rest] = upcoming
  const practice = (id: string) => start(subtopicDrillDraft(id, 10, attempts, latest))
  const showSetup = !plan || editing

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="plan de repaso"
        actions={plan && !editing ? <Button size="sm" onClick={() => setEditing(true)} title="Elegir otras materias o días y repartir de nuevo">cambiar</Button> : undefined}
      />
      {error && <p role="alert" className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{error}</p>}
      {showSetup ? (
        <Setup initial={plan} today={today} until={until} onCreate={create} />
      ) : next ? (
        <div className="space-y-6">
          <section>
            <h2 className={HEADING}>{next.date === today ? 'hoy' : 'próximo día'}, {formatDay(next.date)}</h2>
            <DayTopics ids={next.subtopics} onPractice={practice} />
          </section>
          {rest.length > 0 && (
            <details>
              <summary className="cursor-pointer font-mono text-[12.5px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                {plural(rest.length, 'día')} más hasta el {formatDay(plan.until)}
              </summary>
              <div className="mt-4 space-y-6">
                {rest.map((day) => (
                  <section key={day.date}>
                    <h2 className={HEADING}>{formatDay(day.date)}</h2>
                    <DayTopics ids={day.subtopics} onPractice={practice} />
                  </section>
                ))}
              </div>
            </details>
          )}
        </div>
      ) : (
        <EmptyState title="tu plan ya no tiene días por delante" action={<Button size="sm" onClick={() => setEditing(true)}>armar otro</Button>} />
      )}
    </div>
  )
}
