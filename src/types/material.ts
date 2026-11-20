/** Dominio: entradas de latex/output/manifest.json (compendios y presentaciones generados). */
import type { Explanation, OptionKey, QuestionOption, SubjectId } from './exam'

export interface ManifestAxis {
  name: string
  subtopics: string[]
}

export interface ManifestEntry {
  subject: SubjectId
  kind: 'guia' | 'beamer'
  file: string
  title: string
  axes: ManifestAxis[]
  subtopics: number
  /** Solo guías. */
  examples?: number
  /** Solo presentaciones. */
  slides?: number
  includes: string[]
}

/** Guía de ejercicios resueltos de un subtema (src/data/guides.json, generada por build_guides.py). */
export interface SolvedExercise {
  stem: string
  options: QuestionOption[]
  answer: OptionKey
  explanation: Explanation
}

export interface SolvedGuide {
  id: string
  subject: SubjectId
  subtopic: string
  axis: string
  title: string
  /** Lo que se repite en las pruebas oficiales sobre este tema, en pocas palabras. */
  pattern: string
  /** Preguntas oficiales del banco en este subtema. */
  officialCount: number
  exercises: SolvedExercise[]
}
