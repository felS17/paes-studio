import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { LoadBar } from '@/components/ui/load-bar'
import { DECKS, loadDeck } from '@/data/flashcards'
import { dailyOf, useFlashcardStore } from '@/store/useFlashcardStore'
import type { Deck, DeckId } from '@/types/flashcards'
import { deckSnapshot } from '@/utils/flashcardQueue'

export function FlashcardsPage() {
  const [decks, setDecks] = useState<Partial<Record<DeckId, Deck>>>({})
  const states = useFlashcardStore((s) => s.cards)
  const daily = useFlashcardStore((s) => s.daily)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    let alive = true
    Promise.all(DECKS.map((d) => loadDeck(d.id))).then((list) => {
      if (alive) setDecks(Object.fromEntries(list.map((d) => [d.id, d])))
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="space-y-5">
      <PageHeader title="flashcards" />
      <ul className="divide-y divide-zinc-200/80 border-y border-zinc-200/80 dark:divide-zinc-800/80 dark:border-zinc-800/80">
        {DECKS.map((meta) => {
          const deck = decks[meta.id]
          const snap = deck ? deckSnapshot(deck, states, dailyOf(daily[meta.id]), now) : null
          const total = deck?.cards.length ?? 0
          const seen = snap?.seen ?? 0
          const due = snap ? snap.counts.nuevas + snap.counts.aprendizaje + snap.counts.repaso : 0
          return (
            <li key={meta.id} className="relative flex min-h-11 items-center gap-3 py-1.5 transition-colors hover:bg-zinc-900/[0.02] dark:hover:bg-zinc-100/[0.03]">
              <Link to={`/flashcards/${meta.id}`} className="min-w-0 flex-1 truncate text-[13.5px] after:absolute after:inset-0">{meta.title}</Link>
              <span className="flex shrink-0 items-center gap-2" title="tarjetas estudiadas">
                <LoadBar value={total ? seen / total : 0} className="hidden w-20 sm:flex" />
                <span className="font-mono text-[12px] text-zinc-500 tabular-nums dark:text-zinc-400">{seen}/{total || '–'}</span>
              </span>
              <Button size="sm" variant={due ? 'primary' : 'secondary'} asChild className="relative z-10 w-24">
                <Link to={`/flashcards/${meta.id}`}>{due ? `estudiar ${due}` : 'ver mazo'}</Link>
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
