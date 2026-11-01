import { EXAMS, EXAMS_BY_ID } from '@/data/catalog'
import { SUBJECTS } from '@/data/subjects'
import type { AttemptRecord } from '@/types/analytics'
import type { PracticeSet, SubjectId } from '@/types/exam'
import { latestResults, type MistakeEntry } from './analytics'

const pad = (n: number) => n.toString().padStart(2, '0')
export const questionIdOf = (examId: string, number: number) => `${examId}-q${pad(number)}`
export const examIdOfQuestion = (questionId: string) => questionId.replace(/-q\d+$/, '')
export const numberOfQuestion = (questionId: string) => Number(questionId.match(/-q(\d+)$/)?.[1] ?? 0)

function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type SetDraft = Omit<PracticeSet, 'id' | 'createdAt'>

/**
 * Práctica de un eje: primero las preguntas de ese eje que fallaste hace poco, luego las que nunca has
 * respondido (con preferencia por los ensayos curados, que traen desarrollo verificado) y al final el resto.
 */
export function axisPracticeDraft(subject: SubjectId, axis: string, attempts: AttemptRecord[], size = 15): SetDraft {
  const latest = latestResults(attempts)
  const failed: string[] = []
  const unseenCurated: string[] = []
  const unseen: string[] = []
  const rest: string[] = []
  for (const meta of EXAMS) {
    if (meta.subject !== subject) continue
    for (const n of meta.axisQuestions[axis] ?? []) {
      const id = questionIdOf(meta.id, n)
      const r = latest.get(id)
      if (r && r.selected !== null && !r.isCorrect) failed.push(id)
      else if (!r) (meta.source === 'curado' ? unseenCurated : unseen).push(id)
      else rest.push(id)
    }
  }
  const ids = [...shuffle(failed).slice(0, 5), ...shuffle(unseenCurated), ...shuffle(unseen), ...shuffle(rest)].slice(0, size)
  return {
    kind: 'eje',
    subject,
    title: `Práctica de ${axis}`,
    description: `${ids.length} preguntas de ${axis} (${SUBJECTS[subject].short}) elegidas para reforzar este eje: primero las que fallaste recientemente y luego las que aún no has respondido.`,
    items: ids.map((questionId) => ({ examId: examIdOfQuestion(questionId), questionId })),
  }
}

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
