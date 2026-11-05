import { useMemo } from 'react'
import { InspectButton } from '@/components/inspector/InspectButton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { SUBJECTS } from '@/data/subjects'
import { TEMARIO_BY_SUBJECT } from '@/data/temario'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import type { SubjectId } from '@/types/exam'
import type { Subtopic } from '@/types/temario'
import { latestResults } from '@/utils/analytics'
import { formatPercent, plural } from '@/utils/format'
import { combineStats, subtopicDrillDraft, subtopicStats, type DrillSize, type SubtopicStat } from '@/utils/subtopics'
import { TopicBrowser } from './TopicBrowser'

/** Acierto histórico: cifra en mono y una barra fina (vacía si aún no respondes). */
export function Accuracy({ stat, className }: { stat: SubtopicStat | undefined; className?: string }) {
  if (!stat?.answered) {
    return <span className={cn('font-mono text-[12.5px] text-zinc-400 tabular-nums dark:text-zinc-600', className)} title="Aún no respondes preguntas de aquí">—</span>
  }
  const pct = stat.accuracy ?? 0
  return (
    <span className={cn('flex items-center gap-2', className)} title={`${stat.correct} de ${stat.answered} correctas (último intento de cada pregunta)`}>
      <span className="w-10 font-mono text-[12.5px] font-medium tabular-nums">{formatPercent(pct)}</span>
      <span aria-hidden className="h-1 w-10 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <span className="block h-full rounded-full bg-progress" style={{ width: `${Math.round(pct * 100)}%` }} />
      </span>
    </span>
  )
}

const SIZES: { value: DrillSize; label: (n: number) => string }[] = [
  { value: 10, label: () => '10 preguntas' },
  { value: 20, label: () => '20 preguntas' },
  { value: 'todas', label: (n) => `Todas (${n})` },
]

