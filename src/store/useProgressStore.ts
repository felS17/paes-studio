import { create } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'
import type { AttemptRecord, QuestionProgress } from '@/types/analytics'
import type { OptionKey } from '@/types/exam'
import { useAnalyticsStore } from './useAnalyticsStore'

/** Clave propia en localStorage: el registro por pregunta vive aparte del resto de la app. */
export const PROGRESS_KEY = 'paes-progress-v1'

/** Aciertos seguidos con los que una pregunta fallada sale del banco de errores. */
export const CLEAR_STREAK = 2

export interface AnswerEvent {
  id: string
  selected: OptionKey
  answer: OptionKey
  axis: string
  topic: string
  at?: number
}

function apply(prev: QuestionProgress | undefined, e: AnswerEvent, now: number): QuestionProgress {
  const at = e.at ?? now
  const base = prev ?? { attempts: 0, correct: 0, streak: 0, lastAt: at }
  if (e.selected === e.answer) {
    const streak = base.streak + 1
    const next: QuestionProgress = { ...base, attempts: base.attempts + 1, correct: base.correct + 1, streak, lastAt: at }
    if (next.miss && streak >= CLEAR_STREAK) delete next.miss
    return next
  }
  return {
    ...base,
    attempts: base.attempts + 1,
    streak: 0,
    lastAt: at,
    miss: { selected: e.selected, answer: e.answer, axis: e.axis, topic: e.topic, at },
  }
}

/** Respuestas de un intento guardado, como eventos; las omitidas no cuentan como intento. */
function eventsOf(attempt: AttemptRecord): AnswerEvent[] {
  return attempt.questions.flatMap((q) =>
    q.selected === null ? [] : [{ id: q.id, selected: q.selected, answer: q.correct, axis: q.axis, topic: q.topic, at: attempt.finishedAt }],
  )
}

function fromAttempts(attempts: AttemptRecord[]): Record<string, QuestionProgress> {
  const out: Record<string, QuestionProgress> = {}
  for (const a of [...attempts].sort((x, y) => x.finishedAt - y.finishedAt)) {
    for (const e of eventsOf(a)) out[e.id] = apply(out[e.id], e, a.finishedAt)
  }
  return out
}

interface ProgressState {
  /** Intentos y aciertos de cada pregunta (id global), en cualquier modo. */
  questions: Record<string, QuestionProgress>
  /** Ya se cargó el historial anterior a este registro. */
  seeded: boolean
  /** Registra respuestas ya corregidas: al verificar en práctica o al entregar un ensayo. */
  record: (events: AnswerEvent[]) => void
  /** Suma las respuestas de intentos recién importados. */
  recordAttempts: (attempts: AttemptRecord[]) => void
  /** Rehace el registro desde los intentos guardados. */
  rebuild: (attempts: AttemptRecord[]) => void
  replace: (questions: Record<string, QuestionProgress>) => void
  clear: () => void
}

const storage: PersistStorage<unknown> = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value))
    } catch (err) {
      console.warn('[paes-studio] No se pudo guardar el registro por pregunta.', err)
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      /* sin almacenamiento disponible */
    }
  },
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      questions: {},
      seeded: false,
      record: (events) => {
        if (!events.length) return
        const now = Date.now()
        set((s) => {
          const questions = { ...s.questions }
          for (const e of events) questions[e.id] = apply(questions[e.id], e, now)
          return { questions }
        })
      },
      recordAttempts: (attempts) =>
        set((s) => {
          const questions = { ...s.questions }
          for (const a of [...attempts].sort((x, y) => x.finishedAt - y.finishedAt)) {
            for (const e of eventsOf(a)) questions[e.id] = apply(questions[e.id], e, a.finishedAt)
          }
          return { questions }
        }),
      rebuild: (attempts) => set({ questions: fromAttempts(attempts), seeded: true }),
      replace: (questions) => set({ questions, seeded: true }),
      clear: () => set({ questions: {}, seeded: true }),
    }),
    { name: PROGRESS_KEY, storage, version: 1 },
  ),
)

// Primera vez con este registro: se arma con los intentos que ya estaban guardados, para no perder el historial.
try {
  if (!useProgressStore.getState().seeded) useProgressStore.getState().rebuild(useAnalyticsStore.getState().attempts)
} catch (err) {
  console.warn('[paes-studio] No se pudo preparar el registro por pregunta.', err)
}
