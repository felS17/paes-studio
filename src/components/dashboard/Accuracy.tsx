import { cn } from '@/lib/utils'
import { formatPercent } from '@/utils/format'
import type { SubtopicStat } from '@/utils/subtopics'

/** Acierto histórico: cifra en mono y una barra fina (vacía si aún no respondes). */
export function Accuracy({ stat, className }: { stat: SubtopicStat | undefined; className?: string }) {
  if (!stat?.answered) {
    return <span className={cn('w-10 shrink-0 font-mono sm:w-[5.5rem] text-[12.5px] text-zinc-400 tabular-nums dark:text-zinc-600', className)} title="Aún no respondes preguntas de aquí">—</span>
  }
  const pct = stat.accuracy ?? 0
  return (
    <span className={cn('flex w-10 shrink-0 items-center gap-2 sm:w-[5.5rem]', className)} title={`${stat.correct} de ${stat.answered} correctas (último intento de cada pregunta)`}>
      <span className="w-10 font-mono text-[12.5px] font-medium tabular-nums">{formatPercent(pct)}</span>
      <span aria-hidden className="hidden h-1 w-10 overflow-hidden sm:block rounded-full bg-zinc-200 dark:bg-zinc-800">
        <span className="block h-full rounded-full bg-progress" style={{ width: `${Math.round(pct * 100)}%` }} />
      </span>
    </span>
  )
}
