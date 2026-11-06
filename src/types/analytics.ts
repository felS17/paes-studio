/** Dominio: intentos rendidos, desempeño por eje y respaldo del progreso. */
import type { ExamMode, ExamSource, OptionKey, ScienceArea, SubjectId } from './exam'

/**
 * Telemetría silenciosa de una pregunta (v2.1). Los intentos anteriores no la traen: leerla siempre con
 * `readTelemetry` (src/utils/telemetry.ts), que además tolera respaldos importados incompletos.
 */
export interface QuestionTelemetry {
  /** Tiempo real viendo la pregunta, sumando cada vez que vuelve a ella. No corre con la pestaña oculta. */
  timeSpentMs: number
  /** Veces que cambió de alternativa. */
  selectionChanges: number
  firstSelectedOption: OptionKey | null
  finalSelectedOption: OptionKey | null
  /** Alternativas distintas que tachó con la herramienta de descarte. */
  discardedCount: number
}

/** Rastro en curso de una pregunta dentro de una sesión; se convierte en `QuestionTelemetry` al entregar. */
export interface QuestionTrace {
  timeSpentMs: number
  selectionChanges: number
  firstSelectedOption: OptionKey | null
  /** Última alternativa elegida, aunque luego se haya borrado o tachado. */
  lastSelectedOption: OptionKey | null
  discarded: OptionKey[]
}

export interface QuestionResult {
  id: string
  number: number
  axis: string
  topic: string
  selected: OptionKey | null
  correct: OptionKey
  isCorrect: boolean
  flagged: boolean
  pilot: boolean
  telemetry?: QuestionTelemetry
  /** Día local (`YYYY-MM-DD`) en que se respondió; sin él, cuenta el día de la entrega. */
  answeredOn?: string
}

export interface AxisStat {
  correct: number
  total: number
}

export interface AttemptRecord {
  id: string
  examId: string
  examTitle: string
  subject: SubjectId
  area?: ScienceArea
  source: ExamSource
  mode: ExamMode
  startedAt: number
  finishedAt: number
  durationMs: number
  timeLimitMs: number | null
  totalQuestions: number
  answered: number
  correct: number
  incorrect: number
  omitted: number
  /** Correctas sin contar preguntas piloto (base del Puntaje P). */
  scorableCorrect: number
  scorableTotal: number
  paesScore: number
  /** true cuando la conversión es exacta (prueba completa con tabla oficial). */
  scoreIsExact: boolean
  perAxis: Record<string, AxisStat>
  questions: QuestionResult[]
}


export interface BackupFile {
  app: 'paes-studio'
  version: 1
  exportedAt: string
  attempts: AttemptRecord[]
}
