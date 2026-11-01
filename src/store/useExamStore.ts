import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExamMode, OptionKey, PracticeSet } from '@/types/exam'
import { persistStorage } from './storage'

export interface ExamSession {
  key: string
  examId: string
  mode: ExamMode
  startedAt: number
  updatedAt: number
  answers: Record<string, OptionKey>
  flagged: string[]
  /** Modo práctica: preguntas ya verificadas contra el clavijero. */
  checked: Record<string, true>
  currentIndex: number
  elapsedMs: number
}

export const sessionKey = (examId: string, mode: ExamMode) => `${examId}:${mode}`

interface ExamState {
  sessions: Record<string, ExamSession>
  /** Prácticas personalizadas (por eje o revancha); se conservan para poder revisar sus resultados. */
  sets: Record<string, PracticeSet>
  createSet: (set: Omit<PracticeSet, 'id' | 'createdAt'>) => string
  start: (examId: string, mode: ExamMode) => string
  select: (key: string, questionId: string, option: OptionKey) => void
  clearAnswer: (key: string, questionId: string) => void
  toggleFlag: (key: string, questionId: string) => void
  check: (key: string, questionId: string) => void
  goTo: (key: string, index: number) => void
  addElapsed: (key: string, ms: number) => void
  discard: (key: string) => void
}

function patch(state: ExamState, key: string, fn: (s: ExamSession) => Partial<ExamSession>) {
  const current = state.sessions[key]
  if (!current) return state
  return { sessions: { ...state.sessions, [key]: { ...current, ...fn(current), updatedAt: Date.now() } } }
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      sessions: {},
      sets: {},
      createSet: (practice) => {
        const createdAt = Date.now()
        const id = `set-${practice.kind}-${practice.subject}-${createdAt.toString(36)}`
        set((s) => ({ sets: { ...s.sets, [id]: { ...practice, id, createdAt } } }))
        return id
      },
      start: (examId, mode) => {
        const key = sessionKey(examId, mode)
        if (!get().sessions[key]) {
          const now = Date.now()
          set((s) => ({
            sessions: {
              ...s.sessions,
              [key]: {
                key, examId, mode, startedAt: now, updatedAt: now,
                answers: {}, flagged: [], checked: {}, currentIndex: 0, elapsedMs: 0,
              },
            },
          }))
        }
        return key
      },
      select: (key, questionId, option) =>
        set((s) =>
          patch(s, key, (cur) =>
            cur.checked[questionId] ? {} : { answers: { ...cur.answers, [questionId]: option } },
          ),
        ),
      clearAnswer: (key, questionId) =>
        set((s) =>
          patch(s, key, (cur) => {
            if (cur.checked[questionId]) return {}
            const answers = { ...cur.answers }
            delete answers[questionId]
            return { answers }
          }),
        ),
      toggleFlag: (key, questionId) =>
        set((s) =>
          patch(s, key, (cur) => ({
            flagged: cur.flagged.includes(questionId)
              ? cur.flagged.filter((id) => id !== questionId)
              : [...cur.flagged, questionId],
          })),
        ),
      check: (key, questionId) =>
        set((s) => patch(s, key, (cur) => ({ checked: { ...cur.checked, [questionId]: true } }))),
      goTo: (key, index) => set((s) => patch(s, key, () => ({ currentIndex: Math.max(0, index) }))),
      addElapsed: (key, ms) => set((s) => patch(s, key, (cur) => ({ elapsedMs: cur.elapsedMs + ms }))),
      discard: (key) =>
        set((s) => {
          const sessions = { ...s.sessions }
          delete sessions[key]
          return { sessions }
        }),
    }),
    { name: 'sessions', storage: persistStorage, version: 2, migrate: (state) => ({ sets: {}, ...(state as object) }) as ExamState },
  ),
)
