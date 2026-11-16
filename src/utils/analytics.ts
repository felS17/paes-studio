import type { AttemptRecord, QuestionProgress } from '@/types/analytics'
import { EXAMS_BY_ID } from '@/data/catalog'
import type { SubjectId } from '@/types/exam'

/** Asignatura real de una pregunta (por su ensayo de origen), aunque venga de una práctica mixta. */
export const subjectOfQuestion = (questionId: string, fallback: SubjectId): SubjectId =>
  EXAMS_BY_ID.get(questionId.replace(/-q\d+$/, ''))?.subject ?? fallback

/** Último puntaje de cada ensayo. */
export function lastScoreByExam(attempts: AttemptRecord[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const a of [...attempts].sort((x, y) => x.finishedAt - y.finishedAt)) map.set(a.examId, a.paesScore)
  return map
}

/** Acierto sobre todo lo respondido (0–1), o null si aún no respondes nada. */
export function globalAccuracy(attempts: AttemptRecord[]): number | null {
  let answered = 0
  let correct = 0
  for (const a of attempts) {
    answered += a.answered
    correct += a.correct
  }
  return answered ? correct / answered : null
}

// ───────────────────────────── Cuaderno de errores ─────────────────────────────

export interface LatestResult {
  selected: AttemptRecord['questions'][number]['selected']
  isCorrect: boolean
  correct: AttemptRecord['questions'][number]['correct']
  axis: string
  topic: string
  subject: SubjectId
  attemptId: string
  at: number
}

/** Último resultado de cada pregunta (por id global), considerando todos los intentos. */
export function latestResults(attempts: AttemptRecord[]): Map<string, LatestResult> {
  const map = new Map<string, LatestResult>()
  for (const a of [...attempts].sort((x, y) => x.finishedAt - y.finishedAt)) {
    for (const q of a.questions) {
      // En práctica, una pregunta no respondida no borra el resultado anterior.
      if (a.mode === 'practica' && q.selected === null) continue
      map.set(q.id, {
        selected: q.selected, isCorrect: q.isCorrect, correct: q.correct, axis: q.axis, topic: q.topic,
        subject: subjectOfQuestion(q.id, a.subject), attemptId: a.id, at: a.finishedAt,
      })
    }
  }
  return map
}

export interface MistakeEntry {
  questionId: string
  examId: string
  subject: SubjectId
  axis: string
  topic: string
  selected: NonNullable<LatestResult['selected']>
  correct: LatestResult['correct']
  failedAt: number
  /** Aciertos seguidos desde que la fallaste: con 2 sale del banco. */
  streak: number
}

/** Banco de errores: preguntas falladas en cualquier modo que aún no juntan 2 aciertos seguidos. */
export function mistakeBank(progress: Record<string, QuestionProgress>): MistakeEntry[] {
  const out: MistakeEntry[] = []
  for (const [questionId, p] of Object.entries(progress)) {
    if (!p.miss) continue
    const examId = questionId.replace(/-q\d+$/, '')
    const subject = EXAMS_BY_ID.get(examId)?.subject
    if (!subject) continue
    out.push({
      questionId, examId, subject,
      axis: p.miss.axis, topic: p.miss.topic, selected: p.miss.selected, correct: p.miss.answer,
      failedAt: p.miss.at, streak: p.streak,
    })
  }
  return out.sort((a, b) => b.failedAt - a.failedAt)
}

/** La materia con más errores en cola: a ella apunta la revancha rápida. */
export function worstSubject(entries: MistakeEntry[]): SubjectId | null {
  const counts = new Map<SubjectId, number>()
  for (const e of entries) counts.set(e.subject, (counts.get(e.subject) ?? 0) + 1)
  return [...counts].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null
}
