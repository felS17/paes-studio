import { useId, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { MathText } from '@/components/math/MathText'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Question } from '@/types/exam'

/**
 * «Solución del ejercicio»: desarrollo específico de la pregunta (curado o redactado con IA y validado
 * contra la clave oficial). Si la pregunta no tiene solución, se muestra solo la clave del clavijero.
 */
export function SolutionAccordion({ question, defaultOpen = false }: { question: Question; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  const ex = question.explanation

  if (!ex) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-zinc-200/80 bg-white px-3.5 py-2.5 text-[13px] text-zinc-600 dark:border-zinc-800/80 dark:bg-[#121215] dark:text-zinc-400">
        Clave oficial del clavijero DEMRE:
        <span className="font-mono text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{question.answer}</span>
      </p>
    )
  }

  const isAI = ex.kind === 'solucion'
  return (
    <section className="rounded-lg border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-[#121215]">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-[13px] font-medium"
      >
        <ChevronRight className={cn('size-4 text-zinc-400 transition-transform duration-150', open && 'rotate-90')} />
        Solución del ejercicio
        <Badge tone={isAI ? 'neutral' : 'solid'} className="ml-1 hidden sm:inline-flex">{isAI ? 'Redactada con IA' : 'Revisada'}</Badge>
        <span className="ml-auto font-mono text-xs text-zinc-500 tabular-nums dark:text-zinc-400">Clave {question.answer}</span>
      </button>
      {open && (
        <div id={id} className="animate-fade-in border-t border-zinc-200/80 px-3.5 pt-3 pb-4 text-[14px] leading-relaxed dark:border-zinc-800/80">
          <MathText text={ex.summary} className="text-zinc-700 dark:text-zinc-300" />
          <ol className="mt-4 space-y-3">
            {ex.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-zinc-300 font-mono text-[10px] font-medium text-zinc-500 tabular-nums dark:border-zinc-700 dark:text-zinc-400">
                  {i + 1}
                </span>
                <MathText text={step} className="min-w-0 flex-1" />
              </li>
            ))}
          </ol>
          {ex.distractors && Object.keys(ex.distractors).length > 0 && (
            <div className="mt-4 border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-800">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Por qué no las otras</p>
              <ul className="mt-2 space-y-1.5">
                {Object.entries(ex.distractors).map(([key, text]) => (
                  <li key={key} className="flex gap-2.5 text-[13px]">
                    <span className="font-mono text-xs leading-6 text-zinc-500">{key})</span>
                    <MathText text={text ?? ''} className="min-w-0 flex-1 text-zinc-600 dark:text-zinc-400" />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {isAI && (
            <p className="mt-3 text-[11.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Solución redactada con IA a partir del enunciado y la imagen oficial, y validada para que concluya en la clave del
              clavijero DEMRE. Si detectas un error, la clave oficial es la referencia.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
