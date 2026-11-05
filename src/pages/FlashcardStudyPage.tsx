import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { QueueCounts } from '@/components/flashcards/QueueCounts'
import { MathText } from '@/components/math/MathText'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Kbd } from '@/components/ui/kbd'
import { Select } from '@/components/ui/select'
import { isDeckId, loadDeck } from '@/data/flashcards'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { cn } from '@/lib/utils'
import { dailyOf, useFlashcardStore } from '@/store/useFlashcardStore'
import type { Deck, Rating } from '@/types/flashcards'
import { deckSnapshot } from '@/utils/flashcardQueue'
import { previewLabel } from '@/utils/srs'

const RATINGS: { rating: Rating; label: string }[] = [
  { rating: 1, label: 'Otra vez' },
  { rating: 2, label: 'Difícil' },
  { rating: 3, label: 'Bien' },
  { rating: 4, label: 'Fácil' },
]

const FACE =
  'flex min-h-72 flex-col rounded-xl border border-zinc-200/80 bg-surface p-6 [grid-area:1/1] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] sm:min-h-80 sm:p-8 dark:border-zinc-800/80'

function minutesUntil(ts: number, now: number) {
  const m = Math.max(1, Math.round((ts - now) / 60_000))
  return m < 60 ? `${m} min` : `${Math.round(m / 60)} h`
}

