import { cn } from '@/lib/utils'
import type { AxisStat } from '@/types/analytics'

/**
 * Rendimiento por eje temático. Se usan barras horizontales sobre una misma línea base (no un gráfico
 * polar): comparan magnitudes con mucha más precisión y se leen igual en móvil.
 * El orden de los ejes es fijo (el del temario) para comparar entre intentos.
 */
export function AxisRadar({ stats, order, className }: {
  stats: Record<string, AxisStat>
  order?: string[]
  className?: string
}) {
  const axes = [...new Set([...(order ?? []), ...Object.keys(stats)])].filter((a) => stats[a]?.total)
  if (!axes.length) {
    return <p className={cn('text-[13px] text-zinc-500 dark:text-zinc-400', className)}>Aún no hay preguntas respondidas en esta materia.</p>
  }
  return (
    <ul className={cn('space-y-3', className)}>
      {axes.map((axis) => {
        const { correct, total } = stats[axis]
        const pct = total ? correct / total : 0
        return (
          <li key={axis} title={`${axis}: ${correct} de ${total} correctas`}>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="min-w-0 truncate">{axis}</span>
              <span className="shrink-0 font-mono text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
                {correct}/{total}
                <span className="ml-2 inline-block w-10 text-right text-zinc-900 dark:text-zinc-100">{Math.round(pct * 100)} %</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-zinc-900 transition-[width] duration-500 dark:bg-zinc-100"
                style={{ width: `${Math.max(pct * 100, pct > 0 ? 2 : 0)}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
