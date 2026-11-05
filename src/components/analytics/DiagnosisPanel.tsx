import { useState } from 'react'
import { InspectButton } from '@/components/inspector/InspectButton'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { Segmented } from '@/components/ui/segmented'
import { Tag } from '@/components/ui/subject-tag'
import { SUBJECTS } from '@/data/subjects'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import type { AttemptRecord } from '@/types/analytics'
import type { SubjectId } from '@/types/exam'
import { diagnosisSubjects, type WeakAxis } from '@/utils/analytics'
import { axisPracticeDraft } from '@/utils/practice'

const PRIORITY_LABEL = { alta: 'Prioridad alta', media: 'Prioridad media', baja: 'Prioridad baja' } as const

function AxisRow({ w, subject, onPractice }: { w: WeakAxis; subject: SubjectId; onPractice: () => void }) {
  const pct = Math.round(w.accuracy * 100)
  return (
    <li className="grid gap-x-8 gap-y-3 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_auto] sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[14px] font-medium">{w.axis}</p>
          {w.priority !== 'baja' && <Tag>{PRIORITY_LABEL[w.priority]}</Tag>}
        </div>
        <p className="mt-1 text-[12.5px] text-zinc-500 dark:text-zinc-400">
          {w.weakestTopic
            ? <>Tema más débil: {w.weakestTopic.topic} <span className="font-mono tabular-nums">({w.weakestTopic.correct}/{w.weakestTopic.total})</span></>
            : 'Aún no hay un tema claramente más débil.'}
        </p>
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-mono text-[15px] font-medium tabular-nums">{pct} %</span>
          <span className="text-xs text-zinc-500 tabular-nums dark:text-zinc-400">{w.correct} de {w.total}</span>
        </div>
        <div
          className="relative mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800"
          role="meter"
          aria-label={`Dominio de ${w.axis}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-valuetext={`${pct} % de acierto`}
        >
          <div className="h-full rounded-full bg-progress" style={{ width: `${Math.max(pct, 2)}%` }} />
          <span aria-hidden className="absolute inset-y-0 left-1/2 w-px bg-zinc-400/70 dark:bg-zinc-500/70" />
          <span aria-hidden className="absolute inset-y-0 left-[70%] w-px bg-zinc-400/70 dark:bg-zinc-500/70" />
        </div>
      </div>
      <div className="flex items-center gap-1 justify-self-start sm:justify-self-end">
        <InspectButton target={{ kind: 'subject', subject, axis: w.axis }} name={w.axis} />
        <Button size="sm" onClick={onPractice}>Practicar este eje</Button>
      </div>
    </li>
  )
}

/** «Ejes por mejorar»: los tres ejes con menor acierto de la asignatura elegida, con acción directa. */
export function DiagnosisPanel({ attempts }: { attempts: AttemptRecord[] }) {
  const start = useStartPracticeSet()
  const data = diagnosisSubjects(attempts)
  const weakestFirst = [...data].sort((a, b) => a.axes[0].accuracy - b.axes[0].accuracy)[0]?.subject
  const [picked, setPicked] = useState<SubjectId | null>(null)
  const current = data.find((d) => d.subject === picked) ?? data.find((d) => d.subject === weakestFirst)

  if (!current) {
    return (
      <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
        Responde al menos 3 preguntas de un eje para ver qué reforzar.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {data.length > 1 ? (
          <Segmented<SubjectId>
            label="Asignatura"
            value={current.subject}
            onChange={setPicked}
            className="max-w-full overflow-x-auto"
            options={data.map((d) => ({ value: d.subject, label: <span className="whitespace-nowrap">{SUBJECTS[d.subject].short}</span> }))}
          />
        ) : (
          <p className="text-[13.5px] font-medium">{SUBJECTS[current.subject].short}</p>
        )}
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Según tu último intento de cada pregunta. Marcas en 50 % y 70 %.</p>
      </div>
      <Panel>
        <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
          {current.axes.map((w) => (
            <AxisRow key={w.axis} w={w} subject={current.subject} onPractice={() => start(axisPracticeDraft(current.subject, w.axis, attempts))} />
          ))}
        </ul>
      </Panel>
    </div>
  )
}