export function FlashcardStudyPage() {
  const { deckId } = useParams()
  const [params, setParams] = useSearchParams()
  const unitParam = params.get('eje')
  const [deck, setDeck] = useState<Deck | null>(null)
  const states = useFlashcardStore((s) => s.cards)
  const dailyRaw = useFlashcardStore((s) => (isDeckId(deckId) ? s.daily[deckId] : undefined))
  const review = useFlashcardStore((s) => s.review)
  const allowMoreNew = useFlashcardStore((s) => s.allowMoreNew)
  const [now, setNow] = useState(() => Date.now())
  const [flippedId, setFlippedId] = useState<string | null>(null)

  useEffect(() => {
    if (!isDeckId(deckId)) return
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

  // Filtro por eje temático (unidad del mazo): la cola SM-2 se arma solo con esas tarjetas.
  const unit = deck && unitParam && deck.units.includes(unitParam) ? unitParam : null
  const view = useMemo(() => (deck && unit ? { ...deck, cards: deck.cards.filter((c) => c.unit === unit) } : deck), [deck, unit])
  const snap = view ? deckSnapshot(view, states, dailyOf(dailyRaw), now) : null
  const flippedCard = flippedId ? deck?.cards.find((c) => c.id === flippedId) : undefined
  const current = flippedCard ?? snap?.next?.card
  const kind = flippedCard ? (states[flippedCard.id] ? (states[flippedCard.id].phase === 'review' ? 'repaso' : 'aprendizaje') : 'nueva') : snap?.next?.kind
  const flipped = Boolean(flippedCard)

  const flip = () => current && !flipped && setFlippedId(current.id)
  const rate = (rating: Rating) => {
    if (!deck || !flippedCard) return
    review(deck.id, flippedCard.id, rating)
    setFlippedId(null)
    setNow(() => Date.now())
  }

  useKeyboardShortcuts(
    {
      ' ': flip,
      enter: flip,
      '1': () => flipped && rate(1),
      '2': () => flipped && rate(2),
      '3': () => flipped && rate(3),
      '4': () => flipped && rate(4),
    },
    Boolean(deck),
  )

  if (!isDeckId(deckId)) {
    return (
      <EmptyState title="Este mazo no existe" action={<Button asChild><Link to="/flashcards">Ver mazos</Link></Button>}>
        Los mazos disponibles son Matemática M1 y M2, Competencia Lectora, Biología, Física, Química e Historia.
      </EmptyState>
    )
  }
  if (!deck || !snap) return <p className="text-[13px] text-zinc-500" role="status">Cargando mazo…</p>

  const consolidated = (view ?? deck).cards.filter((c) => states[c.id]?.phase === 'review').length

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to="/flashcards"><ArrowLeft />Mazos</Link>
          </Button>
          <div className="mt-2 min-w-0">
            <h1 className="text-[20px] leading-tight font-semibold tracking-tight">{deck.title}</h1>
            <p className="mt-1 text-xs text-zinc-500 tabular-nums dark:text-zinc-400">
              {snap.seen} de {snap.total} estudiadas, {consolidated} ya en repaso
            </p>
          </div>
        </div>
        <QueueCounts counts={snap.counts} active={current ? kind : undefined} />
      </div>
      <label className="mt-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        Eje temático
        <Select
          value={unit ?? ''}
          onChange={(e) => {
            setFlippedId(null)
            const p = new URLSearchParams(params)
            if (e.target.value) p.set('eje', e.target.value)
            else p.delete('eje')
            setParams(p, { replace: true })
          }}
          className="min-w-48"
        >
          <option value="">Todos los ejes ({deck.cards.length})</option>
          {deck.units.map((u) => (
            <option key={u} value={u}>
              {u} ({deck.cards.filter((c) => c.unit === u).length})
            </option>
          ))}
        </Select>
      </label>
      <div
        className="mt-4 flex h-1.5 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800"
        role="progressbar"
        aria-label="Progreso del mazo"
        aria-valuemin={0}
        aria-valuemax={snap.total}
        aria-valuenow={snap.seen}
      >
        <div className="h-full bg-progress transition-[width] duration-500" style={{ width: `${(consolidated / snap.total) * 100}%` }} />
        <div className="h-full bg-zinc-400 transition-[width] duration-500 dark:bg-zinc-500" style={{ width: `${((snap.seen - consolidated) / snap.total) * 100}%` }} />
      </div>

      {current ? (
        <>
          <div className="mt-8">
            <div className="relative [perspective:1600px]">
              <div
                className={cn(
                  'relative grid [transform-style:preserve-3d] [will-change:transform] motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
                  flipped && '[transform:rotateY(180deg)]',
                )}
              >
                <button
                  type="button"
                  onClick={flip}
                  aria-hidden={flipped}
                  tabIndex={flipped ? -1 : 0}
                  className={cn(
                    FACE,
                    'text-left transition-colors hover:border-zinc-300 dark:hover:border-zinc-700',
                  )}
                  aria-label="Mostrar respuesta"
                >
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{current.unit}</span>
                  <span className="flex flex-1 items-center py-4">
                    <MathText text={current.front} className="w-full text-[19px] leading-snug font-medium tracking-tight sm:text-[21px]" />
                  </span>
                  <span className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                    Piensa la respuesta antes de voltear
                    <Kbd className="ml-auto">Espacio</Kbd>
                  </span>
                </button>
                <div
                  aria-hidden={!flipped}
                  className={cn(FACE, '[transform:rotateY(180deg)]')}
                >
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{current.unit}</span>
                  <MathText text={current.front} className="mt-2 text-[14px] text-zinc-500 dark:text-zinc-400" />
                  <div className="my-4 h-px bg-zinc-200/80 dark:bg-zinc-800/80" />
                  <MathText text={current.back} className="text-[16.5px] leading-relaxed" />
                  {current.points && (
                    <ul className="mt-4 space-y-1.5 text-[13.5px] text-zinc-600 dark:text-zinc-400">
                      {current.points.map((p, i) => (
                        <li key={i} className="flex gap-2">
                          <span aria-hidden className="mt-[0.62em] size-1 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" />
                          <MathText text={p} inline />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8" aria-live="polite">
            {!flipped ? (
              <div className="flex justify-center">
                <Button variant="primary" size="lg" onClick={flip}>
                  Mostrar respuesta
                  <Kbd className="border-white/20 bg-white/10 text-white/80 dark:border-zinc-900/20 dark:bg-zinc-900/10 dark:text-zinc-700">Espacio</Kbd>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {RATINGS.map(({ rating, label }) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => rate(rating)}
                    className="group flex flex-col items-center gap-1 rounded-lg border border-zinc-200/90 bg-surface px-3 py-3 text-zinc-900 transition-colors duration-150 hover:border-zinc-400 hover:bg-zinc-50/70 dark:border-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/50"
                  >
                    <span className="flex items-center gap-2">
                      <Kbd>{rating}</Kbd>
                      <span className="text-[13.5px] font-medium">{label}</span>
                    </span>
                    <span className="font-mono text-[11px] text-zinc-500 tabular-nums dark:text-zinc-400">
                      {previewLabel(states[current.id], rating, now)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mt-8">
          <EmptyState
            title="Terminaste por hoy en este mazo"
            action={
              <div className="flex flex-wrap gap-2">
                {snap.newRemaining > 0 && (
                  <Button variant="primary" onClick={() => allowMoreNew(deck.id, 10)}>
                    Estudiar 10 tarjetas nuevas más
                  </Button>
                )}
                <Button asChild><Link to="/flashcards">Volver a los mazos</Link></Button>
              </div>
            }
          >
            {snap.nextLearningAt
              ? `Tienes tarjetas en aprendizaje que vuelven en ${minutesUntil(snap.nextLearningAt, now)}. Vuelve entonces para fijarlas.`
              : `Estudiaste ${snap.seen} de ${snap.total} tarjetas. Los repasos programados aparecerán aquí el día que correspondan.`}
          </EmptyState>
        </div>
      )}
    </div>
  )
}
