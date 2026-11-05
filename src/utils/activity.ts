import type { StudyDay } from '@/store/useStreakStore'
import type { AttemptRecord } from '@/types/analytics'
import { localDateKey } from './daily'

export interface DayActivity {
  questions: number
  flashcards: number
  /** Ensayos y prácticas terminados ese día. */
  sessions: number
}

/** Actividad de cada día local: preguntas respondidas al entregar cada intento y flashcards repasadas. */
export function activityByDay(attempts: AttemptRecord[], days: Record<string, StudyDay>): Map<string, DayActivity> {
  const map = new Map<string, DayActivity>()
  const at = (key: string) => {
    let day = map.get(key)
    if (!day) {
      day = { questions: 0, flashcards: 0, sessions: 0 }
      map.set(key, day)
    }
    return day
  }
  for (const a of attempts) {
    const answered = a.questions.filter((q) => q.selected !== null).length
    if (!answered) continue
    const day = at(localDateKey(a.finishedAt))
    day.questions += answered
    day.sessions += 1
  }
  for (const [key, study] of Object.entries(days)) {
    if (study.flashcards) at(key).flashcards += study.flashcards
  }
  return map
}

/** Intensidad de 0 a 4 según lo estudiado ese día; umbrales fijos para que el mismo esfuerzo pinte igual siempre. */
export function activityLevel(day: DayActivity | undefined): 0 | 1 | 2 | 3 | 4 {
  const total = day ? day.questions + day.flashcards : 0
  if (total === 0) return 0
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
const dayFmt = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long' })

/** Etiqueta en la primera semana de cada mes, salvo que quede pegada a la anterior. */
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
  return `Sin actividad el ${date}`
}
