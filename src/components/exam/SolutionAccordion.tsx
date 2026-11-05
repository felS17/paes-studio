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
        Respuesta oficial del DEMRE:
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
        Explicación paso a paso
        <Badge tone={isAI ? 'neutral' : 'solid'} className="ml-1 hidden sm:inline-flex">{isAI ? 'Redactada con IA' : 'Revisada'}</Badge>
        <span className="ml-auto font-mono text-xs text-zinc-500 tabular-nums dark:text-zinc-400">Respuesta {question.answer}</span>
      </button>
      {open && (
        <div id={id} className="animate-fade-in border-t border-zinc-200/80 px-3.5 pt-3 pb-4 text-[14px] leading-relaxed dark:border-zinc-800/80">
          <MathText text={ex.summary} className="text-zinc-700 dark:text-zinc-300" />
          {ex.planteamiento && (
            <section className="mt-4" aria-label="Planteamiento">
              <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Planteamiento</h3>
              <MathText text={ex.planteamiento} className="mt-1 text-zinc-800 dark:text-zinc-200" />
            </section>
          )}
          <section className="mt-4" aria-label="Paso a paso">
            {ex.planteamiento && <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Paso a paso</h3>}
            <ol className="mt-2 space-y-0">
              {ex.steps.map((step, i) => (
                <li
                  key={i}
                  className="relative border-l border-zinc-200 pb-3.5 pl-4 last:border-transparent last:pb-0 dark:border-zinc-800"
                >
                  <span
                    aria-hidden
                    className="absolute top-[7px] -left-[3.5px] size-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600"
                  />
                  <span className="block font-mono text-[11px] leading-5 text-zinc-500 tabular-nums dark:text-zinc-400">
                    Paso {i + 1}
                  </span>
                  <MathText text={step} className="min-w-0" />
                </li>
              ))}
            </ol>
          </section>
          {ex.distractors && Object.keys(ex.distractors).length > 0 && (
            <section className="mt-4 border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-800" aria-label="Análisis de distractores">
              <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {ex.planteamiento ? 'Análisis de distractores' : 'Por qué no las otras'}
              </h3>
              <ul className="mt-2 space-y-2">
                {Object.entries(ex.distractors).map(([key, text]) => (
                  <li key={key} className="flex gap-2.5 text-[13px]">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-50 font-mono text-[11px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400">
                      {key}
                    </span>
                    <MathText text={text ?? ''} className="min-w-0 flex-1 text-zinc-600 dark:text-zinc-400" />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {isAI && (
            <p className="mt-3 text-[11.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Esta explicación la escribió una IA a partir del enunciado, y se comprobó que llega a la respuesta oficial del
              DEMRE. Si algo no te cuadra, confía en la respuesta oficial.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
