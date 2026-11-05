import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { QuestionResult } from '@/types/analytics'
import { formatClock, plural } from '@/utils/format'
import { FLUENT_MS, LEAK_MS, readTelemetry } from '@/utils/telemetry'

function describe(q: QuestionResult): string {
  const t = readTelemetry(q)
  const result = q.selected === null ? 'sin responder' : q.isCorrect ? 'correcta' : `incorrecta (marcaste ${q.selected}, la correcta es ${q.correct})`
  const parts = [`Pregunta ${q.number}`, t ? formatClock(t.timeSpentMs) : 'sin medición', result]
  if (t?.selectionChanges) parts.push(plural(t.selectionChanges, 'cambio'))
  if (t?.discardedCount) parts.push(plural(t.discardedCount, 'descartada'))
  return parts.join(', ')
}

const THRESHOLDS = [
  { ms: FLUENT_MS, label: '1:30' },
  { ms: LEAK_MS, label: '2:30' },
]

/**
 * Tira de cadencia: una barra por pregunta en el orden de la prueba, con su altura en tiempo. Muestra de un vistazo
 * dónde se atascó el ritmo. Los valores extremos se recortan al percentil 95 (el dato exacto aparece al pasar).
 */
export function CadenceStrip({ questions, onPick }: { questions: QuestionResult[]; onPick?: (questionId: string) => void }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [hovered, setHovered] = useState<QuestionResult | null>(null)
  const group = useRef<HTMLDivElement>(null)
  const times = questions.map((q) => readTelemetry(q)?.timeSpentMs ?? 0)
  const sorted = [...times].sort((a, b) => a - b)
  const p95 = sorted[Math.floor((sorted.length - 1) * 0.95)] ?? 0
  const scale = Math.max(LEAK_MS * 1.15, p95 * 1.05)

  const move = (e: React.KeyboardEvent, index: number) => {
    const next = e.key === 'ArrowRight' ? index + 1 : e.key === 'ArrowLeft' ? index - 1 : -1
    if (next < 0 || next >= questions.length) return
    e.preventDefault()
    setActiveIndex(next)
    setHovered(questions[next])
    group.current?.querySelectorAll('button')[next]?.focus()
  }

  return (
    <div>
      <p className="h-5 truncate text-xs text-zinc-500 dark:text-zinc-400">
        {hovered ? describe(hovered) : 'Tu ritmo pregunta a pregunta. Pasa el cursor por una barra para ver el detalle.'}
      </p>
      <div className="relative mt-2 pr-9">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 bottom-2">
          {THRESHOLDS.map(({ ms, label }) => (
            <div key={ms} className="absolute inset-x-0 border-t border-dashed border-zinc-300 dark:border-zinc-700" style={{ bottom: `${(ms / scale) * 100}%` }}>
              <span className="absolute right-0 -translate-y-1/2 bg-surface pl-1 font-mono text-[10.5px] text-zinc-500 tabular-nums dark:text-zinc-400">{label}</span>
            </div>
          ))}
        </div>
        <div ref={group} role="group" aria-label="Tiempo por pregunta, en el orden de la prueba" className="relative flex h-28 gap-px sm:gap-0.5" onMouseLeave={() => setHovered(null)}>
          {questions.map((q, i) => {
            const t = readTelemetry(q)
            const ms = times[i]
            return (
              <button
                key={q.id}
                type="button"
                tabIndex={i === activeIndex ? 0 : -1}
                aria-label={describe(q)}
                onMouseEnter={() => setHovered(q)}
                onFocus={() => {
                  setActiveIndex(i)
                  setHovered(q)
                }}
                onKeyDown={(e) => move(e, i)}
                onClick={() => onPick?.(q.id)}
                className="flex h-full max-w-5 min-w-0 flex-1 flex-col rounded-[2px] transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
              >
                <span className="flex min-h-0 w-full flex-1 flex-col justify-end">
                  <span
                    className={cn(
                      'block min-h-0.5 w-full rounded-t-[2px]',
                      q.selected === null || !t ? 'bg-zinc-300 dark:bg-zinc-700' : q.isCorrect ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-rose-500 dark:bg-rose-400',
                    )}
                    style={{ height: `${Math.min(100, (ms / scale) * 100)}%` }}
                  />
                </span>
                {/* Carril inferior: marca las preguntas donde cambió de alternativa. */}
                <span className={cn('mt-1 block h-1 w-full rounded-[1px]', t?.selectionChanges ? 'bg-amber-500 dark:bg-amber-400' : 'bg-transparent')} />
              </button>
            )
          })}
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-zinc-500 dark:text-zinc-400" aria-label="Leyenda">
        <li className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-[2px] bg-zinc-900 dark:bg-zinc-100" />Correcta</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-[2px] bg-rose-500 dark:bg-rose-400" />Incorrecta</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-[2px] bg-zinc-300 dark:bg-zinc-700" />Sin responder</li>
        <li className="flex items-center gap-1.5"><span aria-hidden className="h-1 w-3 rounded-[1px] bg-amber-500 dark:bg-amber-400" />Cambió de alternativa</li>
      </ul>
    </div>
  )
}
