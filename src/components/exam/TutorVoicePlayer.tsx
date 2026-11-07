import { cn } from '@/lib/utils'
import type { TutorStatus } from '@/hooks/useTutorVoice'
import type { TutorRate } from '@/types/user'

const RATES: TutorRate[] = [1, 1.25, 1.5]

const BUTTON = 'rounded-sm px-0.5 text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400'

function toggleLabel(status: TutorStatus, buffering: boolean) {
  if (status === 'playing') return buffering ? '[ ⋯ cargando ]' : '[ ❚❚ pausa ]'
  return status === 'paused' ? '[ ▸ seguir ]' : '[ ▸ escuchar ]'
}

/** Controles del tutor de voz en la cabecera de la explicación, con el mismo aire de terminal del prompt del Inicio. */
export function TutorVoicePlayer({ status, rate, buffering, error, onToggle, onRate }: {
  status: TutorStatus
  rate: TutorRate
  buffering: boolean
  error: boolean
  onToggle: () => void
  onRate: (rate: TutorRate) => void
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] whitespace-nowrap" role="group" aria-label="Tutor de voz">
      <button type="button" onClick={onToggle} className={cn(BUTTON, status === 'playing' && 'text-accent dark:text-accent')}>
        {toggleLabel(status, buffering)}
      </button>
      <span role="radiogroup" aria-label="Velocidad de la voz" className="flex items-center">
        <span aria-hidden className="text-zinc-400 dark:text-zinc-600">[</span>
        {RATES.map((value, i) => (
          <span key={value} className="flex items-center">
            {i > 0 && <span aria-hidden className="text-zinc-400 dark:text-zinc-600">·</span>}
            <button
              type="button"
              role="radio"
              aria-checked={rate === value}
              onClick={() => onRate(value)}
              className={cn(BUTTON, 'px-1 tabular-nums', rate === value && 'text-zinc-900 dark:text-zinc-100')}
            >
              {value}x
            </button>
          </span>
        ))}
        <span aria-hidden className="text-zinc-400 dark:text-zinc-600">]</span>
      </span>
      <span role="status" className="whitespace-normal text-zinc-500 dark:text-zinc-400">
        {error && 'sin voz disponible: revisa tu internet y prueba otra vez'}
      </span>
    </div>
  )
}
