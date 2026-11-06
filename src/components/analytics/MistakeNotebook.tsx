import { useMemo, useState } from 'react'
import { QuestionCard } from '@/components/exam/QuestionCard'
import { PixelIcon } from '@/components/icons/PixelIcon'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Segmented } from '@/components/ui/segmented'
import { SUBJECT_TABS } from '@/data/subjects'
import { useExam } from '@/hooks/useExam'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import { cn } from '@/lib/utils'
import type { SubjectId } from '@/types/exam'
import { worstSubject, type MistakeEntry } from '@/utils/analytics'
import { relativeDays } from '@/utils/format'
import { numberOfQuestion, revengeDraft, sourceTitle } from '@/utils/practice'

const PAGE = 25

function MistakeDetail({ entry }: { entry: MistakeEntry }) {
  const { exam, error } = useExam(entry.examId)
  const question = exam?.questions.find((q) => q.id === entry.questionId)
  if (error) return <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100" role="alert">{error}</p>
  if (!question) return <p className="text-[13px] text-zinc-500" role="status">cargando…</p>
  return (
    <QuestionCard
      question={question}
      mode="revision"
      position={question.number}
      total={exam!.questions.length}
      selected={entry.selected}
      revealed
      flagged={false}
      theory
      subject={entry.subject}
    />
  )
}

/** Pestaña `errores`: lista compacta de preguntas falladas. Se repasa una con un clic o varias en modo revancha. */
export function MistakeNotebook({ entries }: { entries: MistakeEntry[] }) {
  const start = useStartPracticeSet()
  const available = SUBJECT_TABS.filter((s) => entries.some((e) => e.subject === s))
  const [filter, setFilter] = useState<SubjectId | 'todas'>('todas')
  const [openId, setOpenId] = useState<string | null>(null)
  const [limit, setLimit] = useState(PAGE)
  const visible = useMemo(() => entries.filter((e) => filter === 'todas' || e.subject === filter), [entries, filter])

  if (!entries.length) return <EmptyState title="no tienes errores en cola" />

  const target = filter === 'todas' ? worstSubject(entries) : filter
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<SubjectId | 'todas'>
          label="Filtrar por materia"
          size="sm"
          value={filter}
          onChange={(v) => {
            setFilter(v)
            setLimit(PAGE)
            setOpenId(null)
          }}
          className="max-w-full overflow-x-auto"
          options={[{ value: 'todas', label: 'todas' }, ...available.map((s) => ({ value: s, label: s }))]}
        />
        {target && (
          <Button size="sm" variant="primary" onClick={() => start(revengeDraft(target, entries))} title="Hasta 20 preguntas falladas en modo práctica: cada acierto la saca de la cola">
            revancha {target}
          </Button>
        )}
      </div>

      <ul className="divide-y divide-zinc-200/80 border-y border-zinc-200/80 dark:divide-zinc-800/80 dark:border-zinc-800/80" aria-label="Preguntas falladas">
        {visible.slice(0, limit).map((e) => {
          const isOpen = openId === e.questionId
          return (
            <li key={e.questionId}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : e.questionId)}
                title={`${sourceTitle(e.examId)}, fallada ${relativeDays(e.failedAt)}`}
                className="flex h-9 w-full items-center gap-2 text-left text-[13px] transition-colors hover:bg-zinc-900/[0.02] dark:hover:bg-zinc-100/[0.03]"
              >
                <PixelIcon name="chevron-right" className={cn('text-zinc-400 transition-transform duration-150', isOpen && 'rotate-90')} />
                <span className="min-w-0 flex-1 truncate">{e.topic}</span>
                <span className="hidden shrink-0 font-mono text-[12px] text-zinc-500 tabular-nums sm:inline dark:text-zinc-400">{e.subject} n.º {numberOfQuestion(e.questionId)}</span>
                <span className="w-10 shrink-0 text-right font-mono text-[12px] text-zinc-500 tabular-nums normal-case dark:text-zinc-400" title={`Marcaste ${e.selected}; la correcta es ${e.correct}`}>
                  <span className="sr-only">Marcaste </span>{e.selected}
                  <span className="mx-0.5 text-zinc-300 dark:text-zinc-700">/</span>
                  <span className="sr-only">correcta </span><span className="text-zinc-900 dark:text-zinc-100">{e.correct}</span>
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-zinc-200/80 py-5 dark:border-zinc-800/80">
                  <MistakeDetail entry={e} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
      {visible.length > limit && (
        <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
          mostrar {Math.min(PAGE, visible.length - limit)} más
        </Button>
      )}
    </div>
  )
}
