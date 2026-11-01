/** Dominio: entradas de latex/output/manifest.json (compendios y presentaciones generados). */
import type { SubjectId } from './exam'

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
