import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CardState, DeckId, Rating } from '@/types/flashcards'
import { schedule, todayKey } from '@/utils/srs'
import { persistStorage } from './storage'

export const NEW_PER_DAY = 20

interface DailyCount {
  day: string
  newSeen: number
  extraNew: number
  reviews: number
}

interface FlashcardState {
  cards: Record<string, CardState>
  daily: Partial<Record<DeckId, DailyCount>>
  review: (deck: DeckId, cardId: string, rating: Rating) => void
  allowMoreNew: (deck: DeckId, amount: number) => void
  resetDeck: (deck: DeckId, cardIds: string[]) => void
}

const fresh = (): DailyCount => ({ day: todayKey(), newSeen: 0, extraNew: 0, reviews: 0 })
export const dailyOf = (d: DailyCount | undefined): DailyCount => (d && d.day === todayKey() ? d : fresh())

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set) => ({
      cards: {},
      daily: {},
      review: (deck, cardId, rating) =>
        set((s) => {
          const prev = s.cards[cardId]
          const day = dailyOf(s.daily[deck])
          return {
            cards: { ...s.cards, [cardId]: schedule(prev, rating) },
            daily: { ...s.daily, [deck]: { ...day, newSeen: day.newSeen + (prev ? 0 : 1), reviews: day.reviews + 1 } },
          }
        }),
      allowMoreNew: (deck, amount) =>
        set((s) => {
          const day = dailyOf(s.daily[deck])
          return { daily: { ...s.daily, [deck]: { ...day, extraNew: day.extraNew + amount } } }
        }),
      resetDeck: (deck, cardIds) =>
        set((s) => {
          const cards = { ...s.cards }
          for (const id of cardIds) delete cards[id]
          const daily = { ...s.daily }
          delete daily[deck]
          return { cards, daily }
        }),
    }),
    { name: 'flashcards', storage: persistStorage, version: 1 },
  ),
)
