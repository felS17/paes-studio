import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatClock } from '@/utils/format'

/** Reloj del ensayo: cuenta regresiva (modo ensayo) o cronómetro (modo práctica). */
export function ExamTimer({ elapsedMs, remainingMs }: { elapsedMs: number; remainingMs: number | null }) {
  const [hidden, setHidden] = useState(false)
  const value = remainingMs ?? elapsedMs
  const warn = remainingMs !== null && remainingMs <= 5 * 60_000
  const critical = remainingMs !== null && remainingMs <= 60_000
  return (
    <div className="flex items-center gap-1">
      <span
        role="timer"
        aria-live="off"
        aria-label={remainingMs !== null ? 'Tiempo restante' : 'Tiempo transcurrido'}
        className={cn(
          'min-w-[4.5rem] rounded-md px-2 py-1 text-right font-mono text-[15px] font-medium tabular-nums transition-colors',
          critical
            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
            : warn
              ? 'bg-zinc-100 text-zinc-900 ring-1 ring-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-700'
              : 'text-zinc-900 dark:text-zinc-100',
        )}
      >
        {hidden ? '––:––' : formatClock(value)}
      </span>
      <button
        type="button"
        onClick={() => setHidden((h) => !h)}
        className="hidden rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-900 sm:inline-flex dark:hover:text-zinc-100"
        aria-label={hidden ? 'Mostrar reloj' : 'Ocultar reloj'}
        title={hidden ? 'Mostrar reloj' : 'Ocultar reloj'}
      >
        {hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
      </button>
    </div>
  )
}
