import type { AttemptRecord, QuestionResult, QuestionTelemetry } from '@/types/analytics'
import { OPTION_KEYS, type OptionKey, type SubjectId } from '@/types/exam'
import { subjectOfQuestion } from './analytics'

/** Umbrales de la Matriz de Ritmo y Decisión. */
export const FLUENT_MS = 90_000
export const LEAK_MS = 150_000
export const IMPULSE_MS = 35_000
export const INDECISION_CHANGES = 2

export type CadenceQuadrant = 'fluido' | 'fuga' | 'indecision' | 'ciego'

const count = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0)
const option = (v: unknown) => (OPTION_KEYS.includes(v as OptionKey) ? (v as OptionKey) : null)

/**
 * Telemetría de una pregunta con valores seguros, o null si el intento es anterior a la v2.1. Valida cada campo
 * porque los intentos también llegan desde respaldos importados.
 */
export function readTelemetry(q: QuestionResult): QuestionTelemetry | null {
  const t: unknown = q.telemetry
  if (!t || typeof t !== 'object') return null
  const raw = t as Partial<Record<keyof QuestionTelemetry, unknown>>
  return {
    timeSpentMs: count(raw.timeSpentMs),
    selectionChanges: count(raw.selectionChanges),
    firstSelectedOption: option(raw.firstSelectedOption),
    finalSelectedOption: option(raw.finalSelectedOption) ?? q.selected ?? null,
    discardedCount: count(raw.discardedCount),
  }
}

export const hasTelemetry = (a: AttemptRecord) => (a.questions ?? []).some((q) => readTelemetry(q) !== null)

/**
 * Cuadrante de una pregunta respondida. Son excluyentes: dudar pesa más que demorarse, así cada pregunta se
 * cuenta una sola vez. Las que no cumplen ninguna regla quedan fuera de la matriz (null).
 */
export function classifyQuestion(q: QuestionResult, t: QuestionTelemetry): CadenceQuadrant | null {
  if (q.selected === null || t.timeSpentMs <= 0) return null
  if (t.selectionChanges >= INDECISION_CHANGES) return 'indecision'
  if (q.isCorrect) {
    if (t.timeSpentMs > LEAK_MS) return 'fuga'
    return t.timeSpentMs < FLUENT_MS && t.selectionChanges === 0 ? 'fluido' : null
  }
  return t.timeSpentMs < IMPULSE_MS && t.discardedCount === 0 ? 'ciego' : null
}

export interface ChangeBalance {
  /** Marcó primero la correcta y terminó en una incorrecta. */
  toxic: number
  /** Marcó primero una incorrecta y terminó en la correcta. */
  corrective: number
  /** Cambió entre alternativas incorrectas. */
  neutral: number
}

const emptyBalance = (): ChangeBalance => ({ toxic: 0, corrective: 0, neutral: 0 })

function addChange(balance: ChangeBalance, q: QuestionResult, t: QuestionTelemetry) {
  const { firstSelectedOption: first, finalSelectedOption: final } = t
  if (!first || !final || first === final) return
  if (first === q.correct) balance.toxic += 1
  else if (final === q.correct) balance.corrective += 1
  else balance.neutral += 1
}

/** Índice de Duda Tóxica: de los cambios que alteraron el resultado, qué parte te quitó un acierto. */
export const toxicIndex = (b: ChangeBalance) => (b.toxic + b.corrective ? b.toxic / (b.toxic + b.corrective) : null)

export interface QuadrantStat {
  count: number
  avgMs: number
  questions: QuestionResult[]
}

export interface CadenceSummary {
  /** Preguntas respondidas con tiempo medido. */
  measured: number
  /** Medidas que no calzan con ningún cuadrante. */
  outside: number
  quadrants: Record<CadenceQuadrant, QuadrantStat>
  balance: ChangeBalance
}

