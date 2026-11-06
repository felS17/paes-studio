import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { QuestionTrace } from '@/types/analytics'
import type { ExamMode, OptionKey, PracticeSet } from '@/types/exam'
import { localDateKey } from '@/utils/dateKey'
import { persistStorage } from './storage'
import { useStreakStore } from './useStreakStore'

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
  /** Alternativas tachadas (descartadas) por pregunta, como con lápiz en el folleto. */
  struck?: Record<string, OptionKey[]>
  currentIndex: number
  elapsedMs: number
  /** Telemetría silenciosa por pregunta; ausente en sesiones iniciadas antes de la v2.1. */
  telemetry?: Record<string, QuestionTrace>
  /** Aciertos seguidos al verificar en Modo Práctica. */
  correctRun?: number
  /** Día en que se respondió cada pregunta por primera vez: el mapa de actividad y la racha cuentan cada una ese día. */
  answeredOn?: Record<string, string>
}

export const sessionKey = (examId: string, mode: ExamMode) => `${examId}:${mode}`

interface ExamState {
  sessions: Record<string, ExamSession>
  /** Prácticas personalizadas (por eje o revancha); se conservan para poder revisar sus resultados. */
  sets: Record<string, PracticeSet>
  createSet: (set: Omit<PracticeSet, 'id' | 'createdAt'>) => string
  /** Guarda una práctica con id fijo (Desafío Diario) si aún no existe. */
  ensureSet: (id: string, set: Omit<PracticeSet, 'id' | 'createdAt'>) => void
  start: (examId: string, mode: ExamMode) => string
  select: (key: string, questionId: string, option: OptionKey) => void
  clearAnswer: (key: string, questionId: string) => void
  toggleFlag: (key: string, questionId: string) => void
  /** Tacha o recupera una alternativa; tachar la marcada también la desmarca. */
  toggleStrike: (key: string, questionId: string, option: OptionKey) => void
  /** Verifica una respuesta en Modo Práctica; `correct` alimenta la racha de aciertos de la sesión. */
  check: (key: string, questionId: string, correct: boolean) => void
  goTo: (key: string, index: number) => void
  addElapsed: (key: string, ms: number) => void
  addQuestionTime: (key: string, questionId: string, ms: number) => void
  discard: (key: string) => void
}

function patch(state: ExamState, key: string, fn: (s: ExamSession) => Partial<ExamSession>) {
  const current = state.sessions[key]
  if (!current) return state
  return { sessions: { ...state.sessions, [key]: { ...current, ...fn(current), updatedAt: Date.now() } } }
}

const NEW_TRACE: QuestionTrace = { timeSpentMs: 0, selectionChanges: 0, firstSelectedOption: null, lastSelectedOption: null, discarded: [] }

/** Actualiza el rastro de una pregunta sin tocar el resto de la sesión. */
function traced(cur: ExamSession, questionId: string, fn: (t: QuestionTrace) => QuestionTrace) {
  return { telemetry: { ...cur.telemetry, [questionId]: fn(cur.telemetry?.[questionId] ?? NEW_TRACE) } }
}

/** Primera elección o cambio real de alternativa; repetir la última no cuenta como cambio. */
function tracePick(t: QuestionTrace, option: OptionKey): QuestionTrace {
  if (!t.firstSelectedOption) return { ...t, firstSelectedOption: option, lastSelectedOption: option }
  if (t.lastSelectedOption === option) return t
  return { ...t, selectionChanges: t.selectionChanges + 1, lastSelectedOption: option }
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
      ensureSet: (id, practice) => {
        if (get().sets[id]) return
        set((s) => ({ sets: { ...s.sets, [id]: { ...practice, id, createdAt: Date.now() } } }))
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
      select: (key, questionId, option) => {
        // Responder ya es practicar: suma a la racha aunque el ensayo quede sin terminar.
        const session = get().sessions[key]
        if (session && !session.checked[questionId]) useStreakStore.getState().markPractice(localDateKey())
        set((s) =>
          patch(s, key, (cur) => {
            if (cur.checked[questionId]) return {}
            // Elegir una alternativa tachada (clic explícito) la recupera.
            const struck = cur.struck?.[questionId]
            return {
              answers: { ...cur.answers, [questionId]: option },
              answeredOn: cur.answeredOn?.[questionId] ? cur.answeredOn : { ...cur.answeredOn, [questionId]: localDateKey() },
              ...traced(cur, questionId, (t) => tracePick(t, option)),
              ...(struck?.includes(option)
                ? { struck: { ...cur.struck, [questionId]: struck.filter((k) => k !== option) } }
                : {}),
            }
          }),
        )
      },
      toggleStrike: (key, questionId, option) =>
        set((s) =>
          patch(s, key, (cur) => {
            if (cur.checked[questionId]) return {}
            const list = cur.struck?.[questionId] ?? []
            const striking = !list.includes(option)
            const next = striking ? [...list, option] : list.filter((k) => k !== option)
            const struck = { ...cur.struck, [questionId]: next }
            if (!next.length) delete struck[questionId]
            const trace = striking
              ? traced(cur, questionId, (t) => (t.discarded.includes(option) ? t : { ...t, discarded: [...t.discarded, option] }))
              : {}
            if (striking && cur.answers[questionId] === option) {
              const answers = { ...cur.answers }
              delete answers[questionId]
              return { struck, answers, ...trace }
            }
            return { struck, ...trace }
          }),
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
      check: (key, questionId, correct) =>
        set((s) =>
          patch(s, key, (cur) =>
            cur.checked[questionId]
              ? {}
              : { checked: { ...cur.checked, [questionId]: true }, correctRun: correct ? (cur.correctRun ?? 0) + 1 : 0 },
          ),
        ),
      goTo: (key, index) => set((s) => patch(s, key, () => ({ currentIndex: Math.max(0, index) }))),
      addElapsed: (key, ms) => set((s) => patch(s, key, (cur) => ({ elapsedMs: cur.elapsedMs + ms }))),
      addQuestionTime: (key, questionId, ms) =>
        set((s) => patch(s, key, (cur) => traced(cur, questionId, (t) => ({ ...t, timeSpentMs: t.timeSpentMs + ms })))),
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
