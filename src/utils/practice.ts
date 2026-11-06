import { EXAMS_BY_ID } from '@/data/catalog'
import { SUBJECTS } from '@/data/subjects'
import type { PracticeSet, SubjectId } from '@/types/exam'
import type { MistakeEntry } from './analytics'

const pad = (n: number) => n.toString().padStart(2, '0')
export const questionIdOf = (examId: string, number: number) => `${examId}-q${pad(number)}`
export const examIdOfQuestion = (questionId: string) => questionId.replace(/-q\d+$/, '')
export const numberOfQuestion = (questionId: string) => Number(questionId.match(/-q(\d+)$/)?.[1] ?? 0)

type SetDraft = Omit<PracticeSet, 'id' | 'createdAt'>

/** Modo revancha: solo las preguntas de una asignatura que fallaste (la más reciente primero). */
export function revengeDraft(subject: SubjectId, entries: MistakeEntry[], size = 20): SetDraft {
  const chosen = entries.filter((e) => e.subject === subject).slice(0, size)
  return {
    kind: 'revancha',
    subject,
    title: `Revancha: ${SUBJECTS[subject].short}`,
    description: `${chosen.length} preguntas de ${SUBJECTS[subject].short} que respondiste mal. Responde en modo práctica para ver la solución de inmediato.`,
    items: chosen.map((e) => ({ examId: e.examId, questionId: e.questionId })),
  }
}

export function sourceTitle(examId: string): string {
  return EXAMS_BY_ID.get(examId)?.title ?? 'Ensayo'
}
