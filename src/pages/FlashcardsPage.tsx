import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { QueueCounts } from '@/components/flashcards/QueueCounts'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { DECKS, loadDeck } from '@/data/flashcards'
import { dailyOf, useFlashcardStore } from '@/store/useFlashcardStore'
import type { Deck, DeckId } from '@/types/flashcards'
import { deckSnapshot } from '@/utils/flashcardQueue'

const KEYS = [
  { key: 'Espacio', text: 'voltear' },
  { key: '1', text: 'otra vez, menos de 10 min' },
  { key: '2', text: 'difícil, 1 día' },
  { key: '3', text: 'bien, 3 días' },
  { key: '4', text: 'fácil, 7 días' },
]

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
    <div className="space-y-8">
      <PageHeader
        title="Flashcards"
        description="Tarjetas inteligentes que te preguntan justo lo que estás a punto de olvidar. Hay de Matemática M1 y M2, Ciencias e Historia, y en cada mazo puedes estudiar un eje a la vez."
      />
      <ul className="grid gap-4 md:grid-cols-2">
        {DECKS.map((meta) => {
          const deck = decks[meta.id]
          const snap = deck ? deckSnapshot(deck, states, dailyOf(daily[meta.id]), now) : null
          const total = deck?.cards.length ?? 0
          const consolidated = deck ? deck.cards.filter((c) => states[c.id]?.phase === 'review').length : 0
          const seen = snap?.seen ?? 0
          const due = snap ? snap.counts.nuevas + snap.counts.aprendizaje + snap.counts.repaso : 0
          return (
            <li
              key={meta.id}
              className="group relative flex flex-col gap-4 rounded-xl border border-zinc-200/80 bg-white p-5 transition-colors duration-150 hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-[#121215] dark:hover:border-zinc-700"
            >
              <div>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-semibold tracking-tight">
                    <Link to={`/flashcards/${meta.id}`} className="after:absolute after:inset-0 after:rounded-xl">
                      {meta.title}
                    </Link>
                  </h2>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">{meta.description}</p>
                </div>
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Tarjetas estudiadas</span>
                  <span className="font-mono tabular-nums">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{seen}</span> / {total || '–'}
                  </span>
                </div>
                <div
                  className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800"
                  role="progressbar"
                  aria-label={`Progreso del mazo ${meta.title}`}
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={seen}
                  aria-valuetext={`${seen} de ${total} estudiadas, ${consolidated} ya en repaso`}
                >
                  <div className="h-full bg-zinc-900 transition-[width] duration-500 dark:bg-zinc-100" style={{ width: total ? `${(consolidated / total) * 100}%` : 0 }} />
                  <div className="h-full bg-zinc-400 transition-[width] duration-500 dark:bg-zinc-500" style={{ width: total ? `${((seen - consolidated) / total) * 100}%` : 0 }} />
                </div>
                <p className="mt-1.5 text-[11.5px] text-zinc-500 dark:text-zinc-400">
                  {consolidated > 0
                    ? <><span className="font-mono tabular-nums">{consolidated}</span> ya las tienes en repaso</>
                    : 'Si marcas una tarjeta con «Bien» o «Fácil», vuelve cuando estés por olvidarla'}
                </p>
              </div>

              <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
                {snap ? <QueueCounts counts={snap.counts} size="sm" /> : <span className="h-7" />}
                <Button variant={due ? 'primary' : 'secondary'} asChild className="relative z-10 shrink-0">
                  <Link to={`/flashcards/${meta.id}`}>{due ? 'Estudiar' : 'Ver mazo'}</Link>
                </Button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="rounded-xl border border-zinc-200/80 bg-white px-4 py-3 dark:border-zinc-800/80 dark:bg-[#121215]">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Atajos de teclado en el estudio</p>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px]">
          {KEYS.map((k) => (
            <li key={k.key} className="flex items-center gap-1.5">
              <Kbd>{k.key}</Kbd>
              <span className="text-zinc-600 dark:text-zinc-400">{k.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="max-w-2xl text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        Estos plazos son para la primera vez que ves una tarjeta. Después, mientras mejor te la sepas, más tarda en volver. Tu
        progreso se guarda automáticamente aquí mismo.
      </p>
    </div>
  )
}
