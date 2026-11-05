import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { InspectButton } from '@/components/inspector/InspectButton'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Panel, PanelHeader } from '@/components/ui/panel'
import { Segmented } from '@/components/ui/segmented'
import { SUBJECTS, SUBJECT_ORDER } from '@/data/subjects'
import { cn } from '@/lib/utils'
import type { AttemptRecord } from '@/types/analytics'
import type { SubjectId } from '@/types/exam'
import { subjectOfQuestion } from '@/utils/analytics'
import { formatClock, formatShortDate } from '@/utils/format'
import { axisTimes, changeHistory, FLUENT_MS, hasTelemetry, LEAK_MS, questionsOfSubject, readTelemetry, summarizeCadence, type AxisTime, type ChangeHistoryRow } from '@/utils/telemetry'
import { CadenceMatrix, ToxicDoubt } from './CadenceMatrix'

type Filter = SubjectId | 'todas'

function AxisTimeRow({ row, scale, showSubject }: { row: AxisTime; scale: number; showSubject: boolean }) {
  const slow = row.avgMs > LEAK_MS
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3">
      <p className="min-w-0 truncate text-[13px] font-medium" title={row.axis}>
        {row.axis}
        {showSubject && <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">{SUBJECTS[row.subject].short}</span>}
      </p>
      <p className="flex items-center gap-1">
        <span className="font-mono text-[13px] font-medium tabular-nums" title={`Promedio en ${row.count} preguntas; ${Math.round(row.accuracy * 100)} % de acierto`}>{formatClock(row.avgMs)}</span>
        <InspectButton target={{ kind: 'subject', subject: row.subject, axis: row.axis }} name={row.axis} className="-mr-1.5" />
      </p>
      <div className="relative col-span-2 h-1 rounded-full bg-zinc-200/70 dark:bg-zinc-800" role="img" aria-label={`${formatClock(row.avgMs)} por pregunta${slow ? ', sobre el umbral de 2:30' : ''}`}>
        <div className={cn('h-full rounded-full', slow ? 'bg-amber-500 dark:bg-amber-400' : 'bg-zinc-900 dark:bg-zinc-100')} style={{ width: `${Math.min(100, (row.avgMs / scale) * 100)}%` }} />
        {[FLUENT_MS, LEAK_MS].map((ms) => (
          <span key={ms} aria-hidden className="absolute -inset-y-0.5 w-px bg-zinc-400/70 dark:bg-zinc-500/70" style={{ left: `${(ms / scale) * 100}%` }} />
        ))}
      </div>
    </li>
  )
}

function ChangeRow({ row, maxChanges }: { row: ChangeHistoryRow; maxChanges: number }) {
  const { corrective, neutral, toxic } = row.balance
  const parts = [
    { n: corrective, cls: 'bg-emerald-400 dark:bg-emerald-300' },
    { n: neutral, cls: 'bg-zinc-300 dark:bg-zinc-600' },
    { n: toxic, cls: 'bg-rose-700 dark:bg-rose-600' },
  ].filter((p) => p.n > 0)
  return (
    <li>
      <Link to={`/resultados/${row.attemptId}`} className="block px-4 py-2.5 transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40">
        <span className="flex items-baseline gap-3">
          <span className="min-w-0 flex-1 truncate text-[13px]">{row.examTitle}</span>
          <span className="shrink-0 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">{formatShortDate(row.finishedAt)}</span>
        </span>
        {row.total ? (
          <span className="mt-1.5 flex items-center gap-3">
            <span className="flex h-1.5 min-w-0 flex-1 gap-0.5" aria-hidden>
              {parts.map((p, i) => (
                <span key={i} className={cn('rounded-[1px]', p.cls)} style={{ width: `${(p.n / maxChanges) * 100}%` }} />
              ))}
            </span>
            <span className="shrink-0 font-mono text-[11.5px] text-zinc-600 tabular-nums dark:text-zinc-300" title={`${corrective} te salvaron, ${neutral} no cambiaron nada, ${toxic} te costaron un acierto`}>
              +{corrective} ={neutral} −{toxic}
            </span>
          </span>
        ) : (
          <span className="mt-1 block text-xs text-zinc-500 dark:text-zinc-400">No cambiaste ninguna respuesta</span>
        )}
      </Link>
    </li>
  )
}

/** Sección «Ritmo y decisión» de la analítica: solo considera intentos con telemetría (v2.1 en adelante). */
export function CadencePanel({ attempts }: { attempts: AttemptRecord[] }) {
  const tracked = useMemo(() => attempts.filter(hasTelemetry), [attempts])
  const available = useMemo(() => {
    const seen = new Set<SubjectId>()
    for (const a of tracked) {
      for (const q of a.questions) if (readTelemetry(q)) seen.add(subjectOfQuestion(q.id, a.subject))
    }
    return SUBJECT_ORDER.filter((s) => seen.has(s))
  }, [tracked])
  const [picked, setPicked] = useState<Filter>('todas')
  const filter: Filter = picked !== 'todas' && available.includes(picked) ? picked : 'todas'

  const summary = useMemo(() => summarizeCadence(tracked.flatMap((a) => questionsOfSubject(a, filter))), [filter, tracked])
  const axes = useMemo(() => axisTimes(tracked, filter), [filter, tracked])
  const history = useMemo(() => changeHistory(tracked, filter), [filter, tracked])
  const untracked = attempts.length - tracked.length

  if (!tracked.length) {
    return (
      <EmptyState title="Aún no tienes este diagnóstico" action={<Button variant="primary" asChild><Link to="/ensayos">Elegir un ensayo</Link></Button>}>
        Termina un ensayo o una práctica y aquí verás en qué preguntas vas seguro, cuáles te quitan tiempo y cuándo te juegan en contra las dudas.
        {untracked > 0 && ' Tus intentos anteriores siguen guardados, pero no tienen estas mediciones.'}
      </EmptyState>
    )
  }

  const scale = Math.max(LEAK_MS * 1.15, ...axes.map((a) => a.avgMs))
  const maxChanges = Math.max(1, ...history.map((h) => h.total))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<Filter>
          label="Filtrar por asignatura"
          size="sm"
          value={filter}
          onChange={setPicked}
          className="max-w-full overflow-x-auto"
          options={[
            { value: 'todas', label: 'Todas' },
            ...available.map((s) => ({ value: s, label: <span className="whitespace-nowrap">{SUBJECTS[s].short}</span> })),
          ]}
        />
        {untracked > 0 && (
          <p className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
            {untracked} {untracked === 1 ? 'intento anterior no tiene' : 'intentos anteriores no tienen'} estas mediciones
          </p>
        )}
      </div>

      <CadenceMatrix summary={summary} />

      <div className="overflow-hidden rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
        <ToxicDoubt balance={summary.balance} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel className="overflow-hidden">
          <PanelHeader title="¿Dónde se te va el tiempo?" description="Promedio por pregunta en cada eje, del más lento al más rápido. Marcas en 1:30 y 2:30." />
          {axes.length ? (
            <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
              {axes.map((row) => (
                <AxisTimeRow key={`${row.subject}|${row.axis}`} row={row} scale={scale} showSubject={filter === 'todas'} />
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-[13px] text-zinc-500 dark:text-zinc-400">Aún no hay preguntas respondidas en esta materia.</p>
          )}
        </Panel>
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Tus cambios de respuesta"
            description="Por intento: + te salvaron, = no cambiaron nada, − te costaron un acierto."
          />
          <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
            {history.map((row) => <ChangeRow key={row.attemptId} row={row} maxChanges={maxChanges} />)}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
