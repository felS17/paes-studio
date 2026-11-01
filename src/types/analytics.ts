/** Dominio: intentos rendidos, desempeño por eje y respaldo del progreso. */
import type { ExamMode, ExamSource, OptionKey, ScienceArea, SubjectId } from './exam'

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
