import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { persistStorage } from './storage'

/** Actividad de estudio de un día (clave local `YYYY-MM-DD`). */
export interface StudyDay {
  /** Completó el Desafío Diario de ese día (las 3 preguntas respondidas). */
  challenge?: boolean
  /** Tarjetas de flashcards calificadas ese día. */
  flashcards?: number
}

interface StreakState {
  days: Record<string, StudyDay>
  markChallenge: (dateKey: string) => void
  markFlashcard: (dateKey: string) => void
}

/** Días en que completaste el Desafío Diario o repasaste flashcards: base de la racha de estudio. */
export const useStreakStore = create<StreakState>()(
  persist(
    (set) => ({
      days: {},
      markChallenge: (dateKey) =>
        set((s) => ({ days: { ...s.days, [dateKey]: { ...s.days[dateKey], challenge: true } } })),
      markFlashcard: (dateKey) =>
        set((s) => ({
          days: { ...s.days, [dateKey]: { ...s.days[dateKey], flashcards: (s.days[dateKey]?.flashcards ?? 0) + 1 } },
        })),
    }),
    { name: 'streak', storage: persistStorage, version: 1 },
  ),
)