export function summarizeCadence(questions: QuestionResult[]): CadenceSummary {
  const totals: Record<CadenceQuadrant, { ms: number; questions: QuestionResult[] }> = {
    fluido: { ms: 0, questions: [] },
    fuga: { ms: 0, questions: [] },
    indecision: { ms: 0, questions: [] },
    ciego: { ms: 0, questions: [] },
  }
  const balance = emptyBalance()
  let measured = 0
  let outside = 0
  for (const q of questions) {
    const t = readTelemetry(q)
    if (!t) continue
    addChange(balance, q, t)
    if (q.selected === null || t.timeSpentMs <= 0) continue
    measured += 1
    const quadrant = classifyQuestion(q, t)
    if (!quadrant) outside += 1
    else {
      totals[quadrant].ms += t.timeSpentMs
      totals[quadrant].questions.push(q)
    }
  }
  const stat = (key: CadenceQuadrant): QuadrantStat => ({
    count: totals[key].questions.length,
    avgMs: totals[key].questions.length ? totals[key].ms / totals[key].questions.length : 0,
    questions: totals[key].questions,
  })
  return {
    measured,
    outside,
    balance,
    quadrants: { fluido: stat('fluido'), fuga: stat('fuga'), indecision: stat('indecision'), ciego: stat('ciego') },
  }
}

/** Preguntas de un intento que pertenecen a una asignatura (las prácticas pueden mezclar varias). */
export const questionsOfSubject = (a: AttemptRecord, subject: SubjectId | 'todas') =>
  subject === 'todas' ? a.questions : a.questions.filter((q) => subjectOfQuestion(q.id, a.subject) === subject)

export interface AxisTime {
  subject: SubjectId
  axis: string
  avgMs: number
  /** Preguntas respondidas con tiempo medido. */
  count: number
  accuracy: number
}

/** Tiempo promedio por eje temático, del más lento al más rápido. */
export function axisTimes(attempts: AttemptRecord[], subject: SubjectId | 'todas'): AxisTime[] {
  const map = new Map<string, { subject: SubjectId; axis: string; ms: number; count: number; correct: number }>()
  for (const a of attempts) {
    for (const q of questionsOfSubject(a, subject)) {
      const t = readTelemetry(q)
      if (!t || q.selected === null || t.timeSpentMs <= 0) continue
      const owner = subjectOfQuestion(q.id, a.subject)
      const key = `${owner}|${q.axis}`
      const row = map.get(key) ?? { subject: owner, axis: q.axis, ms: 0, count: 0, correct: 0 }
      row.ms += t.timeSpentMs
      row.count += 1
      if (q.isCorrect) row.correct += 1
      map.set(key, row)
    }
  }
  return [...map.values()]
    .map((r) => ({ subject: r.subject, axis: r.axis, count: r.count, avgMs: r.ms / r.count, accuracy: r.correct / r.count }))
    .sort((x, y) => y.avgMs - x.avgMs)
}

export interface ChangeHistoryRow {
  attemptId: string
  examTitle: string
  finishedAt: number
  balance: ChangeBalance
  total: number
}

/** Cambios de respuesta de cada intento con telemetría, del más reciente al más antiguo. */
export function changeHistory(attempts: AttemptRecord[], subject: SubjectId | 'todas', limit = 12): ChangeHistoryRow[] {
  const rows: ChangeHistoryRow[] = []
  for (const a of [...attempts].sort((x, y) => y.finishedAt - x.finishedAt)) {
    const questions = questionsOfSubject(a, subject)
    if (!questions.some((q) => readTelemetry(q))) continue
    const balance = emptyBalance()
    for (const q of questions) {
      const t = readTelemetry(q)
      if (t) addChange(balance, q, t)
    }
    rows.push({
      attemptId: a.id,
      examTitle: a.examTitle,
      finishedAt: a.finishedAt,
      balance,
      total: balance.toxic + balance.corrective + balance.neutral,
    })
    if (rows.length === limit) break
  }
  return rows
}