/** Diálogo «Practicar»: se abre desde el resumen del tema, donde no caben los botones de la fila. */
export function DrillDialog({ subtopic, stat, onClose }: { subtopic: Subtopic | null; stat?: SubtopicStat; onClose: () => void }) {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const startPractice = useStartPracticeSet()
  const n = subtopic?.questionCount ?? 0
  const launch = (size: DrillSize) => {
    if (!subtopic) return
    startPractice(subtopicDrillDraft(subtopic.id, size, attempts, latestResults(attempts)))
  }
  return (
    <Dialog open={Boolean(subtopic)} onOpenChange={(open) => !open && onClose()}>
      {subtopic && (
        <DialogContent
          title={`Practicar «${subtopic.title}»`}
          description={
            <>
              Juntamos preguntas de este tema de todas las pruebas ({plural(n, 'pregunta')} disponibles) y las abrimos con la
              explicación al momento. Primero van {stat?.pending ? `tus ${plural(stat.pending, 'error pendiente', 'errores pendientes')}` : 'las que fallaste'} y luego
              las que aún no respondes.
            </>
          }
        >
          <div className="mt-5 grid grid-cols-3 gap-2" role="group" aria-label="Cantidad de preguntas">
            {SIZES.map((s) => {
              const disabled = s.value !== 'todas' && s.value >= n
              return (
                <Button
                  key={String(s.value)}
                  variant={s.value === 10 && !disabled ? 'primary' : 'secondary'}
                  size="lg"
                  disabled={disabled}
                  title={disabled ? `Este tema tiene ${plural(n, 'pregunta')}: usa «Todas».` : undefined}
                  onClick={() => launch(s.value)}
                  className="px-2"
                >
                  {s.label(n)}
                </Button>
              )
            })}
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}

const QUICK_SIZES: { value: DrillSize; label: string }[] = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 'todas', label: 'Todas' },
]

/** «Practicar: 10 · 20 · Todas» sin pasos intermedios: un clic y parte la práctica. */
function PracticeButtons({ sub, onPractice }: { sub: Subtopic; onPractice: (size: DrillSize) => void }) {
  const n = sub.questionCount
  return (
    <div role="group" aria-label={`Practicar «${sub.title}»`} className="flex items-center gap-1.5">
      <span className="text-xs text-zinc-500 dark:text-zinc-400">Practicar:</span>
      <div className="inline-flex divide-x divide-zinc-200/80 overflow-hidden rounded-lg border border-zinc-200/80 dark:divide-zinc-800/80 dark:border-zinc-800/80">
        {QUICK_SIZES.map(({ value, label }) => {
          const disabled = value === 'todas' ? !n : value >= n
          return (
            <button
              key={label}
              type="button"
              disabled={disabled}
              title={!n ? 'Aún no tenemos preguntas de este tema' : disabled ? `Este tema tiene ${plural(n, 'pregunta')}: usa «Todas».` : undefined}
              aria-label={value === 'todas' ? `Practicar las ${n} preguntas de «${sub.title}»` : `Practicar ${value} preguntas de «${sub.title}»`}
              onClick={() => onPractice(value)}
              className="h-7 min-w-8 px-2 text-xs font-medium tabular-nums transition-colors hover:bg-zinc-900/[0.04] disabled:text-zinc-400 disabled:hover:bg-transparent dark:hover:bg-zinc-100/[0.06] dark:disabled:text-zinc-600"
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SubtopicRow({ sub, stat, onPractice }: { sub: Subtopic; stat?: SubtopicStat; onPractice: (size: DrillSize) => void }) {
  return (
    <li className="flex flex-col gap-2 px-4 py-2.5 @3xl:grid @3xl:grid-cols-[minmax(0,1fr)_6.5rem_6.5rem_auto] @3xl:items-center @3xl:gap-4">
      <div className="min-w-0 @3xl:pl-6">
        <p className="text-[13.5px] font-medium">{sub.title}</p>
        {Boolean(stat?.pending) && (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-mono text-zinc-900 tabular-nums dark:text-zinc-100">{stat!.pending}</span> {stat!.pending === 1 ? 'error por repasar' : 'errores por repasar'}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 @3xl:contents dark:text-zinc-400">
        <Accuracy stat={stat} />
        <span className="tabular-nums">
          <span className="font-mono text-[12.5px] text-zinc-900 dark:text-zinc-100">{sub.questionCount}</span> preguntas
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 @3xl:justify-end">
        <InspectButton target={{ kind: 'subtopic', id: sub.id }} name={sub.title} text="Resumen" />
        <PracticeButtons sub={sub} onPractice={onPractice} />
      </div>
    </li>
  )
}

/** Practicar por tema: buscador, filtros y acordeón por eje, con cada tema en una fila lista para partir. */
export function SubtopicExplorer({ subject, onSubjectChange }: { subject: SubjectId; onSubjectChange: (s: SubjectId) => void }) {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const latest = useMemo(() => latestResults(attempts), [attempts])
  const stats = useMemo(() => subtopicStats(attempts, latest), [attempts, latest])
  const startPractice = useStartPracticeSet()
  const temario = TEMARIO_BY_SUBJECT.get(subject)
  if (!temario) return null
  const total = combineStats(temario.axes.flatMap((a) => a.subtopics.map((s) => s.id)), stats)
  const questionTotal = temario.axes.reduce((n, a) => n + a.subtopics.reduce((m, s) => m + s.questionCount, 0), 0)

  return (
    <TopicBrowser
      subject={subject}
      onSubjectChange={onSubjectChange}
      stats={stats}
      actions={
        <a
          href={temario.pdf}
          target="_blank"
          rel="noreferrer"
          className="text-[13px] text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Guía de {SUBJECTS[subject].short} (PDF)
          <span className="sr-only"> (abre en una pestaña nueva)</span>
        </a>
      }
      summary={
        <>
          <span className="font-mono text-zinc-900 tabular-nums dark:text-zinc-100">{questionTotal.toLocaleString('es-CL')}</span> preguntas para practicar.{' '}
          {total.answered ? (
            <>
              Aciertas el <span className="font-mono font-medium text-zinc-900 tabular-nums dark:text-zinc-100">{formatPercent(total.accuracy ?? 0)}</span> de{' '}
              {plural(total.answered, 'pregunta respondida', 'preguntas respondidas')}.
            </>
          ) : (
            'Practica un tema y aquí verás cómo te va en cada uno.'
          )}
        </>
      }
      renderRow={(sub, stat) => (
        <SubtopicRow
          key={sub.id}
          sub={sub}
          stat={stat}
          onPractice={(size) => startPractice(subtopicDrillDraft(sub.id, size, attempts, latest))}
        />
      )}
    />
  )
}
