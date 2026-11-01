import { Check, X } from 'lucide-react'
import { MathText } from '@/components/math/MathText'
import { cn } from '@/lib/utils'
import type { OptionKey, QuestionOption } from '@/types/exam'

export type OptionState = 'idle' | 'selected' | 'correct' | 'incorrect' | 'muted'

const BASE =
  'group flex w-full items-start gap-3.5 rounded-lg border border-zinc-200/90 bg-white p-3.5 text-left transition-all duration-150 hover:border-zinc-300 hover:bg-zinc-50/70 dark:border-zinc-800 dark:bg-[#121215] dark:hover:border-zinc-700 dark:hover:bg-zinc-900/50'
const KBD =
  'flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-50 font-mono text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400'

const STATE: Record<OptionState, string> = {
  idle: '',
  selected:
    'border-zinc-900 bg-zinc-900/[0.03] ring-1 ring-zinc-900 hover:border-zinc-900 hover:bg-zinc-900/[0.03] dark:border-zinc-100 dark:bg-zinc-100/[0.04] dark:ring-zinc-100 dark:hover:border-zinc-100 dark:hover:bg-zinc-100/[0.04]',
  correct:
    'border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-950 hover:border-emerald-500/40 hover:bg-emerald-500/[0.06] dark:text-emerald-100 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/[0.06]',
  incorrect:
    'border-rose-500/40 bg-rose-500/[0.06] text-rose-950 hover:border-rose-500/40 hover:bg-rose-500/[0.06] dark:text-rose-100 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/[0.06]',
  muted: 'opacity-55 hover:border-zinc-200/90 hover:bg-white dark:hover:border-zinc-800 dark:hover:bg-[#121215]',
}

const KBD_STATE: Record<OptionState, string> = {
  idle: '',
  selected: 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900',
  correct: 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500 dark:text-emerald-950',
  incorrect: 'border-rose-600 bg-rose-600 text-white dark:border-rose-500 dark:bg-rose-500 dark:text-rose-950',
  muted: '',
}

const STATE_LABEL: Partial<Record<OptionState, string>> = {
  selected: 'marcada',
  correct: 'correcta',
  incorrect: 'incorrecta',
}

interface OptionButtonProps {
  option: QuestionOption
  state: OptionState
  locked: boolean
  onSelect: (key: OptionKey) => void
}

/** Alternativa A–E con su tecla. Anatomía definida en CLAUDE.md. */
export function OptionButton({ option, state, locked, onSelect }: OptionButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={state === 'selected' || (state === 'incorrect' && locked)}
      aria-disabled={locked}
      aria-label={`Alternativa ${option.key}${STATE_LABEL[state] ? `, ${STATE_LABEL[state]}` : ''}`}
      onClick={() => !locked && onSelect(option.key)}
      className={cn(BASE, STATE[state], locked && 'cursor-default')}
    >
      <kbd className={cn(KBD, KBD_STATE[state], 'transition-colors duration-150')}>
        {state === 'correct' ? <Check className="size-3.5" strokeWidth={2.5} /> : state === 'incorrect' ? <X className="size-3.5" strokeWidth={2.5} /> : option.key}
      </kbd>
      <span className="min-w-0 flex-1 pt-px text-[14.5px] leading-relaxed">
        {option.text ? <MathText text={option.text} inline /> : <span className="text-zinc-400">Alternativa {option.key}</span>}
      </span>
    </button>
  )
}

/** Variante compacta para preguntas mostradas como recorte del folleto (el texto ya está en la imagen). */
export function AnswerStrip({ options, stateOf, locked, onSelect }: {
  options: QuestionOption[]
  stateOf: (key: OptionKey) => OptionState
  locked: boolean
  onSelect: (key: OptionKey) => void
}) {
  return (
    <div className={cn('grid gap-2', options.length === 5 ? 'grid-cols-5' : 'grid-cols-4')}>
      {options.map((o) => {
        const state = stateOf(o.key)
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={state === 'selected'}
            aria-disabled={locked}
            aria-label={`Alternativa ${o.key}${STATE_LABEL[state] ? `, ${STATE_LABEL[state]}` : ''}`}
            onClick={() => !locked && onSelect(o.key)}
            className={cn(BASE, STATE[state], 'items-center justify-center gap-2.5 py-3', locked && 'cursor-default')}
          >
            <kbd className={cn(KBD, KBD_STATE[state], 'transition-colors duration-150')}>
              {state === 'correct' ? <Check className="size-3.5" strokeWidth={2.5} /> : state === 'incorrect' ? <X className="size-3.5" strokeWidth={2.5} /> : o.key}
            </kbd>
            <span className="hidden text-xs text-zinc-500 sm:inline dark:text-zinc-400">
              {state === 'selected' ? 'Marcada' : state === 'correct' ? 'Correcta' : state === 'incorrect' ? 'Incorrecta' : 'Marcar'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
