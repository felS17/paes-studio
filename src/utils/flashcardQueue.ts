import { NEW_PER_DAY } from '@/store/useFlashcardStore'
import type { CardState, Deck, Flashcard } from '@/types/flashcards'
import { endOfToday, MINUTE } from './srs'

export type QueueKind = 'nueva' | 'aprendizaje' | 'repaso'

export interface DeckSnapshot {
  counts: { nuevas: number; aprendizaje: number; repaso: number }
  next: { card: Flashcard; kind: QueueKind } | null
  /** Próxima tarjeta en aprendizaje que todavía no vence (para el mensaje de fin de sesión). */
  nextLearningAt: number | null
  newRemaining: number
  seen: number
  total: number
}

const LEARN_AHEAD = 20 * MINUTE

/**
 * Cola de estudio al estilo Anki: primero las tarjetas en aprendizaje que vencieron, luego los repasos del
 * día y al final las nuevas (con límite diario). Si no queda nada, adelanta aprendizajes que vencen en
 * menos de 20 minutos.
 */
export function deckSnapshot(
  deck: Deck,
  states: Record<string, CardState>,
  daily: { newSeen: number; extraNew: number },
  now: number,
): DeckSnapshot {
  const eod = endOfToday(now)
  const learning: { card: Flashcard; due: number }[] = []
  const reviews: { card: Flashcard; due: number }[] = []
  const fresh: Flashcard[] = []
  for (const card of deck.cards) {
    const st = states[card.id]
    if (!st) fresh.push(card)
    else if (st.phase === 'review') {
      if (st.due <= eod) reviews.push({ card, due: st.due })
    } else learning.push({ card, due: st.due })
  }
  learning.sort((a, b) => a.due - b.due)
  reviews.sort((a, b) => a.due - b.due)
  const newLimit = Math.max(0, NEW_PER_DAY + daily.extraNew - daily.newSeen)
  const nuevas = Math.min(newLimit, fresh.length)
  const learningToday = learning.filter((l) => l.due <= eod)

  let next: DeckSnapshot['next'] = null
  const dueLearning = learning.find((l) => l.due <= now)
  if (dueLearning) next = { card: dueLearning.card, kind: 'aprendizaje' }
  else if (reviews.length) next = { card: reviews[0].card, kind: 'repaso' }
  else if (nuevas > 0) next = { card: fresh[0], kind: 'nueva' }
  else if (learning[0] && learning[0].due - now <= LEARN_AHEAD) next = { card: learning[0].card, kind: 'aprendizaje' }

  return {
    counts: { nuevas, aprendizaje: learningToday.length, repaso: reviews.length },
    next,
    nextLearningAt: learning.find((l) => l.due > now)?.due ?? null,
    newRemaining: fresh.length,
    seen: deck.cards.length - fresh.length,
    total: deck.cards.length,
  }
}
