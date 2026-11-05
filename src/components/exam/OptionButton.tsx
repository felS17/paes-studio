import { Check, Strikethrough, Undo2, X } from 'lucide-react'
import { MathText } from '@/components/math/MathText'
import { cn } from '@/lib/utils'
import type { OptionKey, QuestionOption } from '@/types/exam'

export type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'muted'

const BASE =
  'group flex w-full items-start gap-3.5 rounded-lg border border-zinc-200/90 bg-surface p-3.5 text-left transition-all duration-150 hover:border-zinc-300 hover:bg-zinc-50/70 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/50'
const KBD =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-50 font-mono text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400'

const STATE: Record<OptionState, string> = {
  idle: '',
  selected:
    'border-accent bg-accent/[0.04] ring-1 ring-accent hover:border-accent hover:bg-accent/[0.04]',
  correct:
    'border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-950 hover:border-emerald-500/40 hover:bg-emerald-500/[0.06] dark:text-emerald-100 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/[0.06]',
  incorrect:
    'border-rose-500/40 bg-rose-500/[0.06] text-rose-950 hover:border-rose-500/40 hover:bg-rose-500/[0.06] dark:text-rose-100 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/[0.06]',
  muted: 'opacity-55 hover:border-zinc-200/90 hover:bg-surface dark:hover:border-zinc-800',
}

const KBD_STATE: Record<OptionState, string> = {
  idle: '',
  selected: 'border-accent bg-accent text-white dark:text-zinc-900',
  correct: 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-emerald-950',
  incorrect: 'border-rose-600 bg-rose-600 text-white dark:border-rose-500 dark:bg-rose-500 dark:text-rose-950',
  muted: '',
}

const STATE_LABEL: Partial<Record<OptionState, string>> = {
  selected: 'marcada',
  correct: 'correcta',
  incorrect: 'incorrecta',
}

/** Alternativa tachada (descartada), como con lápiz en el folleto. */
const STRUCK = 'line-through decoration-zinc-500 opacity-35 hover:opacity-60 dark:decoration-zinc-400'

const label = (key: OptionKey, state: OptionState, struck: boolean) =>
  `Alternativa ${key}${struck ? ', descartada' : STATE_LABEL[state] ? `, ${STATE_LABEL[state]}` : ''}`

/**
 * Botón discreto para tachar o recuperar una alternativa: aparece al pasar el mouse o con el foco y queda
 * siempre visible en pantallas táctiles (donde no hay clic derecho ni teclado).
 */
function StrikeToggle({ optionKey, struck, onToggle, className }: {
  optionKey: OptionKey
  struck: boolean
  onToggle: (key: OptionKey) => void
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={struck}
      aria-label={struck ? `Recuperar la alternativa ${optionKey}` : `Descartar la alternativa ${optionKey}`}
      title={struck ? `Recuperar ${optionKey} (Shift + ${optionKey})` : `Descartar ${optionKey} (clic derecho o Shift + ${optionKey})`}
      onClick={() => onToggle(optionKey)}
      className={cn(
        'flex items-center justify-center rounded-md text-zinc-400 opacity-0 transition-[opacity,color,background-color] duration-150 hover:bg-zinc-900/[0.05] hover:text-zinc-900 focus-visible:opacity-100 group-hover/opt:opacity-100 pointer-coarse:opacity-100 dark:text-zinc-500 dark:hover:bg-zinc-100/[0.06] dark:hover:text-zinc-100',
        struck && 'text-zinc-700 opacity-100 dark:text-zinc-300',
        className,
      )}
    >
      {struck ? <Undo2 className="size-3.5" /> : <Strikethrough className="size-3.5" />}
    </button>
  )
}

interface OptionButtonProps {
  option: QuestionOption
  state: OptionState
  locked: boolean
  onSelect: (key: OptionKey) => void
  /** Alternativa descartada por el estudiante (no aplica una vez corregida). */
  struck?: boolean
  /** Si existe, se puede tachar con clic derecho o con el botón del extremo derecho. */
  onToggleStrike?: (key: OptionKey) => void
}

