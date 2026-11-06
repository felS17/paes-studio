import type { AttemptRecord, QuestionResult, QuestionTelemetry } from '@/types/analytics'
import { OPTION_KEYS, type OptionKey } from '@/types/exam'

/** Umbrales de los perfiles de respuesta. */
export const FLUENT_MS = 90_000
export const LEAK_MS = 150_000
export const IMPULSE_MS = 35_000

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
 * Perfil de una pregunta respondida. Son excluyentes: dudar (cambiar de alternativa) pesa más que demorarse, así
 * cada pregunta se cuenta una sola vez. Las que no cumplen ninguna regla quedan sin perfil (null).
 */
export function classifyQuestion(q: QuestionResult, t: QuestionTelemetry): CadenceQuadrant | null {
  if (q.selected === null || t.timeSpentMs <= 0) return null
  if (t.selectionChanges > 0) return 'indecision'
  if (q.isCorrect) {
    if (t.timeSpentMs > LEAK_MS) return 'fuga'
    return t.timeSpentMs < FLUENT_MS ? 'fluido' : null
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

/** De los cambios que movieron el resultado, qué parte te quitó un acierto. */
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

/** Segundos promedio por pregunta respondida (en ms), o null si ningún intento tiene tiempo medido. */
export function averagePaceMs(attempts: AttemptRecord[]): number | null {
  let ms = 0
  let count = 0
  for (const a of attempts) {
    for (const q of a.questions ?? []) {
      const t = readTelemetry(q)
      if (!t || q.selected === null || t.timeSpentMs <= 0) continue
      ms += t.timeSpentMs
      count += 1
    }
  }
  return count ? ms / count : null
}
