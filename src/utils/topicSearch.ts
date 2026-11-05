import { SUBTOPICS } from '@/data/temario'
import type { SubtopicNote } from '@/types/temario'

/** Minúsculas, sin tildes y sin marcas de LaTeX: «Pitágoras» y `$\Delta$` se encuentran escribiendo «pitagoras» y «delta». */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\\$^_{}]/g, ' ')
    .toLowerCase()
}

export const queryTerms = (query: string) => normalizeText(query).split(/\s+/).filter(Boolean)

/** Todas las palabras de la búsqueda deben aparecer, en cualquier orden. */
export const matchesTerms = (haystack: string, terms: string[]) => terms.every((t) => haystack.includes(t))

/** Texto buscable de cada tema: título y eje, más sus notas cuando ya cargaron (para hallarlo por concepto). */
export function buildTopicIndex(notes: Record<string, SubtopicNote> | null): Map<string, string> {
  return new Map(
    SUBTOPICS.map((s) => {
      const note = notes?.[s.id]
      const parts = [s.title, s.axis]
      if (note) parts.push(note.box.title, note.box.body, ...note.keyIdeas, ...note.theory)
      return [s.id, normalizeText(parts.join(' '))]
    }),
  )
}
