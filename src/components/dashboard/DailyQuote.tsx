import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { QUOTES, quoteIndexOf } from '@/data/quotes'

/** Cita del día, dentro del Hero del Inicio. Cambia sola cada día o con un clic. */
export function DailyQuote() {
  const [index, setIndex] = useState(() => quoteIndexOf(new Date()))
  const quote = QUOTES[index]
  return (
    <div className="flex flex-col items-start gap-1">
      <div aria-live="polite" className="w-full">
        <figure key={index} className="animate-fade-in">
          <blockquote className="max-w-[56ch] font-serif text-[17px] leading-[1.5] text-pretty text-zinc-900 dark:text-zinc-100">
            {quote.text}
          </blockquote>
          <figcaption className="mt-2 text-[12.5px] text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{quote.author}</span>
            <span className="ml-2 font-serif italic">{quote.source}</span>
          </figcaption>
        </figure>
      </div>
      {/* Fuera del `key`: si se remontara con cada cita, el botón perdería el foco. */}
      <Button variant="ghost" size="sm" className="-ml-2.5" onClick={() => setIndex((i) => (i + 1) % QUOTES.length)}>
        Otra cita
      </Button>
    </div>
  )
}
