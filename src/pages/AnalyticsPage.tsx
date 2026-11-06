import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BackupActions } from '@/components/analytics/BackupActions'
import { MistakeNotebook } from '@/components/analytics/MistakeNotebook'
import { ProcessTable } from '@/components/analytics/ProcessTable'
import { TelemetryCounters } from '@/components/analytics/TelemetryCounters'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { LoadBar } from '@/components/ui/load-bar'
import { Tabs } from '@/components/ui/tabs'
import { EXAMS_BY_ID } from '@/data/catalog'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { globalAccuracy, mistakeNotebook, worstSubject } from '@/utils/analytics'
import { revengeDraft } from '@/utils/practice'
import { averagePaceMs } from '@/utils/telemetry'

type View = 'procesos' | 'telemetria' | 'errores' | 'sistema'
const VIEWS: View[] = ['procesos', 'telemetria', 'errores', 'sistema']

function Gauge({ label, value, unit, children }: { label: string; value: React.ReactNode; unit?: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 bg-surface p-4">
      <dt className="font-mono text-[12px] text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="flex flex-1 flex-col justify-between gap-2.5">
        <span>
          <span className="font-mono text-[24px] leading-none font-semibold tabular-nums">{value}</span>
          {unit && <span className="ml-1.5 font-mono text-[12px] text-zinc-500 tabular-nums dark:text-zinc-400">{unit}</span>}
        </span>
        {children}
      </dd>
    </div>
  )
}

/** Stats como administrador de tareas: 4 medidores de rendimiento arriba y una sola pestaña a la vez abajo. */
export function AnalyticsPage() {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const start = useStartPracticeSet()
  const [params, setParams] = useSearchParams()
  const requested = params.get('vista') as View | null
  const view: View = requested && VIEWS.includes(requested) ? requested : 'procesos'
  const setView = (v: View) => setParams(v === 'procesos' ? {} : { vista: v }, { replace: true })

  const mistakes = useMemo(() => mistakeNotebook(attempts), [attempts])
  const accuracy = useMemo(() => globalAccuracy(attempts), [attempts])
  const paceMs = useMemo(() => averagePaceMs(attempts), [attempts])
  const exams = attempts.filter((a) => EXAMS_BY_ID.has(a.examId)).length
  const practices = attempts.length - exams
  const target = worstSubject(mistakes)

  return (
    <div className="space-y-6">
      <PageHeader title="stats" />
      <div className="@container">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-200/80 @3xl:grid-cols-4 dark:border-zinc-800/80 dark:bg-zinc-800/80">
        <Gauge label="acierto global" value={accuracy === null ? '—' : Math.round(accuracy * 100)} unit={accuracy === null ? undefined : '%'}>
          <LoadBar value={accuracy} segments={16} />
        </Gauge>
        <Gauge label="ensayos completados" value={exams} unit={practices ? `+${practices} prácticas` : undefined} />
        <Gauge label="errores en cola" value={mistakes.length}>
          <Button
            size="sm"
            className="self-start"
            disabled={!target}
            onClick={() => target && start(revengeDraft(target, mistakes))}
            title={target ? `Revancha de ${target}: hasta 20 preguntas falladas` : undefined}
          >
            limpiar errores
          </Button>
        </Gauge>
        <Gauge label="ritmo promedio" value={paceMs === null ? '—' : Math.round(paceMs / 1000)} unit={paceMs === null ? undefined : 's por pregunta'} />
        </dl>
      </div>
      <Tabs<View>
        label="Pestañas de stats"
        value={view}
        onChange={setView}
        items={[
          { value: 'procesos', label: 'procesos' },
          { value: 'telemetria', label: 'telemetría' },
          { value: 'errores', label: 'errores', count: mistakes.length },
          { value: 'sistema', label: 'sistema' },
        ]}
      >
        {view === 'procesos' && <ProcessTable />}
        {view === 'telemetria' && <TelemetryCounters />}
        {view === 'errores' && <MistakeNotebook entries={mistakes} />}
        {view === 'sistema' && <BackupActions />}
      </Tabs>
    </div>
  )
}
