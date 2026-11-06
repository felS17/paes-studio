import { useMemo, useState } from 'react'
import { PixelIcon } from '@/components/icons/PixelIcon'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { Segmented } from '@/components/ui/segmented'
import { SUBJECT_TABS } from '@/data/subjects'
import { SUBTOPICS, SUBTOPICS_BY_ID, TEMARIO_BY_SUBJECT } from '@/data/temario'
import { useSubtopicNotes } from '@/hooks/useSubtopicNotes'
import { cn } from '@/lib/utils'
import type { SubjectId } from '@/types/exam'
import type { Subtopic } from '@/types/temario'
import { combineStats, type SubtopicStat } from '@/utils/subtopics'
import { buildTopicIndex, matchesTerms, queryTerms } from '@/utils/topicSearch'
import { Accuracy } from './Accuracy'

interface TopicBrowserProps {
  subject: SubjectId
  onSubjectChange: (subject: SubjectId) => void
  stats: Map<string, SubtopicStat>
  /** Debe devolver un `<li>`: cada vista decide qué se puede hacer con un tema. */
  renderRow: (sub: Subtopic, stat: SubtopicStat | undefined) => React.ReactNode
}

/**
 * Temario ordenado: materia y buscador arriba; temas agrupados por eje abajo. Parte con un solo eje abierto para no
 * mostrar los 67 temas de golpe; al buscar se abren todos los que tengan resultados.
 */
export function TopicBrowser({ subject, onSubjectChange, stats, renderRow }: TopicBrowserProps) {
  const [query, setQuery] = useState('')
  /** Ejes abiertos o cerrados a mano; se limpia al buscar. */
  const [toggled, setToggled] = useState<Record<string, boolean>>({})

  const terms = useMemo(() => queryTerms(query), [query])
  const notes = useSubtopicNotes(query.trim().length >= 2)
  const index = useMemo(() => buildTopicIndex(notes), [notes])
  const matches = (id: string) => matchesTerms(index.get(id) ?? '', terms)

  const axes = TEMARIO_BY_SUBJECT.get(subject)?.axes ?? []
  const visibleAxes = axes
    .map((axis, position) => ({
      axis,
      position,
      key: `${subject}:${axis.name}`,
      topics: axis.subtopics.filter((s) => matches(s.id)),
    }))
    .filter((a) => a.topics.length > 0)
  const isOpen = (key: string, position: number) => toggled[key] ?? (terms.length > 0 || position === 0)

  const elsewhere = terms.length
    ? SUBJECT_TABS.filter((s) => s !== subject)
        .map((s) => ({ subject: s, count: SUBTOPICS.filter((t) => t.subject === s && matches(t.id)).length }))
        .filter((s) => s.count > 0)
    : []

  const changeQuery = (value: string) => {
    setQuery(value)
    setToggled({})
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Segmented<SubjectId>
          label="Materia"
          className="max-w-full overflow-x-auto"
          value={subject}
          onChange={onSubjectChange}
          options={SUBJECT_TABS.map((id) => ({ value: id, label: id }))}
        />
        <SearchInput value={query} onChange={changeQuery} placeholder="buscar tema o concepto" label="Buscar tema o concepto" className="min-w-48 flex-1" />
      </div>

      {elsewhere.length > 0 && (
        <p className="font-mono text-[12px] text-zinc-500 dark:text-zinc-400">
          también en{' '}
          {elsewhere.map((e, i) => (
            <span key={e.subject}>
              {i > 0 && ', '}
              <button type="button" onClick={() => onSubjectChange(e.subject)} className="rounded-sm text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100">
                {e.subject} ({e.count})
              </button>
            </span>
          ))}
        </p>
      )}

      {visibleAxes.length > 0 ? (
        <div className="divide-y divide-zinc-200/80 border-y border-zinc-200/80 dark:divide-zinc-800/80 dark:border-zinc-800/80">
          {visibleAxes.map(({ axis, position, key, topics }) => {
            const open = isOpen(key, position)
            const panelId = `eje-${subject}-${position}`
            return (
              <section key={key} aria-labelledby={`${panelId}-titulo`}>
                <h3 id={`${panelId}-titulo`}>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setToggled((t) => ({ ...t, [key]: !open }))}
                    className="flex min-h-10 w-full items-center gap-2 text-left transition-colors hover:bg-zinc-900/[0.02] dark:hover:bg-zinc-100/[0.03]"
                  >
                    <PixelIcon name="chevron-right" className={cn('text-zinc-400 transition-transform duration-150', open && 'rotate-90')} />
                    <span className="min-w-0 flex-1 text-[13.5px] font-medium sm:truncate">{axis.name}</span>
                    <Accuracy stat={combineStats(axis.subtopics.map((s) => s.id), stats)} />
                    {/* Reserva el ancho del botón de las filas: así las cifras de ejes y temas quedan en columna. */}
                    <span aria-hidden className="w-[4.75rem] shrink-0" />
                  </button>
                </h3>
                {open && (
                  <ul id={panelId} className="animate-fade-in divide-y divide-zinc-200/50 border-t border-zinc-200/60 dark:divide-zinc-800/50 dark:border-zinc-800/60">
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
        <div className="flex flex-col items-start gap-2 py-4">
          <p className="text-[13px]">nada con «{query.trim()}» en {subject}</p>
          <Button size="sm" onClick={() => changeQuery('')}>limpiar búsqueda</Button>
        </div>
      )}
    </div>
  )
}
