import { cn } from '@/lib/utils'

/** Barra de carga por segmentos, como el uso de CPU de un administrador de tareas. `value` va de 0 a 1; `null` la deja vacía. */
export function LoadBar({ value, segments = 10, className }: { value: number | null; segments?: number; className?: string }) {
  const filled = value === null ? 0 : value > 0 ? Math.max(1, Math.round(value * segments)) : 0
  return (
    <span aria-hidden className={cn('flex h-2 gap-px', className)}>
      {Array.from({ length: segments }, (_, i) => (
        <span key={i} className={cn('h-full min-w-0 flex-1', i < filled ? 'bg-progress' : 'bg-zinc-200 dark:bg-zinc-800')} />
      ))}
    </span>
  )
}
