import { useMemo } from 'react'
import { EmptyState } from '@/components/ui/empty-state'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { summarizeCadence, type CadenceQuadrant } from '@/utils/telemetry'

const COUNTERS: { key: CadenceQuadrant; label: string; hint: string }[] = [
  { key: 'fluido', label: 'seguras', hint: 'correctas en menos de 1:30' },
  { key: 'fuga', label: 'lentas', hint: 'correctas en más de 2:30' },
  { key: 'indecision', label: 'dudas de último minuto', hint: 'cambiaste de alternativa' },
  { key: 'ciego', label: 'errores por apuro', hint: 'incorrectas en menos de 35 s' },
]

/** Pestaña `telemetría`: los 4 contadores del detector de dudas, sin más explicación que su definición. */
export function TelemetryCounters() {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const summary = useMemo(() => summarizeCadence(attempts.flatMap((a) => a.questions ?? [])), [attempts])
  if (!summary.measured) return <EmptyState title="termina una práctica y aquí verás tu ritmo" />
  return (
    <div className="@container">
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-200/80 @2xl:grid-cols-4 dark:border-zinc-800/80 dark:bg-zinc-800/80">
      {COUNTERS.map(({ key, label, hint }) => {
        const { count } = summary.quadrants[key]
        return (
          <div key={key} className="min-w-0 bg-surface p-4">
            <dt className="font-mono text-[12px] text-zinc-900 dark:text-zinc-100">{label}</dt>
            <dd className="mt-2">
              <span className="font-mono text-[24px] leading-none font-semibold tabular-nums">{count}</span>
              <span className="ml-1.5 font-mono text-[12px] text-zinc-500 tabular-nums dark:text-zinc-400">{Math.round((count / summary.measured) * 100)} %</span>
              <span className="mt-1.5 block text-[12px] text-zinc-500 dark:text-zinc-400">{hint}</span>
            </dd>
          </div>
        )
      })}
      </dl>
    </div>
  )
}
