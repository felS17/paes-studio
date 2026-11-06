import { useState } from 'react'
import { Flag } from 'lucide-react'
import { TheoryButton } from '@/components/inspector/TheoryButton'
import { MathText } from '@/components/math/MathText'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Tag } from '@/components/ui/subject-tag'
import { cn } from '@/lib/utils'
import type { OptionKey, Question, SubjectId } from '@/types/exam'
import { AnswerStrip, OptionButton, type OptionState } from './OptionButton'
import { SolutionAccordion } from './SolutionAccordion'

export type CardMode = 'practica' | 'ensayo' | 'revision'

interface QuestionCardProps {
  question: Question
  mode: CardMode
  position: number
  total: number
  selected: OptionKey | undefined
  /** Práctica: ya verificada. Revisión: siempre true. */
  revealed: boolean
  flagged: boolean
  onSelect?: (key: OptionKey) => void
  onCheck?: () => void
  onToggleFlag?: () => void
  showHints?: boolean
  /** Alternativas tachadas por el estudiante. */
  struck?: OptionKey[]
  onToggleStrike?: (key: OptionKey) => void
  /** Muestra «Consultar teoría del subtema» (no en Modo Ensayo: el Inspector está bloqueado hasta entregar). */
  theory?: boolean
  subject?: SubjectId
}

export function QuestionCard({
  question, mode, position, total, selected, revealed, flagged, onSelect, onCheck, onToggleFlag, showHints,
  struck = [], onToggleStrike, theory, subject,
}: QuestionCardProps) {
  const locked = revealed || mode === 'revision'
  const stateOf = (key: OptionKey): OptionState => {
    if (revealed) {
      if (key === question.answer) return 'correct'
      if (key === selected) return 'incorrect'
      return 'muted'
    }
    return key === selected ? 'selected' : 'idle'
  }
  const isCorrect = selected === question.answer
  // Solo confirma al verificar aquí mismo: volver a una pregunta ya verificada no repite la animación.
  const [alreadyRevealed] = useState(revealed)
  const confirming = mode === 'practica' && revealed && isCorrect && !alreadyRevealed
  const snapshot = question.presentation === 'snapshot' && question.snapshot

  return (
    <article className="relative mx-auto w-full max-w-[740px] normal-case" aria-labelledby={`q-${question.id}`}>
      {confirming && (
        <span aria-hidden className="pointer-events-none absolute -inset-3 animate-confirm rounded-xl border border-emerald-500/60 ring-2 ring-emerald-500/15" />
      )}
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 id={`q-${question.id}`} className="flex items-baseline gap-2 text-[13px] font-medium text-zinc-500 dark:text-zinc-400">
          <span className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">
            Pregunta <span className="font-mono tabular-nums">{question.number}</span>
          </span>
          <span className="tabular-nums">
            {position} de {total}
          </span>
        </h2>
        {mode !== 'ensayo' && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag>{question.axis}</Tag>
            {question.topic && question.topic !== question.axis && <Badge tone="outline">{question.topic}</Badge>}
            {question.pilot && mode === 'revision' && <Badge tone="outline">Piloto, no puntúa</Badge>}
          </div>
        )}
        {(onToggleFlag || (theory && mode !== 'ensayo')) && (
          <div className="ml-auto flex flex-wrap items-center gap-1">
            {theory && mode !== 'ensayo' && <TheoryButton question={question} fallbackSubject={subject} />}
            {onToggleFlag && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(flagged && 'text-zinc-900 dark:text-zinc-100')}
                aria-pressed={flagged}
                onClick={onToggleFlag}
              >
                <Flag className={cn('size-3.5', flagged && 'fill-current')} />
                {flagged ? 'Con duda' : 'Marcar duda'}
                {showHints && <Kbd className="ml-0.5">F</Kbd>}
              </Button>
            )}
          </div>
        )}
      </header>

      <div className="mt-4">
        {snapshot ? (
          <figure className="overflow-hidden rounded-lg border border-zinc-200/80 bg-surface p-3 dark:border-zinc-800/80">
            <img
              src={snapshot.src}
              width={snapshot.width}
              height={snapshot.height}
              alt={`Pregunta ${question.number} del folleto oficial. ${question.stem.replace(/[*$\\]/g, '').slice(0, 400)}`}
              className={cn('mx-auto h-auto w-full', snapshot.mono && 'snapshot-mono')}
              style={{ maxWidth: `${Math.round(snapshot.width / 1.25)}px` }}
              decoding="async"
            />
            <figcaption className="sr-only">Imagen de la prueba oficial del DEMRE</figcaption>
          </figure>
        ) : (
          <MathText text={question.stem} className="text-[15.5px] leading-[1.7] text-zinc-900 dark:text-zinc-100" />
        )}
      </div>

      <div className="mt-5" role="radiogroup" aria-label="Alternativas">
        {snapshot ? (
          <AnswerStrip
            options={question.options}
            stateOf={stateOf}
            locked={locked}
            onSelect={(k) => onSelect?.(k)}
            struck={struck}
            onToggleStrike={onToggleStrike}
          />
        ) : (
          <div className="space-y-2">
            {question.options.map((o) => (
              <OptionButton
                key={o.key}
                option={o}
                state={stateOf(o.key)}
                locked={locked}
                onSelect={(k) => onSelect?.(k)}
                struck={struck.includes(o.key)}
                onToggleStrike={onToggleStrike}
              />
            ))}
          </div>
        )}
      </div>

      {mode === 'practica' && !revealed && (
        <div className="mt-4 flex items-center gap-3">
          <Button variant="primary" onClick={onCheck} disabled={!selected} data-shortcut-passthrough="1">
            Verificar respuesta
            {showHints && <Kbd className="border-white/20 bg-white/10 text-white/80 dark:border-zinc-900/20 dark:bg-zinc-900/10 dark:text-zinc-700">Enter</Kbd>}
          </Button>
          {!selected && <p className="text-xs text-zinc-500 dark:text-zinc-400">Elige una alternativa para verificarla.</p>}
        </div>
      )}

      {revealed && (
        <div className="mt-5 space-y-3 animate-fade-in">
          {mode !== 'revision' || selected ? (
            <p
              role="status"
              className={cn(
                'text-[13px] font-medium',
                isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400',
              )}
            >
              {isCorrect ? 'Correcta.' : selected ? `Esta no era. Marcaste la ${selected}; la correcta es la ${question.answer}.` : `Sin responder. La correcta es la ${question.answer}.`}
            </p>
          ) : (
            <p className="text-[13px] font-medium text-zinc-500">Sin responder. La correcta es la {question.answer}.</p>
          )}
          <SolutionAccordion key={question.id} question={question} defaultOpen={!isCorrect} />
        </div>
      )}
    </article>
  )
}