/** Alternativa A–E con su tecla. Anatomía definida en CLAUDE.md. */
export function OptionButton({ option, state, locked, onSelect, struck = false, onToggleStrike }: OptionButtonProps) {
  const canStrike = Boolean(onToggleStrike) && !locked
  return (
    <div className="group/opt relative">
      <button
        type="button"
        role="radio"
        aria-checked={state === 'selected' || (state === 'incorrect' && locked)}
        aria-disabled={locked}
        aria-label={label(option.key, state, struck && canStrike)}
        onClick={() => !locked && onSelect(option.key)}
        onContextMenu={
          canStrike
            ? (e) => {
                e.preventDefault()
                onToggleStrike?.(option.key)
              }
            : undefined
        }
        className={cn(BASE, STATE[state], locked && 'cursor-default', canStrike && 'pr-12', struck && canStrike && STRUCK)}
      >
        <kbd className={cn(KBD, KBD_STATE[state], 'transition-colors duration-150')}>
          {state === 'correct' ? <Check className="size-3.5" strokeWidth={2.5} /> : state === 'incorrect' ? <X className="size-3.5" strokeWidth={2.5} /> : option.key}
        </kbd>
        <span className="min-w-0 flex-1 pt-px text-[14.5px] leading-relaxed">
          {option.text ? <MathText text={option.text} inline /> : <span className="text-zinc-400">Alternativa {option.key}</span>}
        </span>
      </button>
      {canStrike && onToggleStrike && (
        <StrikeToggle
          optionKey={option.key}
          struck={struck}
          onToggle={onToggleStrike}
          className="absolute top-2.5 right-2.5 size-8"
        />
      )}
    </div>
  )
}

/** Variante compacta para preguntas mostradas como recorte del folleto (el texto ya está en la imagen). */
export function AnswerStrip({ options, stateOf, locked, onSelect, struck = [], onToggleStrike }: {
  options: QuestionOption[]
  stateOf: (key: OptionKey) => OptionState
  locked: boolean
  onSelect: (key: OptionKey) => void
  struck?: OptionKey[]
  onToggleStrike?: (key: OptionKey) => void
}) {
  const canStrike = Boolean(onToggleStrike) && !locked
  return (
    <div className={cn('grid gap-2', options.length === 5 ? 'grid-cols-5' : 'grid-cols-4')}>
      {options.map((o) => {
        const state = stateOf(o.key)
        const isStruck = canStrike && struck.includes(o.key)
        return (
          <div key={o.key} className="group/opt relative">
            <button
              type="button"
              role="radio"
              aria-checked={state === 'selected'}
              aria-disabled={locked}
              aria-label={label(o.key, state, isStruck)}
              onClick={() => !locked && onSelect(o.key)}
              onContextMenu={
                canStrike
                  ? (e) => {
                      e.preventDefault()
                      onToggleStrike?.(o.key)
                    }
                  : undefined
              }
              className={cn(
                BASE,
                STATE[state],
                'items-center justify-center gap-2.5 py-3',
                locked && 'cursor-default',
                canStrike && 'sm:px-8',
                isStruck && STRUCK,
              )}
            >
              <kbd className={cn(KBD, KBD_STATE[state], 'transition-colors duration-150')}>
                {state === 'correct' ? <Check className="size-3.5" strokeWidth={2.5} /> : state === 'incorrect' ? <X className="size-3.5" strokeWidth={2.5} /> : o.key}
              </kbd>
              <span className="hidden text-xs text-zinc-500 sm:inline dark:text-zinc-400">
                {isStruck ? 'Descartada' : state === 'selected' ? 'Marcada' : state === 'correct' ? 'Correcta' : state === 'incorrect' ? 'Incorrecta' : 'Marcar'}
              </span>
            </button>
            {canStrike && onToggleStrike && (
              <StrikeToggle
                optionKey={o.key}
                struck={isStruck}
                onToggle={onToggleStrike}
                className="absolute top-1 right-1 size-7"
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
