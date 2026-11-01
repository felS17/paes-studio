import type { AttemptRecord, AxisStat, QuestionResult } from '@/types/analytics'
import type { Exam, ExamMode, OptionKey } from '@/types/exam'

export const PAES_MIN = 100
export const PAES_MAX = 1000

/**
 * Convierte respuestas correctas a Puntaje PAES usando la tabla de transformación del DEMRE.
 *
 * - Prueba completa (mismas preguntas puntuables que la oficial): conversión exacta `tabla[P]`.
 * - Selección parcial o ensayo curado: se escala la proporción de aciertos al rango de la tabla y se
 *   interpola linealmente (estimación).
 */
export function paesFromTable(
  table: number[],
  correct: number,
  scorableTotal: number,
): { score: number; exact: boolean } {
  if (table.length < 2 || scorableTotal <= 0) return { score: PAES_MIN, exact: false }
  const maxP = table.length - 1
  if (scorableTotal === maxP) {
    const p = Math.max(0, Math.min(maxP, correct))
    return { score: table[p], exact: true }
  }
  const pos = (Math.max(0, Math.min(scorableTotal, correct)) / scorableTotal) * maxP
  const lo = Math.floor(pos)
  const hi = Math.min(maxP, lo + 1)
  const t = pos - lo
  return { score: Math.round(table[lo] + (table[hi] - table[lo]) * t), exact: false }
}

export interface GradeInput {
  exam: Exam
  mode: ExamMode
  answers: Record<string, OptionKey | undefined>
  flagged: string[]
  startedAt: number
  durationMs: number
}

export function gradeAttempt({ exam, mode, answers, flagged, startedAt, durationMs }: GradeInput): AttemptRecord {
  const flaggedSet = new Set(flagged)
  const perAxis: Record<string, AxisStat> = {}
  // En práctica solo cuentan las preguntas respondidas: saltarse una no es evidencia de debilidad.
  const counts = (selected: OptionKey | null) => mode === 'ensayo' || selected !== null
  const questions: QuestionResult[] = exam.questions.map((q) => {
    const selected = answers[q.id] ?? null
    const isCorrect = selected === q.answer
    if (counts(selected)) {
      const axis = (perAxis[q.axis] ??= { correct: 0, total: 0 })
      axis.total += 1
      if (isCorrect) axis.correct += 1
    }
    return {
      id: q.id,
      number: q.number,
      axis: q.axis,
      topic: q.topic,
      selected,
      correct: q.answer,
      isCorrect,
      flagged: flaggedSet.has(q.id),
      pilot: Boolean(q.pilot),
    }
  })
  const answered = questions.filter((q) => q.selected !== null).length
  const correct = questions.filter((q) => q.isCorrect).length
  const scorable = questions.filter((q) => !q.pilot && counts(q.selected))
  const scorableCorrect = scorable.filter((q) => q.isCorrect).length
  const { score, exact: tableExact } = paesFromTable(exam.scoring.table, scorableCorrect, scorable.length)
  const officialScorable = exam.scoring.officialScorableCount ?? exam.scoring.table.length - 1
  const exact = mode === 'ensayo' && tableExact && exam.scoring.method === 'official-table' && scorable.length === officialScorable
  const finishedAt = Date.now()
  return {
    id: `${exam.id}-${finishedAt.toString(36)}`,
    examId: exam.id,
    examTitle: exam.title,
    subject: exam.subject,
    area: exam.area,
    source: exam.source,
    mode,
    startedAt,
    finishedAt,
    durationMs,
    timeLimitMs: mode === 'ensayo' ? exam.durationMinutes * 60_000 : null,
    totalQuestions: questions.length,
    answered,
    correct,
    incorrect: answered - correct,
    omitted: questions.length - answered,
    scorableCorrect,
    scorableTotal: scorable.length,
    paesScore: score,
    scoreIsExact: exact,
    perAxis,
    questions,
  }
}

/** Posición relativa (0–1) de un puntaje dentro de la escala PAES. */
export function scaleRatio(score: number): number {
  return Math.max(0, Math.min(1, (score - PAES_MIN) / (PAES_MAX - PAES_MIN)))
}
