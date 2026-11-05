import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { QUOTES, quoteIndexOf } from '@/data/quotes'

/** Frase de impulso: es lo primero que se lee al entrar. Cambia sola cada día o con un clic. */
export function DailyQuote() {
  const [index, setIndex] = useState(() => quoteIndexOf(new Date()))
  return (
    <figure>
      <div aria-live="polite">
        <blockquote key={index} className="max-w-[46ch] animate-fade-in font-serif text-[24px] leading-[1.3] tracking-[-0.01em] text-pretty text-zinc-900 sm:text-[30px] dark:text-zinc-100">
          {QUOTES[index]}
        </blockquote>
      </div>
      <figcaption className="mt-2">
        <Button variant="ghost" size="sm" className="-ml-2.5" onClick={() => setIndex((i) => (i + 1) % QUOTES.length)}>
          Otra frase
        </Button>
      </figcaption>
    </figure>
  )
}
