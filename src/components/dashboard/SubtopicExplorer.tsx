import { useMemo, useState } from 'react'
import { InspectButton } from '@/components/inspector/InspectButton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Segmented } from '@/components/ui/segmented'
import { SUBJECTS, SUBJECT_ORDER } from '@/data/subjects'
import { subtopicPdfHref, SUBTOPICS_BY_ID, TEMARIO_BY_SUBJECT } from '@/data/temario'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import type { SubjectId } from '@/types/exam'
import type { Subtopic } from '@/types/temario'
import { latestResults } from '@/utils/analytics'
import { formatPercent, plural } from '@/utils/format'
import { combineStats, subtopicDrillDraft, subtopicStats, type DrillSize, type SubtopicStat } from '@/utils/subtopics'

/** Acierto histórico: cifra en mono y una barra fina zinc (vacía si aún no respondes). */
export function Accuracy({ stat, className }: { stat: SubtopicStat | undefined; className?: string }) {
  if (!stat?.answered) {
    return <span className={cn('font-mono text-[12.5px] text-zinc-400 tabular-nums dark:text-zinc-600', className)} title="Aún no respondes preguntas de aquí">—</span>
  }
  const pct = stat.accuracy ?? 0
  return (
    <span className={cn('flex items-center gap-2', className)} title={`${stat.correct} de ${stat.answered} correctas (último intento de cada pregunta)`}>
      <span className="font-mono text-[12.5px] font-medium tabular-nums">{formatPercent(pct)}</span>
      <span aria-hidden className="h-1 w-10 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <span className="block h-full rounded-full bg-zinc-900 dark:bg-zinc-100" style={{ width: `${Math.round(pct * 100)}%` }} />
      </span>
    </span>
  )
}

const SIZES: { value: DrillSize; label: (n: number) => string }[] = [
  { value: 10, label: () => '10 preguntas' },
  { value: 20, label: () => '20 preguntas' },
  { value: 'todas', label: (n) => `Todas (${n})` },
]

/** Diálogo «Practicar subtema»: 10, 20 o todas las preguntas del subtema, de todos los ensayos. */
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

function SubtopicRow({ sub, stat, onPractice }: { sub: Subtopic; stat?: SubtopicStat; onPractice: () => void }) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_6rem_7rem_6.5rem_auto] sm:items-center sm:gap-4">
      <div className="min-w-0">
        <p className="text-[13.5px] font-medium">{sub.title}</p>
        {Boolean(stat?.pending) && (
          <p className="mt-0.5 text-xs text-zinc-900 dark:text-zinc-100">
            <span className="font-mono tabular-nums">{stat!.pending}</span> {stat!.pending === 1 ? 'error pendiente' : 'errores pendientes'}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 sm:contents dark:text-zinc-400">
        <span className="tabular-nums sm:text-right">
          <span className="font-mono text-[12.5px] text-zinc-900 dark:text-zinc-100">{sub.questionCount}</span> preguntas
        </span>
        <Accuracy stat={stat} />
        <a
          href={subtopicPdfHref(sub)}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
          title={`Abrir la guía de ${SUBJECTS[sub.subject].short} en la página de este tema`}
        >
          Guía{sub.pdfPage ? <> p. <span className="font-mono tabular-nums">{sub.pdfPage}</span></> : ' PDF'}
          <span className="sr-only"> (abre en una pestaña nueva)</span>
        </a>
      </div>
      <div className="flex items-center gap-1 self-start sm:self-auto">
        <InspectButton target={{ kind: 'subtopic', id: sub.id }} name={sub.title} />
        <Button
          size="sm"
          onClick={onPractice}
          disabled={!sub.questionCount}
          title={sub.questionCount ? undefined : 'Aún no tenemos preguntas de este tema'}
        >
          Practicar
        </Button>
      </div>
    </li>
  )
}

/** Explorador del temario DEMRE: asignatura → eje → subtema, con preguntas del banco, acierto y drills. */
export function SubtopicExplorer({ subject, onSubjectChange }: { subject: SubjectId; onSubjectChange: (s: SubjectId) => void }) {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const stats = useMemo(() => subtopicStats(attempts), [attempts])
  const [drill, setDrill] = useState<string | null>(null)
  const temario = TEMARIO_BY_SUBJECT.get(subject)
  if (!temario) return null
  const allIds = temario.axes.flatMap((a) => a.subtopics.map((s) => s.id))
  const total = combineStats(allIds, stats)
  const questionTotal = temario.axes.reduce((n, a) => n + a.subtopics.reduce((m, s) => m + s.questionCount, 0), 0)
  const drillSub = drill ? (SUBTOPICS_BY_ID.get(drill) ?? null) : null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Asignatura"
          className="max-w-full overflow-x-auto"
          value={subject}
          onChange={onSubjectChange}
          options={SUBJECT_ORDER.map((id) => ({ value: id, label: SUBJECTS[id].short, title: SUBJECTS[id].name }))}
        />
        <a
          href={temario.pdf}
          target="_blank"
          rel="noreferrer"
          className="text-[13px] text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          Guía de {SUBJECTS[subject].short} (PDF)
          <span className="sr-only"> (abre en una pestaña nueva)</span>
        </a>
      </div>

      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
        <span className="font-mono text-zinc-900 tabular-nums dark:text-zinc-100">{allIds.length}</span> temas en{' '}
        <span className="font-mono text-zinc-900 tabular-nums dark:text-zinc-100">{temario.axes.length}</span> ejes y{' '}
        <span className="font-mono text-zinc-900 tabular-nums dark:text-zinc-100">{questionTotal.toLocaleString('es-CL')}</span> preguntas para practicar.{' '}
        {total.answered ? (
          <>
            Aciertas el <span className="font-mono font-medium text-zinc-900 tabular-nums dark:text-zinc-100">{formatPercent(total.accuracy ?? 0)}</span> en{' '}
            {plural(total.answered, 'pregunta respondida', 'preguntas respondidas')}.
          </>
        ) : (
          'Practica un tema y aquí verás cómo te va en cada uno.'
        )}
      </p>

      {temario.axes.map((axis) => {
        const axisStat = combineStats(axis.subtopics.map((s) => s.id), stats)
        const axisQuestions = axis.subtopics.reduce((n, s) => n + s.questionCount, 0)
        return (
          <section key={axis.name} aria-labelledby={`eje-${axis.name}`}>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
              <h3 id={`eje-${axis.name}`} className="text-[14px] font-semibold tracking-tight">{axis.name}</h3>
              <p className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <span>
                  <span className="font-mono text-zinc-900 tabular-nums dark:text-zinc-100">{axisQuestions}</span> preguntas
                </span>
                <span className="flex items-center gap-2">
                  Acierto <Accuracy stat={axisStat} />
                </span>
              </p>
            </div>
            <ul className="divide-y divide-zinc-200/80 overflow-hidden rounded-xl border border-zinc-200/80 bg-white dark:divide-zinc-800/80 dark:border-zinc-800/80 dark:bg-[#121215]">
              {axis.subtopics.map((s) => {
                const sub = SUBTOPICS_BY_ID.get(s.id)!
                return <SubtopicRow key={s.id} sub={sub} stat={stats.get(s.id)} onPractice={() => setDrill(s.id)} />
              })}
            </ul>
          </section>
        )
      })}

      <DrillDialog subtopic={drillSub} stat={drill ? stats.get(drill) : undefined} onClose={() => setDrill(null)} />
    </div>
  )
}
