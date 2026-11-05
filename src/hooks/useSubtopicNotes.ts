import { useEffect, useState } from 'react'
import { loadSubtopicNotes } from '@/data/temario'
import type { SubtopicNote } from '@/types/temario'

/** Notas teóricas de los subtemas, cargadas bajo demanda (null mientras llegan o mientras `enabled` sea falso). */
export function useSubtopicNotes(enabled = true): Record<string, SubtopicNote> | null {
  const [notes, setNotes] = useState<Record<string, SubtopicNote> | null>(null)
  useEffect(() => {
    if (!enabled) return
    let alive = true
    loadSubtopicNotes().then((n) => alive && setNotes(n))
    return () => {
      alive = false
    }
  }, [enabled])
  return notes
}
