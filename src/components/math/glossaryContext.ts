import { createContext } from 'react'
import type { GlossaryEntry } from '@/data/glossary'

export interface GlossarySegment {
  text: string
  entry?: GlossaryEntry
}

/** Parte un texto en tramos, marcando los que son términos del glosario. */
export type GlossaryMatcher = (text: string) => GlossarySegment[]

/**
 * Glosario activo para los `MathText` de un área (por ejemplo, la explicación de una pregunta de Ciencias). Fuera de
 * un proveedor vale `null` y el texto se muestra tal cual.
 */
export const GlossaryContext = createContext<GlossaryMatcher | null>(null)

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Arma el buscador una sola vez: todas las formas en una expresión, de la más larga a la más corta. */
export function buildMatcher(entries: readonly GlossaryEntry[]): GlossaryMatcher {
  const byForm = new Map<string, GlossaryEntry>()
  for (const entry of entries) for (const form of entry.forms) byForm.set(form.toLocaleLowerCase('es'), entry)
  const forms = [...byForm.keys()].sort((a, b) => b.length - a.length).map(escape)
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${forms.join('|')})(?![\\p{L}\\p{N}])`, 'giu')
  return (text) => {
    const out: GlossarySegment[] = []
    let last = 0
    for (const match of text.matchAll(pattern)) {
      const entry = byForm.get(match[0].toLocaleLowerCase('es'))
      if (!entry || match.index === undefined) continue
      if (match.index > last) out.push({ text: text.slice(last, match.index) })
      out.push({ text: match[0], entry })
      last = match.index + match[0].length
    }
    if (last < text.length) out.push({ text: text.slice(last) })
    return out
  }
}
