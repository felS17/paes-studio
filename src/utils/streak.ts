import type { StudyDay } from '@/store/useStreakStore'
import type { AttemptRecord } from '@/types/analytics'
import { localDateKey, previousDateKey } from './dateKey'

/** Cualquier práctica suma a la racha: ensayo, tema, entrenamiento rápido, Desafío Diario o flashcards. */
export const isActiveDay = (day: StudyDay | undefined) => Boolean(day && (day.challenge || day.practice || (day.flashcards ?? 0) > 0))

/**
 * Suma los días en que entregaste un intento con respuestas. Sin esto no contarían los intentos anteriores a la racha
 * universal ni los que llegan al subir un respaldo.
 */
export function withAttemptDays(days: Record<string, StudyDay>, attempts: AttemptRecord[]): Record<string, StudyDay> {
  const merged = { ...days }
  for (const a of attempts) {
    if (!a.answered) continue
    const key = localDateKey(a.finishedAt)
    merged[key] = { ...merged[key], practice: true }
  }
  return merged
}

export interface StreakSummary {
  /** Días seguidos con actividad, terminando hoy (o ayer, si hoy aún no estudias: la racha sigue viva). */
  current: number
  activeToday: boolean
  /** La racha más larga registrada. */
  best: number
}

export function streakSummary(days: Record<string, StudyDay>, today: string): StreakSummary {
  const activeToday = isActiveDay(days[today])
  let cursor = activeToday ? today : previousDateKey(today)
  let current = 0
  while (isActiveDay(days[cursor])) {
    current += 1
    cursor = previousDateKey(cursor)
  }
  let best = 0
  for (const key of Object.keys(days).filter((k) => isActiveDay(days[k])).sort()) {
    // Cada día activo que no continúa al anterior inicia una racha nueva.
    if (isActiveDay(days[previousDateKey(key)])) continue
    let run = 0
    let k = key
    while (isActiveDay(days[k])) {
      run += 1
      const [y, m, d] = k.split('-').map(Number)
      const next = new Date(y, m - 1, d + 1, 12)
      k = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
    }
    best = Math.max(best, run)
  }
  return { current, activeToday, best: Math.max(best, current) }
}
