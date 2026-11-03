import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, ChevronDown, Flag, Minus, X } from 'lucide-react'
import { AxisRadar } from '@/components/analytics/AxisRadar'
import { ScoreRuler, type RulerMarker } from '@/components/analytics/ScoreRuler'
import { QuestionCard } from '@/components/exam/QuestionCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { Segmented } from '@/components/ui/segmented'
import { SubjectTag } from '@/components/ui/subject-tag'
import { SUBJECTS, subjectLabel } from '@/data/subjects'
import { useExam } from '@/hooks/useExam'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import type { QuestionResult } from '@/types/analytics'
import { isDailySetId } from '@/utils/daily'
import { formatDate, formatDuration, formatTime } from '@/utils/format'

type ReviewFilter = 'repasar' | 'todas' | 'incorrectas' | 'omitidas' | 'duda'

function StatusIcon({ q }: { q: QuestionResult }) {
  if (q.selected === null) return <Minus className="size-3.5 text-zinc-400" aria-label="Sin responder" />
  return q.isCorrect ? (
    <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" aria-label="Correcta" />
  ) : (
    <X className="size-3.5 text-rose-600 dark:text-rose-400" aria-label="Incorrecta" />
  )
}

export function ResultsPage() {
  const { attemptId } = useParams()
  const attempts = useAnalyticsStore((s) => s.attempts)
  const attempt = attempts.find((a) => a.id === attemptId)
  const { exam } = useExam(attempt?.examId)
  const [filterChoice, setFilter] = useState<ReviewFilter | null>(null)
  const [openChoice, setOpen] = useState<string | null | undefined>(undefined)

  const previousBest = useMemo(() => {
    if (!attempt) return null
    const prev = attempts.filter((a) => a.subject === attempt.subject && a.finishedAt < attempt.finishedAt)
    return prev.length ? Math.max(...prev.map((a) => a.paesScore)) : null
  }, [attempts, attempt])

  if (!attempt) {
    return (
      <EmptyState title="No encontramos este resultado" action={<Button asChild><Link to="/analitica">Ir a analítica</Link></Button>}>
        Puede que lo hayas borrado o que pertenezca a otro navegador. Importa tu respaldo desde Analítica para recuperarlo.
      </EmptyState>
    )
  }

  const daily = isDailySetId(attempt.examId)
  const toReview = attempt.questions.filter((q) => !q.isCorrect)
  // Por defecto se muestran las preguntas a repasar (incorrectas y omitidas), con la primera abierta.
  const filter: ReviewFilter = filterChoice ?? (toReview.length ? 'repasar' : 'todas')
  const open = openChoice === undefined ? (toReview[0]?.id ?? null) : openChoice

  const markers: RulerMarker[] = [
    { value: attempt.paesScore, label: 'Este intento', emphasis: true },
    ...(previousBest !== null ? [{ value: previousBest, label: 'Mejor anterior' }] : []),
  ]
  const questionsById = new Map(exam?.questions.map((q) => [q.id, q]))
  const list = attempt.questions.filter(
    (q) =>
      filter === 'todas' ||
      (filter === 'repasar' && !q.isCorrect) ||
      (filter === 'incorrectas' && q.selected !== null && !q.isCorrect) ||
      (filter === 'omitidas' && q.selected === null) ||
      (filter === 'duda' && q.flagged),
  )
  const stats: [string, React.ReactNode][] = [
    ['Correctas', attempt.correct],
    ['Incorrectas', attempt.incorrect],
    ['Sin responder', attempt.omitted],
    ...(daily ? [] : [['Puntaje P', `${attempt.scorableCorrect}/${attempt.scorableTotal}`] as [string, React.ReactNode]]),
    ['Tiempo', formatDuration(attempt.durationMs)],
  ]

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/analitica"><ArrowLeft />Analítica</Link>
        </Button>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SubjectTag subject={attempt.subject} label={daily ? 'Lectora, Matemática y Ciencias o Historia' : subjectLabel(attempt.subject, attempt.area)} />
            <h1 className="mt-1 text-[22px] font-semibold tracking-tight sm:text-2xl">{attempt.examTitle}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <Badge tone={attempt.mode === 'ensayo' ? 'solid' : 'outline'}>{attempt.mode === 'ensayo' ? 'Modo ensayo' : 'Modo práctica'}</Badge>
              {formatDate(attempt.finishedAt)}, {formatTime(attempt.finishedAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild><Link to={`/ensayo/${attempt.examId}`}>Volver a rendir</Link></Button>
            <Button variant="primary" asChild><Link to="/ensayos">Elegir otro ensayo</Link></Button>
          </div>
        </div>
      </div>

      <Panel className="overflow-hidden">
        <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[auto_1fr] md:items-end">
          {daily ? (
            <div className="md:col-span-2">
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Desafío Diario</p>
              <p className="mt-1 font-mono text-[56px] leading-none font-semibold tracking-tight tabular-nums">
                {attempt.correct}<span className="text-zinc-400 dark:text-zinc-600">/{attempt.totalQuestions}</span>
              </p>
              <p className="mt-2 max-w-md text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {attempt.answered === attempt.totalQuestions
                  ? 'Respondiste las tres preguntas: el día cuenta para tu racha. El desafío no se convierte a puntaje PAES porque mezcla asignaturas.'
                  : 'Responde las tres preguntas para que el día cuente en tu racha.'}
              </p>
            </div>
          ) : (<>
          <div>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Puntaje PAES</p>
            <p className="mt-1 font-mono text-[56px] leading-none font-semibold tracking-tight tabular-nums">{attempt.paesScore}</p>
            <p className="mt-2 max-w-[17rem] text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {attempt.scoreIsExact
                ? 'Conversión exacta con la tabla oficial de esta prueba.'
                : attempt.mode === 'practica'
                  ? 'Estimación según tu tasa de acierto en las preguntas que respondiste.'
                  : 'Estimación: tu proporción de aciertos llevada a la tabla de transformación oficial.'}
            </p>
          </div>
          <ScoreRuler markers={markers} />
          </>)}
        </div>
        <dl className={cn('grid grid-cols-2 border-t border-zinc-200/80 dark:border-zinc-800/80', daily ? 'sm:grid-cols-4' : 'sm:grid-cols-5')}>
          {stats.map(([label, value]) => (
            <div key={label} className="border-zinc-200/80 px-5 py-3 not-last:border-r max-sm:odd:border-r dark:border-zinc-800/80">
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
              <dd className="mt-0.5 font-mono text-[17px] font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <div className={cn('grid items-start gap-6', !daily && 'lg:grid-cols-[1fr_1.4fr]')}>
        {!daily && (
          <Panel>
            <PanelHeader title="Rendimiento por eje" description={attempt.mode === 'practica' ? 'Solo preguntas respondidas' : undefined} />
            <AxisRadar stats={attempt.perAxis} order={SUBJECTS[attempt.subject].axes} className="p-4" />
          </Panel>
        )}

        <Panel>
          <PanelHeader
            title="Revisión con solución"
            description="En las preguntas incorrectas u omitidas, la solución se despliega al abrirlas."
          />
          <div className="border-b border-zinc-200/80 px-4 py-2.5 dark:border-zinc-800/80">
            <Segmented<ReviewFilter>
              label="Filtrar revisión"
              size="sm"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'repasar', label: `Para repasar (${toReview.length})` },
                { value: 'todas', label: 'Todas' },
                { value: 'incorrectas', label: 'Incorrectas' },
                { value: 'omitidas', label: 'Sin responder' },
                { value: 'duda', label: 'Con duda' },
              ]}
            />
          </div>
          {list.length === 0 ? (
            <p className="px-4 py-6 text-[13px] text-zinc-500 dark:text-zinc-400">No hay preguntas en este filtro.</p>
          ) : (
            <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
              {list.map((q) => {
                const full = questionsById.get(q.id)
                const isOpen = open === q.id
                return (
                  <li key={q.id}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : q.id)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40"
                    >
                      <span className="w-7 font-mono text-[12.5px] font-medium tabular-nums">{q.number}</span>
                      <StatusIcon q={q} />
                      <span className="min-w-0 flex-1 truncate text-[13px]">
                        {q.topic}
                        {q.topic !== q.axis && <span className="ml-2 text-zinc-500 dark:text-zinc-400">{q.axis}</span>}
                      </span>
                      {q.flagged && <Flag className="size-3.5 fill-zinc-900 text-zinc-900 dark:fill-zinc-100 dark:text-zinc-100" aria-label="Con duda" />}
                      <span className="font-mono text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                        {q.selected ?? '–'}
                        <span className="mx-1 text-zinc-300 dark:text-zinc-700">/</span>
                        <span className="text-zinc-900 dark:text-zinc-100">{q.correct}</span>
                      </span>
                      <ChevronDown className={cn('size-4 text-zinc-400 transition-transform', isOpen && 'rotate-180')} />
                    </button>
                    {isOpen && (
                      <div className="border-t border-zinc-200/80 bg-[#FAFAFA] px-4 py-5 dark:border-zinc-800/80 dark:bg-[#0c0c0e]">
                        {full ? (
                          <QuestionCard
                            question={full}
                            mode="revision"
                            position={attempt.questions.indexOf(q) + 1}
                            total={attempt.questions.length}
                            selected={q.selected ?? undefined}
                            revealed
                            flagged={q.flagged}
                          />
                        ) : (
                          <p className="text-[13px] text-zinc-500">Cargando pregunta…</p>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
