import { EXAMS_BY_ID } from '@/data/catalog'
import { EXPLAINED_QUESTIONS } from '@/data/temario'
import type { PracticeSet, SubjectId } from '@/types/exam'
import { examIdOfQuestion } from './practice'

const pad = (n: number) => n.toString().padStart(2, '0')

/** Fecha local en formato `YYYY-MM-DD` (la semilla del Desafío Diario y la clave de la racha). */
export function localDateKey(date: Date | number = new Date()): string {
  const d = typeof date === 'number' ? new Date(date) : date
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Día anterior a una clave `YYYY-MM-DD` (respeta cambios de mes, año y horario de verano). */
export function previousDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return localDateKey(new Date(y, m - 1, d - 1, 12))
}

/** FNV-1a de 32 bits: el mismo texto da siempre el mismo número, en cualquier navegador. */
export function hashString(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export interface DailySlot {
  id: 'lectora' | 'matematica' | 'ciencias-historia'
  label: string
  subjects: SubjectId[]
}

export const DAILY_SLOTS: DailySlot[] = [
  { id: 'lectora', label: 'Competencia Lectora', subjects: ['lectora'] },
  { id: 'matematica', label: 'Matemática M1/M2', subjects: ['m1', 'm2'] },
  { id: 'ciencias-historia', label: 'Ciencias o Historia', subjects: ['ciencias', 'historia'] },
]

/** Banco de cada franja: solo preguntas con solución paso a paso, en un orden fijo (por id). */
const POOLS: Record<DailySlot['id'], string[]> = Object.fromEntries(
  DAILY_SLOTS.map((slot) => [
    slot.id,
    [...EXPLAINED_QUESTIONS]
      .filter((qid) => {
        const subject = EXAMS_BY_ID.get(examIdOfQuestion(qid))?.subject
        return subject !== undefined && slot.subjects.includes(subject)
      })
      .sort(),
  ]),
) as Record<DailySlot['id'], string[]>

export interface DailyPick {
  slot: DailySlot
  questionId: string
  examId: string
}

/** Las 3 preguntas del día: deterministas a partir de la fecha local, sin backend. */
export function dailyPicks(dateKey: string): DailyPick[] {
  return DAILY_SLOTS.flatMap((slot) => {
    const pool = POOLS[slot.id]
    if (!pool.length) return []
    const questionId = pool[hashString(`paes-studio:${dateKey}:${slot.id}`) % pool.length]
    return [{ slot, questionId, examId: examIdOfQuestion(questionId) }]
  })
}

export const DAILY_PREFIX = 'set-diario-'
export const dailySetId = (dateKey: string) => `${DAILY_PREFIX}${dateKey}`
export const isDailySetId = (id: string) => id.startsWith(DAILY_PREFIX)
export const dateKeyOfDailySet = (id: string) => id.slice(DAILY_PREFIX.length)

const longDate = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })

export function dailyDraft(dateKey: string): Omit<PracticeSet, 'id' | 'createdAt'> {
  const picks = dailyPicks(dateKey)
  const [y, m, d] = dateKey.split('-').map(Number)
  return {
    kind: 'diario',
    subject: 'lectora',
    title: 'Desafío Diario',
    description: `Las 3 preguntas del ${longDate.format(new Date(y, m - 1, d))}: una de Competencia Lectora, una de Matemática y una de Ciencias o Historia. Responde las tres para sumar el día a tu racha.`,
    items: picks.map((p) => ({ examId: p.examId, questionId: p.questionId })),
  }
}
