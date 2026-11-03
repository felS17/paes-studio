import { Link, useSearchParams } from 'react-router-dom'
import { BackupActions } from '@/components/analytics/BackupActions'
import { DiagnosisPanel } from '@/components/analytics/DiagnosisPanel'
import { MistakeNotebook } from '@/components/analytics/MistakeNotebook'
import { ScoreSummary } from '@/components/analytics/ScoreSummary'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs } from '@/components/ui/tabs'
import { SUBJECTS } from '@/data/subjects'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import type { AttemptRecord } from '@/types/analytics'
import { diagnosisSubjects, mistakeNotebook } from '@/utils/analytics'
import { latestBySubject } from '@/utils/projection'

type View = 'ejes' | 'errores' | 'evolucion'
const VIEWS: View[] = ['ejes', 'errores', 'evolucion']

function Metric({ label, value, unit, note }: { label: string; value: React.ReactNode; unit?: string; note: React.ReactNode }) {
  return (
    <div className="min-w-0 bg-white px-5 py-4 dark:bg-[#121215]">
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-1.5">
        <span className="font-mono text-[22px] leading-none font-semibold tracking-tight tabular-nums">{value}</span>
        {unit && <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">{unit}</span>}
        <span className="mt-1.5 block text-xs text-zinc-500 sm:truncate dark:text-zinc-400">{note}</span>
      </dd>
    </div>
  )
}

/** Resumen en una franja: lo esencial antes de entrar al detalle. */
function Summary({ attempts, mistakes }: { attempts: AttemptRecord[]; mistakes: number }) {
  const latest = [...latestBySubject(attempts).values()]
  const average = latest.length ? Math.round(latest.reduce((s, l) => s + l.score, 0) / latest.length) : null
  const weakest = diagnosisSubjects(attempts)
    .map((d) => ({ subject: d.subject, axis: d.axes[0] }))
    .sort((a, b) => a.axis.accuracy - b.axis.accuracy)[0]
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-200/80 lg:grid-cols-4 dark:border-zinc-800/80 dark:bg-zinc-800/80">
        <Metric
          label="Promedio actual"
          value={average ?? '–'}
          unit={average !== null ? 'pts' : undefined}
          note={`Último puntaje de ${latest.length} ${latest.length === 1 ? 'asignatura' : 'asignaturas'}`}
        />
        <Metric label="Intentos guardados" value={attempts.length} note="Ensayos y prácticas" />
        <Metric label="Por repasar" value={mistakes} note={mistakes === 1 ? 'Pregunta fallada' : 'Preguntas falladas'} />
        <Metric
          label="Eje más débil"
          value={weakest ? Math.round(weakest.axis.accuracy * 100) : '–'}
          unit={weakest ? '%' : undefined}
          note={weakest ? `${weakest.axis.axis}, ${SUBJECTS[weakest.subject].short}` : 'Aún sin datos suficientes'}
        />
    </dl>
  )
}

export function AnalyticsPage() {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const mistakes = mistakeNotebook(attempts)
  const [params, setParams] = useSearchParams()
  const requested = params.get('vista') as View | null
  const view: View = requested && VIEWS.includes(requested) ? requested : 'ejes'
  const setView = (v: View) => setParams(v === 'ejes' ? {} : { vista: v }, { replace: true })
  const axesCount = diagnosisSubjects(attempts).reduce((n, d) => n + d.axes.length, 0)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analítica"
        description="Calculada con los intentos guardados en este navegador."
        actions={<BackupActions />}
      />
      {attempts.length === 0 ? (
        <EmptyState
          title="Todavía no hay intentos registrados"
          action={<Button variant="primary" asChild><Link to="/ensayos">Elegir un ensayo</Link></Button>}
        >
          Entrega un ensayo o termina una práctica para ver tu diagnóstico. Si tienes un respaldo, impórtalo con el botón de arriba.
        </EmptyState>
      ) : (
        <>
          <Summary attempts={attempts} mistakes={mistakes.length} />
          <Tabs<View>
            label="Secciones de la analítica"
            value={view}
            onChange={setView}
            items={[
              { value: 'ejes', label: 'Ejes por mejorar', count: axesCount },
              { value: 'errores', label: 'Cuaderno de errores', count: mistakes.length },
              { value: 'evolucion', label: 'Evolución' },
            ]}
          >
            {view === 'ejes' && <DiagnosisPanel attempts={attempts} />}
            {view === 'errores' && <MistakeNotebook entries={mistakes} />}
            {view === 'evolucion' && <ScoreSummary attempts={attempts} />}
          </Tabs>
        </>
      )}
    </div>
  )
}
