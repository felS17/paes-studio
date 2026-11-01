import { useMemo, useState } from 'react'
import { Segmented } from '@/components/ui/segmented'
import { cn } from '@/lib/utils'
import type { ExamMode, OptionKey, Passage, Question } from '@/types/exam'

type Filter = 'todas' | 'pendientes' | 'duda'

interface NavigatorProps {
  questions: Question[]
  passages: Passage[]
  current: number
  answers: Record<string, OptionKey>
  flagged: string[]
  checked: Record<string, true>
  mode: ExamMode
  onJump: (index: number) => void
}

/** Hoja de respuestas: estado de cada pregunta (respondida, sin responder, con duda) y salto directo. */
export function QuestionNavigator({ questions, passages, current, answers, flagged, checked, mode, onJump }: NavigatorProps) {
  const [filter, setFilter] = useState<Filter>('todas')
  const flaggedSet = useMemo(() => new Set(flagged), [flagged])
  const answeredCount = questions.filter((q) => answers[q.id]).length
  const groups = useMemo(() => {
    const titles = new Map(passages.map((p) => [p.id, p.title]))
    const out: { label: string | null; items: { q: Question; index: number }[] }[] = []
    questions.forEach((q, index) => {
      const label = q.passageId ? (titles.get(q.passageId) ?? null) : null
      const last = out[out.length - 1]
      if (last && last.label === label) last.items.push({ q, index })
      else out.push({ label, items: [{ q, index }] })
    })
    return out
  }, [questions, passages])

  return (
    <nav aria-label="Navegación de preguntas" className="flex h-full flex-col">
      <div className="space-y-3 border-b border-zinc-200/80 p-4 dark:border-zinc-800/80">
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ['Respondidas', answeredCount],
            ['Con duda', flagged.length],
            ['Pendientes', questions.length - answeredCount],
          ].map(([label, value]) => (
            <div key={label as string}>
              <dd className="font-mono text-[15px] font-medium tabular-nums">{value}</dd>
              <dt className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</dt>
            </div>
          ))}
        </dl>
        <Segmented<Filter>
          label="Filtrar preguntas"
          size="sm"
          className="flex w-full [&>button]:flex-1"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'todas', label: 'Todas' },
            { value: 'pendientes', label: 'Pendientes' },
            { value: 'duda', label: 'Con duda' },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.label && <p className="mb-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{g.label}</p>}
            <ol className="grid grid-cols-6 gap-1.5">
              {g.items.map(({ q, index }) => {
                const answered = Boolean(answers[q.id])
                const isFlagged = flaggedSet.has(q.id)
                const verified = mode === 'practica' && checked[q.id]
                const correct = verified && answers[q.id] === q.answer
                const visible =
                  filter === 'todas' || (filter === 'pendientes' && !answered) || (filter === 'duda' && isFlagged)
                const state = verified ? (correct ? 'correcta' : 'incorrecta') : answered ? 'respondida' : 'sin responder'
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      onClick={() => onJump(index)}
                      aria-current={index === current ? 'step' : undefined}
                      aria-label={`Pregunta ${q.number}, ${state}${isFlagged ? ', con duda' : ''}`}
                      className={cn(
                        'relative flex h-8 w-full items-center justify-center rounded-md border font-mono text-[11.5px] tabular-nums transition-colors duration-150',
                        !visible && 'opacity-25',
                        verified
                          ? correct
                            ? 'border-emerald-500/40 bg-emerald-500/[0.08] text-emerald-800 dark:text-emerald-300'
                            : 'border-rose-500/40 bg-rose-500/[0.08] text-rose-800 dark:text-rose-300'
                          : answered
                            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                            : 'border-zinc-200/90 bg-white text-zinc-600 hover:border-zinc-400 dark:border-zinc-800 dark:bg-[#121215] dark:text-zinc-400 dark:hover:border-zinc-600',
                        index === current && 'ring-2 ring-zinc-900/80 ring-offset-1 ring-offset-white dark:ring-zinc-100/80 dark:ring-offset-[#121215]',
                      )}
                    >
                      {q.number}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-white bg-zinc-500 dark:border-[#121215] dark:bg-zinc-400" aria-hidden />
                      )}
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-zinc-200/80 px-4 py-3 text-[11px] text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-zinc-900 dark:bg-zinc-100" />Respondida</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-zinc-300 dark:border-zinc-700" />Sin responder</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-zinc-500 dark:bg-zinc-400" />Con duda</span>
        {mode === 'practica' && (
          <>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-emerald-500/50 bg-emerald-500/20" />Correcta</span>
            <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-rose-500/50 bg-rose-500/20" />Incorrecta</span>
          </>
        )}
      </div>
    </nav>
  )
}
