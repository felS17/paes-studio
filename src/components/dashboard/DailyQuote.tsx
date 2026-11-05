import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { QUOTES, quoteIndexOf } from '@/data/quotes'

/** Cita del día: es lo primero que se lee al entrar. Cambia sola cada día o con un clic. */
export function DailyQuote() {
  const [index, setIndex] = useState(() => quoteIndexOf(new Date()))
  const quote = QUOTES[index]
  return (
    <div>
      <div aria-live="polite">
        <figure key={index} className="animate-fade-in">
          <blockquote className="max-w-[46ch] font-serif text-[24px] leading-[1.3] tracking-[-0.01em] text-pretty text-zinc-900 sm:text-[30px] dark:text-zinc-100">
            {quote.text}
          </blockquote>
          <figcaption className="mt-3 text-[13px] text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{quote.author}</span>
            <span className="block font-serif italic sm:ml-2 sm:inline">{quote.source}</span>
          </figcaption>
        </figure>
      </div>
      <Button variant="ghost" size="sm" className="mt-2 -ml-2.5" onClick={() => setIndex((i) => (i + 1) % QUOTES.length)}>
        Otra cita
      </Button>
    </div>
  )
}
