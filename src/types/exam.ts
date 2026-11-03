/** Dominio: ensayos, lecturas y preguntas (esquema compartido con scripts/pipeline). */

export type SubjectId = 'm1' | 'm2' | 'lectora' | 'ciencias' | 'historia'
export type ScienceArea = 'biologia' | 'fisica' | 'quimica' | 'tp'
export type Modality = 'regular' | 'invierno' | 'curado' | 'personalizado'
export type ExamSource = 'demre' | 'curado'
export type OptionKey = 'A' | 'B' | 'C' | 'D' | 'E'
export type ExamMode = 'practica' | 'ensayo'

export const OPTION_KEYS: readonly OptionKey[] = ['A', 'B', 'C', 'D', 'E'] as const

export interface QuestionOption {
  key: OptionKey
  /** Markdown + LaTeX. Puede estar vacío si la pregunta se presenta como recorte. */
  text: string
}

export interface Snapshot {
  src: string
  width: number
  height: number
  /** Escala de grises: se puede invertir en modo oscuro. */
  mono?: boolean
}

export interface Explanation {
  /**
   * `desarrollo`: resolución escrita y revisada (ensayos curados).
   * `solucion`: resolución específica del ejercicio oficial, redactada con IA (subagentes) y validada contra
   * la clave del clavijero (scripts/pipeline/solutions/).
   */
  kind?: 'desarrollo' | 'solucion'
  /** Idea clave en una o dos oraciones. */
  summary: string
  /** Planteamiento: qué pide exactamente el enunciado y qué datos (o fragmento clave) entrega. */
  planteamiento?: string
  /** Desarrollo paso a paso (Markdown + LaTeX); la interfaz los numera «Paso 1, Paso 2…». */
  steps: string[]
  /** Análisis de distractores: por qué falla cada alternativa incorrecta (la trampa típica del DEMRE). */
  distractors?: Partial<Record<OptionKey, string>>
}

export interface Question {
  id: string
  number: number
  /** Eje temático (Matemática/Historia), área (Ciencias) o habilidad (Lectora). */
  axis: string
  topic: string
  /** Subtema del temario DEMRE (uno de los 67; ver src/data/temario/index.json). */
  subtopic?: string
  skill?: string
  difficulty?: 'baja' | 'media' | 'alta'
  passageId?: string
  stem: string
  options: QuestionOption[]
  answer: OptionKey
  /** Pregunta piloto: el DEMRE no la considera en el Puntaje P. */
  pilot?: boolean
  /** `snapshot`: el enunciado se muestra como recorte fiel del folleto oficial. */
  presentation?: 'text' | 'snapshot'
  snapshot?: Snapshot
  textQuality?: 'clean' | 'approximate'
  explanation?: Explanation
}

export interface Passage {
  id: string
  title: string
  /** Markdown + LaTeX; admite imágenes `![alt](src){w=.. h=.. mono}`. */
  body: string
  footnotes?: string[]
  source?: string
  questionRange?: [number, number]
}

export interface ExamScoring {
  method: 'official-table' | 'reference-table'
  /** Tabla de transformación: índice = Puntaje P, valor = Puntaje PAES (100–1000). */
  table: number[]
  officialQuestionCount?: number
  officialScorableCount?: number
}

export interface Exam {
  id: string
  subject: SubjectId
  area?: ScienceArea
  title: string
  description: string
  year: number
  modality: Modality
  source: ExamSource
  form?: string
  appliedOn?: string
  durationMinutes: number
  scoring: ExamScoring
  passages: Passage[]
  questions: Question[]
  generatedBy?: string
  generatedAt?: string
}

/** Entrada liviana del catálogo (`src/data/exams/index.json`). */
export interface ExamMeta {
  id: string
  subject: SubjectId
  area?: ScienceArea
  title: string
  description: string
  year: number
  modality: Modality
  source: ExamSource
  questionCount: number
  passageCount: number
  durationMinutes: number
  hasExplanations: boolean
  snapshotCount: number
  axes: string[]
  /** Números de pregunta por eje (para armar prácticas por eje sin cargar el ensayo). */
  axisQuestions: Record<string, number[]>
  /** Números de pregunta por subtema del temario (explorador, drills y Zettelkasten). */
  subtopicQuestions: Record<string, number[]>
  /** Números de las preguntas que traen solución paso a paso. */
  explainedQuestions: number[]
  /** Ruta relativa a src/data/exams (p. ej. `m1/m1-curado-1.json`). */
  file: string
}

/**
 * Práctica personalizada: preguntas de distintos ensayos. Por eje, «revancha» de errores, drill de un subtema
 * (explorador y Zettelkasten) o Desafío Diario.
 */
export interface PracticeSet {
  id: string
  kind: 'eje' | 'revancha' | 'subtema' | 'diario'
  subject: SubjectId
  title: string
  description: string
  createdAt: number
  items: { examId: string; questionId: string }[]
}
