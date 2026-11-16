import { useMemo, useState } from 'react'
import { Accuracy } from '@/components/dashboard/Accuracy'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Segmented } from '@/components/ui/segmented'
import { SUBJECT_TABS } from '@/data/subjects'
import { SUBTOPICS } from '@/data/temario'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useInspectorStore } from '@/store/useInspectorStore'
import type { SubjectId } from '@/types/exam'
import type { Subtopic } from '@/types/temario'
import { latestResults } from '@/utils/analytics'
import { quickDrillDraft, subtopicDrillDraft, subtopicStats, type SubtopicStat } from '@/utils/subtopics'

/** Con menos respuestas, el porcentaje de un tema todavía no dice nada. */
const MIN_ANSWERS = 3
const TOP = 5

interface Weak {
  sub: Subtopic
  stat: SubtopicStat
}

/** Los temas más débiles de una materia: menor acierto primero y, si empatan, el que más respondiste. */
function weakestSubtopics(subject: SubjectId, stats: Map<string, SubtopicStat>, top = TOP): Weak[] {
  return SUBTOPICS.filter((s) => s.subject === subject)
    .flatMap((sub) => {
      const stat = stats.get(sub.id)
      return stat && stat.answered >= MIN_ANSWERS ? [{ sub, stat }] : []
    })
    .sort((a, b) => (a.stat.accuracy ?? 0) - (b.stat.accuracy ?? 0) || b.stat.answered - a.stat.answered)
    .slice(0, top)
}

/** Pestaña `diagnóstico`: los 5 temas con menor acierto de una materia, cada uno con su práctica a un clic. */
export function WeakSpots() {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const openInspector = useInspectorStore((s) => s.openInspector)
  const start = useStartPracticeSet()
  const latest = useMemo(() => latestResults(attempts), [attempts])
  const stats = useMemo(() => subtopicStats(attempts, latest), [attempts, latest])
  const bySubject = useMemo(() => new Map(SUBJECT_TABS.map((s) => [s, weakestSubtopics(s, stats)] as const)), [stats])
  const [picked, setPicked] = useState<SubjectId | null>(null)
  const subject = picked ?? SUBJECT_TABS.find((s) => bySubject.get(s)?.length) ?? SUBJECT_TABS[0]
  const rows = bySubject.get(subject) ?? []

  return (
    <div className="space-y-3">
      <Segmented<SubjectId>
        label="Materia"
        size="sm"
        value={subject}
        onChange={setPicked}
        className="max-w-full overflow-x-auto"
        options={SUBJECT_TABS.map((s) => ({ value: s, label: s }))}
      />
      {rows.length ? (
        <ol className="divide-y divide-zinc-200/80 border-y border-zinc-200/80 dark:divide-zinc-800/80 dark:border-zinc-800/80" aria-label={`Temas más débiles de ${subject}`}>
          {rows.map(({ sub, stat }) => (
            <li key={sub.id} className="flex min-h-11 items-center gap-2 py-1">
              <button
                type="button"
                onClick={() => openInspector({ kind: 'subtopic', id: sub.id })}
                title={`resumen de ${sub.title}`}
                className="min-w-0 flex-1 rounded-sm text-left text-[13.5px] underline-offset-4 hover:underline sm:truncate"
              >
                {sub.title}
              </button>
              <Accuracy stat={stat} />
              <Button size="sm" className="w-[4.75rem] shrink-0" onClick={() => start(subtopicDrillDraft(sub.id, 10, attempts, latest))} aria-label={`Practicar ${sub.title}`}>
                practicar
              </Button>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState
          title={`responde al menos ${MIN_ANSWERS} preguntas de un tema de ${subject} para ver tu diagnóstico`}
          action={<Button size="sm" onClick={() => start(quickDrillDraft(subject, latest))}>practicar 10 de {subject}</Button>}
        />
      )}
    </div>
  )
}
