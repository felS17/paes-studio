import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { persistStorage } from './storage'

/** Actividad de estudio de un día (clave local `YYYY-MM-DD`). */
export interface StudyDay {
  /** Completó el Desafío Diario de ese día (las 3 preguntas respondidas). */
  challenge?: boolean
  /** Tarjetas de flashcards calificadas ese día. */
  flashcards?: number
  /** Respondió al menos una pregunta ese día, en cualquier ensayo o práctica, aunque no la haya terminado. */
  practice?: boolean
}

interface StreakState {
  days: Record<string, StudyDay>
  markChallenge: (dateKey: string) => void
  markFlashcard: (dateKey: string) => void
  markPractice: (dateKey: string) => void
}

/** Días en que estudiaste: base de la racha. Para leerla usa `useStreak`, que también cuenta los intentos guardados. */
export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      days: {},
      markChallenge: (dateKey) =>
        set((s) => ({ days: { ...s.days, [dateKey]: { ...s.days[dateKey], challenge: true } } })),
      markFlashcard: (dateKey) =>
        set((s) => ({
          days: { ...s.days, [dateKey]: { ...s.days[dateKey], flashcards: (s.days[dateKey]?.flashcards ?? 0) + 1 } },
        })),
      markPractice: (dateKey) => {
        // Se llama con cada respuesta: basta la primera del día, sin volver a guardar.
        if (get().days[dateKey]?.practice) return
        set((s) => ({ days: { ...s.days, [dateKey]: { ...s.days[dateKey], practice: true } } }))
      },
    }),
    { name: 'streak', storage: persistStorage, version: 1 },
  ),
)
