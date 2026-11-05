import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { Segmented } from '@/components/ui/segmented'
import { SUBJECTS, SUBJECT_ORDER } from '@/data/subjects'
import { SUBTOPICS, SUBTOPICS_BY_ID, TEMARIO_BY_SUBJECT } from '@/data/temario'
import { useSubtopicNotes } from '@/hooks/useSubtopicNotes'
import { cn } from '@/lib/utils'
import type { SubjectId } from '@/types/exam'
import type { Subtopic } from '@/types/temario'
import { formatPercent } from '@/utils/format'
import { combineStats, topicStatus, type SubtopicStat, type TopicStatus } from '@/utils/subtopics'
import { buildTopicIndex, matchesTerms, queryTerms } from '@/utils/topicSearch'

type StatusFilter = TopicStatus | 'todos'

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes / Por reforzar' },
  { value: 'progreso', label: 'En progreso' },
  { value: 'dominado', label: 'Dominados (≥75%)' },
]

const Count = ({ n }: { n: number }) => <span className="ml-1.5 font-mono font-normal tabular-nums opacity-60">{n}</span>

interface TopicBrowserProps {
  subject: SubjectId
  onSubjectChange: (subject: SubjectId) => void
  stats: Map<string, SubtopicStat>
  /** Debe devolver un `<li>`: cada vista decide qué se puede hacer con un tema. */
  renderRow: (sub: Subtopic, stat: SubtopicStat | undefined) => React.ReactNode
  actions?: React.ReactNode
  summary?: React.ReactNode
}

/**
 * Temario ordenado: materia, buscador y estado arriba; temas agrupados en acordeones por eje abajo. Parte con un solo
 * eje abierto para no mostrar los 67 temas de golpe; al filtrar se abren todos los que tengan resultados.
 */
