import type { AttemptRecord } from '@/types/analytics'
import { SUBJECT_ORDER } from '@/data/subjects'
import type { SubjectId } from '@/types/exam'

export interface SubjectSummary {
  subject: SubjectId
  attempts: number
  latest: AttemptRecord | null
  best: number | null
  average: number | null
  /** Diferencia entre el último puntaje y el anterior de la misma asignatura. */
  delta: number | null
}

export function summarizeBySubject(attempts: AttemptRecord[]): Map<SubjectId, SubjectSummary> {
  const map = new Map<SubjectId, SubjectSummary>()
  const sorted = [...attempts].sort((a, b) => a.finishedAt - b.finishedAt)
  for (const a of sorted) {
    const s = map.get(a.subject) ?? { subject: a.subject, attempts: 0, latest: null, best: null, average: null, delta: null }
    const prev = s.latest
    s.attempts += 1
    s.delta = prev ? a.paesScore - prev.paesScore : null
    s.latest = a
    s.best = Math.max(s.best ?? 0, a.paesScore)
    s.average = ((s.average ?? 0) * (s.attempts - 1) + a.paesScore) / s.attempts
    map.set(a.subject, s)
  }
  return map
}

export function bestScoreByExam(attempts: AttemptRecord[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const a of attempts) map.set(a.examId, Math.max(map.get(a.examId) ?? 0, a.paesScore))
  return map
}

// ───────────────────────────── Fase 2: diagnóstico y cuaderno de errores ─────────────────────────────

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
        subject: a.subject, attemptId: a.id, at: a.finishedAt,
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
  attemptId: string
  failedAt: number
}

/** Preguntas cuyo último intento fue incorrecto: desaparecen del cuaderno cuando se responden bien. */
export function mistakeNotebook(attempts: AttemptRecord[]): MistakeEntry[] {
  const out: MistakeEntry[] = []
  for (const [questionId, r] of latestResults(attempts)) {
    if (r.selected === null || r.isCorrect) continue
    out.push({
      questionId,
      examId: questionId.replace(/-q\d+$/, ''),
      subject: r.subject,
      axis: r.axis,
      topic: r.topic,
      selected: r.selected,
      correct: r.correct,
      attemptId: r.attemptId,
      failedAt: r.at,
    })
  }
  return out.sort((a, b) => b.failedAt - a.failedAt)
}

export type Priority = 'alta' | 'media' | 'baja'

export interface WeakAxis {
  axis: string
  correct: number
  total: number
  accuracy: number
  priority: Priority
  weakestTopic: { topic: string; correct: number; total: number } | null
}

export const priorityOf = (accuracy: number): Priority => (accuracy < 0.5 ? 'alta' : accuracy < 0.7 ? 'media' : 'baja')

/** Los ejes con menor acierto de una asignatura (según el último resultado de cada pregunta). */
export function weakestAxes(attempts: AttemptRecord[], subject: SubjectId, limit = 3, minTotal = 3): WeakAxis[] {
  const axes = new Map<string, { correct: number; total: number; topics: Map<string, { correct: number; total: number }> }>()
  for (const r of latestResults(attempts).values()) {
    if (r.subject !== subject) continue
    const a = axes.get(r.axis) ?? { correct: 0, total: 0, topics: new Map() }
    a.total += 1
    if (r.isCorrect) a.correct += 1
    if (r.topic !== r.axis) {
      const t = a.topics.get(r.topic) ?? { correct: 0, total: 0 }
      t.total += 1
      if (r.isCorrect) t.correct += 1
      a.topics.set(r.topic, t)
    }
    axes.set(r.axis, a)
  }
  return [...axes.entries()]
    .filter(([, a]) => a.total >= minTotal)
    .map(([axis, a]) => {
      const accuracy = a.correct / a.total
      const topics = [...a.topics.entries()].filter(([, t]) => t.total >= 2)
      const weakest = topics.sort((x, y) => x[1].correct / x[1].total - y[1].correct / y[1].total)[0]
      return {
        axis, correct: a.correct, total: a.total, accuracy, priority: priorityOf(accuracy),
        weakestTopic: weakest ? { topic: weakest[0], ...weakest[1] } : null,
      }
    })
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, limit)
}

/** Asignaturas con diagnóstico (al menos un eje con 3 o más preguntas), en el orden estándar. */
export function diagnosisSubjects(attempts: AttemptRecord[]): { subject: SubjectId; axes: WeakAxis[] }[] {
  return SUBJECT_ORDER.map((subject) => ({ subject, axes: weakestAxes(attempts, subject) })).filter((d) => d.axes.length > 0)
}
