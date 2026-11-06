import { QUOTES } from '@/data/quotes'

/** Cita breve del día; conserva su escritura porque es la de su autor. La ventana del Inicio decide cuál mostrar. */
export function DailyQuote({ index, onNext }: { index: number; onNext: () => void }) {
  const quote = QUOTES[index]
  return (
    <div>
      <div aria-live="polite">
        <figure key={index} className="animate-fade-in normal-case">
          <blockquote className="max-w-[52ch] font-serif text-[17px] leading-[1.45] text-pretty text-zinc-900 dark:text-zinc-100">
            {quote.text}
          </blockquote>
          <figcaption className="mt-1.5 font-serif text-[13px] text-zinc-500 italic dark:text-zinc-400">{quote.author}</figcaption>
        </figure>
      </div>
      {/* Fuera del `key`: si se remontara con cada cita, el botón perdería el foco. */}
      <button
        type="button"
        onClick={onNext}
        className="mt-1.5 rounded-sm font-mono text-[12px] text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        otra cita
      </button>
    </div>
  )
}
