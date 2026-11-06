import { useState } from 'react'
import { QUOTES, quoteIndexOf } from '@/data/quotes'

/** Cita breve del día. Cambia sola cada día o con un clic; conserva su escritura porque es la de su autor. */
export function DailyQuote() {
  const [index, setIndex] = useState(() => quoteIndexOf(new Date()))
  const quote = QUOTES[index]
  return (
    <div>
      <div aria-live="polite">
        <figure key={index} className="animate-fade-in normal-case">
          <blockquote className="max-w-[52ch] font-serif text-[15px] leading-[1.45] text-pretty text-zinc-900 dark:text-zinc-100">
            {quote.text}
          </blockquote>
          <figcaption className="mt-1 font-serif text-[12.5px] text-zinc-500 italic dark:text-zinc-400">{quote.author}</figcaption>
        </figure>
      </div>
      {/* Fuera del `key`: si se remontara con cada cita, el botón perdería el foco. */}
      <button
        type="button"
        onClick={() => setIndex((i) => (i + 1) % QUOTES.length)}
        className="mt-1 rounded-sm font-mono text-[11.5px] text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        otra cita
      </button>
    </div>
  )
}
