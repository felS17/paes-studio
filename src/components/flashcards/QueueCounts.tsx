import { cn } from '@/lib/utils'
import type { QueueKind } from '@/utils/flashcardQueue'

const LABELS: Record<QueueKind, string> = { nueva: 'Nuevas', aprendizaje: 'En aprendizaje', repaso: 'Por repasar' }

/** Contadores de la cola estilo Anki: nuevas, en aprendizaje y por repasar. Neutros; la cola activa se resalta. */
export function QueueCounts({ counts, active, size = 'md' }: {
  counts: { nuevas: number; aprendizaje: number; repaso: number }
  active?: QueueKind
  size?: 'sm' | 'md'
}) {
  const items: { kind: QueueKind; value: number }[] = [
    { kind: 'nueva', value: counts.nuevas },
    { kind: 'aprendizaje', value: counts.aprendizaje },
    { kind: 'repaso', value: counts.repaso },
  ]
  return (
    <dl className="flex divide-x divide-zinc-200/80 overflow-hidden rounded-lg border border-zinc-200/80 bg-white dark:divide-zinc-800/80 dark:border-zinc-800/80 dark:bg-[#121215]">
      {items.map(({ kind, value }) => (
        <div
          key={kind}
          className={cn(
            'flex flex-col',
            size === 'sm' ? 'px-2.5 py-1' : 'min-w-[5.5rem] px-3 py-2',
            active === kind && 'bg-zinc-100 dark:bg-zinc-800/70',
          )}
        >
          <dt className="text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">{LABELS[kind]}</dt>
          <dd
            className={cn(
              'order-first font-mono font-semibold tabular-nums',
              size === 'sm' ? 'text-[13px]' : 'text-[18px] leading-tight',
              value === 0 ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-zinc-100',
            )}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
