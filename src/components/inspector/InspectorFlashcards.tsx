import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { QueueCounts } from '@/components/flashcards/QueueCounts'
import { MathText } from '@/components/math/MathText'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { DECKS, loadDeck } from '@/data/flashcards'
import type { CardLink } from '@/data/flashcards/links'
import { dailyOf, useFlashcardStore } from '@/store/useFlashcardStore'
import type { Deck, DeckId, Rating } from '@/types/flashcards'
import { deckSnapshot } from '@/utils/flashcardQueue'
import { plural } from '@/utils/format'
import { previewLabel } from '@/utils/srs'

const RATINGS: { rating: Rating; label: string }[] = [
  { rating: 1, label: 'Otra vez' },
  { rating: 2, label: 'Difícil' },
  { rating: 3, label: 'Bien' },
  { rating: 4, label: 'Fácil' },
]

/** Repaso al vuelo: la misma cola SM-2 de la vista de estudio, limitada a las unidades del tema consultado. */
function CompactStudy({ deckId, units }: { deckId: DeckId; units: string[] }) {
  const [deck, setDeck] = useState<Deck | null>(null)
  const states = useFlashcardStore((s) => s.cards)
  const dailyRaw = useFlashcardStore((s) => s.daily[deckId])
  const review = useFlashcardStore((s) => s.review)
  const [now, setNow] = useState(() => Date.now())
  const [flippedId, setFlippedId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadDeck(deckId).then((d) => alive && setDeck(d))
    return () => {
      alive = false
    }
  }, [deckId])

  // Las tarjetas en aprendizaje vuelven a los 10 minutos: se revisa la cola cada 15 s.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(id)
  }, [])

  const view = useMemo(() => (deck ? { ...deck, cards: deck.cards.filter((c) => units.includes(c.unit)) } : null), [deck, units])
  if (!view) return <p className="text-[13px] text-zinc-500" role="status">Cargando tarjetas…</p>

  const snap = deckSnapshot(view, states, dailyOf(dailyRaw), now)
  const flipped = flippedId ? view.cards.find((c) => c.id === flippedId) : undefined
  const current = flipped ?? snap.next?.card
  const fullDeck = `/flashcards/${deckId}${units.length === 1 ? `?eje=${encodeURIComponent(units[0])}` : ''}`

  const rate = (rating: Rating) => {
    if (!flipped) return
    review(deckId, flipped.id, rating)
    setFlippedId(null)
    setNow(() => Date.now())
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <QueueCounts counts={snap.counts} size="sm" />
        <p className="text-[11.5px] text-zinc-500 tabular-nums dark:text-zinc-400">{plural(view.cards.length, 'tarjeta')} de este tema</p>
      </div>
      {current ? (
        <div className="rounded-lg border border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-[#121215]">
          <div className="px-4 py-4">
            <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400">{current.unit}</p>
            <MathText text={current.front} className="mt-1.5 text-[14px] leading-relaxed font-medium" />
          </div>
          {flipped ? (
            <div className="animate-fade-in border-t border-zinc-200/80 px-4 py-4 dark:border-zinc-800/80">
              <MathText text={flipped.back} className="text-[14px] leading-relaxed text-zinc-700 dark:text-zinc-300" />
              {flipped.points && (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-zinc-600 marker:text-zinc-400 dark:text-zinc-400">
                  {flipped.points.map((p, i) => <li key={i}><MathText text={p} inline /></li>)}
                </ul>
              )}
              <div className="mt-4 grid grid-cols-4 gap-1.5" role="group" aria-label="Califica tu respuesta">
                {RATINGS.map(({ rating, label }) => (
                  <Button key={rating} variant={rating === 3 ? 'primary' : 'secondary'} className="h-auto flex-col gap-0.5 px-1 py-1.5 text-xs" onClick={() => rate(rating)}>
                    {label}
                    <span className="font-mono text-[10.5px] font-normal tabular-nums opacity-70">{previewLabel(states[flipped.id], rating, now)}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="border-t border-zinc-200/80 p-2 dark:border-zinc-800/80">
              <Button variant="primary" className="w-full" onClick={() => setFlippedId(current.id)}>Mostrar respuesta</Button>
            </div>
          )}
        </div>
      ) : (
        <p className="rounded-lg border border-zinc-200/80 px-4 py-6 text-center text-[13px] text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
          No te quedan tarjetas de este tema por hoy.
        </p>
      )}
      <Link to={fullDeck} className="inline-block text-xs text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100">
        Abrir el mazo completo
      </Link>
    </div>
  )
}

export function InspectorFlashcards({ links }: { links: CardLink[] }) {
  const [picked, setPicked] = useState<DeckId | null>(null)
  const current = links.find((l) => l.deck === picked) ?? links[0]
  if (!current) {
    return (
      <p className="px-4 py-6 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        Este tema aún no tiene tarjetas. Hay mazos de Matemática, Ciencias e Historia en{' '}
        <Link to="/flashcards" className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100">Flashcards</Link>.
      </p>
    )
  }
  return (
    <div className="space-y-3 px-4 py-4">
      {links.length > 1 && (
        <Segmented<DeckId>
          label="Mazo"
          size="sm"
          value={current.deck}
          onChange={setPicked}
          options={links.map((l) => ({ value: l.deck, label: DECKS.find((d) => d.id === l.deck)?.mono ?? l.deck, title: DECKS.find((d) => d.id === l.deck)?.title }))}
        />
      )}
      <CompactStudy key={`${current.deck}:${current.units.join('|')}`} deckId={current.deck} units={current.units} />
    </div>
  )
}
