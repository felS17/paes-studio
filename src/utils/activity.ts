import type { ExamSession } from '@/store/useExamStore'
import type { StudyDay } from '@/store/useStreakStore'
import type { AttemptRecord } from '@/types/analytics'
import { localDateKey } from './daily'
import { answerDay, isActiveDay } from './streak'

export interface DayActivity {
  questions: number
  flashcards: number
  /** El día suma a tu racha aunque ya no queden respuestas que contar (p. ej., descartaste esa práctica). */
  practiced: boolean
}

/**
 * Actividad de cada día local: preguntas de intentos entregados y de sesiones en curso, más flashcards. Cada sesión
 * se borra al entregarla y pasa a ser un intento, así que una misma respuesta nunca se cuenta dos veces.
 */
export function activityByDay(
  attempts: AttemptRecord[],
  days: Record<string, StudyDay>,
  sessions: Pick<ExamSession, 'answers' | 'answeredOn' | 'updatedAt'>[],
): Map<string, DayActivity> {
  const map = new Map<string, DayActivity>()
  const at = (key: string) => {
    let day = map.get(key)
    if (!day) {
      day = { questions: 0, flashcards: 0, practiced: false }
      map.set(key, day)
    }
    return day
  }
  for (const a of attempts) {
    for (const q of a.questions) {
      if (q.selected !== null) at(answerDay(q.answeredOn, a.finishedAt)).questions += 1
    }
  }
  for (const s of sessions) {
    for (const questionId of Object.keys(s.answers)) at(s.answeredOn?.[questionId] ?? localDateKey(s.updatedAt)).questions += 1
  }
  for (const [key, study] of Object.entries(days)) {
    if (study.flashcards) at(key).flashcards += study.flashcards
    if (isActiveDay(study)) at(key).practiced = true
  }
  return map
}

/** Intensidad de 0 a 4 según lo estudiado ese día; umbrales fijos para que el mismo esfuerzo pinte igual siempre. */
export function activityLevel(day: DayActivity | undefined): 0 | 1 | 2 | 3 | 4 {
  const total = day ? day.questions + day.flashcards : 0
  // Un día que suma a la racha nunca queda vacío.
  if (total === 0) return day?.practiced ? 1 : 0
  if (total < 5) return 1
  if (total < 15) return 2
  if (total < 40) return 3
  return 4
}

const parseKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** Columnas del heatmap, una por semana y de lunes a domingo. La última termina hoy. */
export function heatmapColumns(today: string, weeks = 20): string[][] {
  const end = parseKey(today)
  const mondayOffset = (end.getDay() + 6) % 7
  const columns: string[][] = []
  for (let w = weeks - 1; w >= 0; w--) {
    const column: string[] = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(end.getFullYear(), end.getMonth(), end.getDate() - mondayOffset - w * 7 + d, 12)
      if (date <= end) column.push(localDateKey(date))
    }
    columns.push(column)
  }
  return columns
}

const monthFmt = new Intl.DateTimeFormat('es-CL', { month: 'short' })

/** Etiqueta de cada mes sobre la columna donde parte. */
export function monthLabels(columns: string[][]): { column: number; label: string }[] {
  const labels: { column: number; label: string }[] = []
  let month = -1
  columns.forEach((col, column) => {
    const date = parseKey(col[0])
    if (date.getMonth() === month) return
    month = date.getMonth()
    const last = labels[labels.length - 1]
    if (last && column - last.column < 3) return
    // Si el mes partió hace rato en la primera columna, su etiqueta chocaría con la del mes siguiente.
    if (column === 0 && parseKey(columns[Math.min(2, columns.length - 1)][0]).getMonth() !== month) return
    labels.push({ column, label: monthFmt.format(date).replace('.', '') })
  })
  return labels
}

const dayFmt = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long' })

/** «14 preguntas resueltas el 3 de noviembre». */
export function describeDay(key: string, day: DayActivity | undefined): string {
  const date = dayFmt.format(parseKey(key))
  const questions = day?.questions ?? 0
  const cards = day?.flashcards ?? 0
  const q = `${questions} ${questions === 1 ? 'pregunta resuelta' : 'preguntas resueltas'}`
  const c = `${cards} ${cards === 1 ? 'flashcard' : 'flashcards'}`
  if (questions && cards) return `${q} y ${c} el ${date}`
  if (questions) return `${q} el ${date}`
  if (cards) return `${c} ${cards === 1 ? 'repasada' : 'repasadas'} el ${date}`
  return day?.practiced ? `Practicaste el ${date}` : `Sin actividad el ${date}`
}
