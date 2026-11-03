/** Dominio: temario DEMRE (asignatura → eje temático → subtema), generado por scripts/pipeline/assign_subtopics.py. */
import type { SubjectId } from './exam'

export interface TemarioSubtopicEntry {
  id: string
  title: string
  /** Página del subtema en el compendio PDF de la asignatura. */
  pdfPage?: number
  /** Preguntas del banco asignadas a este subtema. */
  questionCount: number
}

export interface TemarioAxisEntry {
  name: string
  description: string
  subtopics: TemarioSubtopicEntry[]
}

export interface TemarioSubjectEntry {
  subject: SubjectId
  name: string
  /** Compendio compilado de la asignatura (public/pdfs). */
  pdf: string
  axes: TemarioAxisEntry[]
}

export interface TemarioIndex {
  subjects: TemarioSubjectEntry[]
}

/** Subtema aplanado, con su asignatura y eje. */
export interface Subtopic extends TemarioSubtopicEntry {
  subject: SubjectId
  axis: string
  pdf: string
}

/** Nota teórica de un subtema (Markdown + LaTeX), cargada bajo demanda. */
export interface SubtopicNote {
  theory: string[]
  box: { kind: 'formula' | 'definicion' | 'mecanismo' | 'ley'; title: string; body: string }
  keyIdeas: string[]
  method: string[]
  traps: string[]
}
