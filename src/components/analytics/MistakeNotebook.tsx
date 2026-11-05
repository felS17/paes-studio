import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { QuestionCard } from '@/components/exam/QuestionCard'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Panel } from '@/components/ui/panel'
import { Segmented } from '@/components/ui/segmented'
import { SUBJECTS, SUBJECT_ORDER } from '@/data/subjects'
import { useExam } from '@/hooks/useExam'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import { cn } from '@/lib/utils'
import type { SubjectId } from '@/types/exam'
import type { MistakeEntry } from '@/utils/analytics'
import { relativeDays } from '@/utils/format'
import { numberOfQuestion, revengeDraft, sourceTitle } from '@/utils/practice'

const PAGE = 25

function MistakeDetail({ entry }: { entry: MistakeEntry }) {
  const { exam, error } = useExam(entry.examId)
  const question = exam?.questions.find((q) => q.id === entry.questionId)
  if (error) return <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100" role="alert">{error}</p>
  if (!question) return <p className="text-[13px] text-zinc-500" role="status">Cargando pregunta…</p>
  const passage = question.passageId ? exam?.passages.find((p) => p.id === question.passageId) : undefined
  return (
    <div className="space-y-3">
      {passage && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Esta pregunta se responde con {passage.title.toLowerCase()} de {exam!.title}. Ábrela en el ensayo para leer el texto completo.
        </p>
      )}
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
    </div>
  )
}

/** Fila del cuaderno: tema, origen y «marcaste / clave». */
function RowContent({ e }: { e: MistakeEntry }) {
  return (
    <>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium">{e.topic}</span>
        <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400" title={`Fallada ${relativeDays(e.failedAt)}`}>
          {SUBJECTS[e.subject].short}, {sourceTitle(e.examId)}, n.º {numberOfQuestion(e.questionId)}
        </span>
      </span>
      <span className="shrink-0 font-mono text-xs text-zinc-500 tabular-nums dark:text-zinc-400" title={`Marcaste ${e.selected}; la clave es ${e.correct}`}>
        <span className="sr-only">Marcaste </span>{e.selected}
        <span className="mx-1 text-zinc-300 dark:text-zinc-700">/</span>
        <span className="sr-only">clave </span><span className="text-zinc-900 dark:text-zinc-100">{e.correct}</span>
      </span>
    </>
  )
}

/** «Cuaderno de errores»: lista de preguntas falladas y, al elegir una, su detalle con la solución. */
export function MistakeNotebook({ entries }: { entries: MistakeEntry[] }) {
  const start = useStartPracticeSet()
  const wide = useMediaQuery('(min-width: 1024px)')
  const available = SUBJECT_ORDER.filter((s) => entries.some((e) => e.subject === s))
  const [filter, setFilter] = useState<SubjectId | 'todas'>('todas')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [limit, setLimit] = useState(PAGE)
  const visible = useMemo(() => entries.filter((e) => filter === 'todas' || e.subject === filter), [entries, filter])

  if (!entries.length) {
    return (
      <EmptyState title="No tienes errores pendientes">
        Aquí aparecen las preguntas cuyo último intento fue incorrecto. Cuando las respondes bien, salen del cuaderno.
      </EmptyState>
    )
  }

  const shown = visible.slice(0, limit)
  // En escritorio siempre hay una pregunta abierta en el panel de detalle; en móvil, solo la que se toque.
  const selected = shown.find((e) => e.questionId === selectedId) ?? (wide ? shown[0] : undefined)
  const revengeCount = filter === 'todas' ? 0 : Math.min(20, visible.length)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<SubjectId | 'todas'>
          label="Filtrar por asignatura"
          size="sm"
          value={filter}
          onChange={(v) => {
            setFilter(v)
            setLimit(PAGE)
            setSelectedId(null)
          }}
          className="max-w-full overflow-x-auto"
          options={[
            { value: 'todas', label: 'Todas' },
            ...available.map((s) => ({ value: s, label: <span className="whitespace-nowrap">{SUBJECTS[s].short}</span> })),
          ]}
        />
        <div className="flex items-center gap-3">
          {filter === 'todas' && (
            <p className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">Elige una asignatura para el modo revancha</p>
          )}
          <Button
            size="sm"
            variant="primary"
            disabled={filter === 'todas'}
            onClick={() => filter !== 'todas' && start(revengeDraft(filter, entries))}
            title="Repite en modo práctica hasta 20 preguntas falladas; cada acierto la saca del cuaderno"
          >
            Modo revancha
            {revengeCount > 0 && <span className="font-mono text-[11px] tabular-nums opacity-70">{revengeCount}</span>}
          </Button>
        </div>
      </div>

      {wide ? (
        <div className="grid grid-cols-[minmax(0,22rem)_minmax(0,1fr)] items-start gap-6">
          <Panel className="overflow-hidden">
            <ul className="max-h-[calc(100dvh-14rem)] divide-y divide-zinc-200/80 overflow-y-auto dark:divide-zinc-800/80" aria-label="Preguntas falladas">
              {shown.map((e) => {
                const active = selected?.questionId === e.questionId
                return (
                  <li key={e.questionId}>
                    <button
                      type="button"
                      aria-current={active ? 'true' : undefined}
                      onClick={() => setSelectedId(e.questionId)}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                        active ? 'bg-zinc-100 dark:bg-zinc-800/60' : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40',
                      )}
                    >
                      <RowContent e={e} />
                    </button>
                  </li>
                )
              })}
            </ul>
            {visible.length > limit && (
              <div className="border-t border-zinc-200/80 p-2 dark:border-zinc-800/80">
                <Button variant="ghost" size="sm" className="w-full" onClick={() => setLimit((l) => l + PAGE)}>
                  Mostrar {Math.min(PAGE, visible.length - limit)} más
                </Button>
              </div>
            )}
          </Panel>
          <Panel className="sticky top-6 p-6">
            {selected ? <MistakeDetail key={selected.questionId} entry={selected} /> : null}
          </Panel>
        </div>
      ) : (
        <>
          <Panel className="overflow-hidden">
            <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80" aria-label="Preguntas falladas">
              {shown.map((e) => {
                const isOpen = selected?.questionId === e.questionId
                return (
                  <li key={e.questionId}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setSelectedId(isOpen ? null : e.questionId)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
                    >
                      <RowContent e={e} />
                      <ChevronDown aria-hidden className={cn('size-4 shrink-0 text-zinc-400 transition-transform', isOpen && 'rotate-180')} />
                    </button>
                    {isOpen && (
                      <div className="border-t border-zinc-200/80 bg-[#FAFAFA] px-4 py-5 dark:border-zinc-800/80 dark:bg-[#0c0c0e]">
                        <MistakeDetail entry={e} />
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </Panel>
          {visible.length > limit && (
            <Button variant="secondary" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
              Mostrar {Math.min(PAGE, visible.length - limit)} más
            </Button>
          )}
        </>
      )}
    </div>
  )
}