export function TopicBrowser({ subject, onSubjectChange, stats, renderRow, actions, summary }: TopicBrowserProps) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('todos')
  /** Ejes abiertos o cerrados a mano; se limpia al cambiar los filtros. */
  const [toggled, setToggled] = useState<Record<string, boolean>>({})

  const terms = useMemo(() => queryTerms(query), [query])
  const notes = useSubtopicNotes(query.trim().length >= 2)
  const index = useMemo(() => buildTopicIndex(notes), [notes])
  const matches = (id: string) => matchesTerms(index.get(id) ?? '', terms)

  const temario = TEMARIO_BY_SUBJECT.get(subject)
  const axes = temario?.axes ?? []
  const searched = axes.flatMap((a) => a.subtopics).filter((s) => matches(s.id))
  const statusCount = (value: StatusFilter) =>
    value === 'todos' ? searched.length : searched.filter((s) => topicStatus(stats.get(s.id)) === value).length
  const filtering = terms.length > 0 || status !== 'todos'

  const visibleAxes = axes
    .map((axis, position) => ({
      axis,
      position,
      key: `${subject}:${axis.name}`,
      topics: axis.subtopics.filter((s) => matches(s.id) && (status === 'todos' || topicStatus(stats.get(s.id)) === status)),
    }))
    .filter((a) => a.topics.length > 0)
  const isOpen = (key: string, position: number) => toggled[key] ?? (filtering || position === 0)
  const allOpen = visibleAxes.every((a) => isOpen(a.key, a.position))

  const elsewhere = terms.length
    ? SUBJECT_ORDER.filter((s) => s !== subject)
        .map((s) => ({ subject: s, count: SUBTOPICS.filter((t) => t.subject === s && matches(t.id)).length }))
        .filter((s) => s.count > 0)
    : []

  const changeQuery = (value: string) => {
    setQuery(value)
    setToggled({})
  }
  const changeStatus = (value: StatusFilter) => {
    setStatus(value)
    setToggled({})
  }
  const clearFilters = () => {
    changeQuery('')
    changeStatus('todos')
  }

  return (
    <div className="@container space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<SubjectId>
          label="Materia"
          className="max-w-full overflow-x-auto"
          value={subject}
          onChange={onSubjectChange}
          options={SUBJECT_ORDER.map((id) => ({
            value: id,
            title: SUBJECTS[id].name,
            label: (
              <>
                {SUBJECTS[id].short}
                <Count n={SUBTOPICS.filter((s) => s.subject === id).length} />
              </>
            ),
          }))}
        />
        {actions}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <SearchInput
          value={query}
          onChange={changeQuery}
          placeholder="Filtrar tema o concepto..."
          label="Filtrar tema o concepto"
          className="min-w-56 flex-1"
        />
        <Segmented<StatusFilter>
          label="Filtrar por estado"
          size="sm"
          className="max-w-full overflow-x-auto"
          value={status}
          onChange={changeStatus}
          options={STATUS_OPTIONS.map(({ value, label }) => ({ value, label: <>{label}<Count n={statusCount(value)} /></> }))}
        />
      </div>

      {(summary || elsewhere.length > 0 || visibleAxes.length > 1) && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px] text-zinc-500 dark:text-zinc-400">
          <p className="min-w-0">
            {elsewhere.length > 0 ? (
              <>
                También aparece en{' '}
                {elsewhere.map((e, i) => (
                  <span key={e.subject}>
                    {i > 0 && ', '}
                    <button type="button" onClick={() => onSubjectChange(e.subject)} className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100">
                      {SUBJECTS[e.subject].short} ({e.count})
                    </button>
                  </span>
                ))}
                .
              </>
            ) : summary}
          </p>
          {visibleAxes.length > 1 && (
            <button
              type="button"
              onClick={() => setToggled((t) => ({ ...t, ...Object.fromEntries(visibleAxes.map((a) => [a.key, !allOpen])) }))}
              className="shrink-0 text-xs underline-offset-4 hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
            >
              {allOpen ? 'Cerrar todos los ejes' : 'Abrir todos los ejes'}
            </button>
          )}
        </div>
      )}

      {visibleAxes.length > 0 ? (
        <div className="divide-y divide-zinc-200/80 overflow-hidden rounded-xl border border-zinc-200/80 bg-surface dark:divide-zinc-800/80 dark:border-zinc-800/80">
          {visibleAxes.map(({ axis, position, key, topics }) => {
            const open = isOpen(key, position)
            const ids = axis.subtopics.map((s) => s.id)
            const practiced = ids.filter((id) => (stats.get(id)?.answered ?? 0) > 0).length
            const axisStat = combineStats(ids, stats)
            const panelId = `eje-${subject}-${position}`
            return (
              <section key={key} aria-labelledby={`${panelId}-titulo`}>
                <h3 id={`${panelId}-titulo`}>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setToggled((t) => ({ ...t, [key]: !open }))}
                    className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-zinc-900/[0.02] dark:hover:bg-zinc-100/[0.03]"
                  >
                    <span className="flex min-w-0 flex-1 basis-56 items-center gap-2">
                      <ChevronRight aria-hidden className={cn('size-4 shrink-0 text-zinc-400 transition-transform duration-150', open && 'rotate-90')} />
                      <span className="text-[14px] font-semibold tracking-tight">{position + 1}. {axis.name}</span>
                      {filtering && <span className="font-mono text-xs font-normal text-zinc-500 tabular-nums dark:text-zinc-400">{topics.length}</span>}
                    </span>
                    <span className="flex items-center gap-3 pl-6 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      <span className="whitespace-nowrap">
                        <span className="font-mono text-zinc-900 tabular-nums dark:text-zinc-100">{practiced}</span> de{' '}
                        <span className="font-mono tabular-nums">{ids.length}</span> practicados
                      </span>
                      <span aria-hidden className="h-1 w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <span className="block h-full rounded-full bg-progress" style={{ width: `${(practiced / ids.length) * 100}%` }} />
                      </span>
                      <span className="w-[4.75rem] text-right whitespace-nowrap" title="Acierto en este eje">
                        {axisStat.accuracy === null ? 'Sin datos' : <>Acierto <span className="font-mono tabular-nums">{formatPercent(axisStat.accuracy)}</span></>}
                      </span>
                    </span>
                  </button>
                </h3>
                {open && (
                  <ul id={panelId} className="animate-fade-in divide-y divide-zinc-200/60 border-t border-zinc-200/80 dark:divide-zinc-800/60 dark:border-zinc-800/80">
                    {topics.map((t) => {
                      const sub = SUBTOPICS_BY_ID.get(t.id)
                      return sub ? renderRow(sub, stats.get(t.id)) : null
                    })}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-zinc-300/80 px-5 py-6 dark:border-zinc-700/80">
          <p className="text-[13px] font-medium">Ningún tema de {SUBJECTS[subject].short} coincide con estos filtros</p>
          <Button size="sm" onClick={clearFilters}>Quitar filtros</Button>
        </div>
      )}
    </div>
  )
}
