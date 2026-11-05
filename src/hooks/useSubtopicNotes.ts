import { useEffect, useState } from 'react'
import { loadSubtopicNotes } from '@/data/temario'
import type { SubtopicNote } from '@/types/temario'

/** Notas teóricas de los subtemas, cargadas bajo demanda (null mientras llegan). */
export function useSubtopicNotes(): Record<string, SubtopicNote> | null {
  const [notes, setNotes] = useState<Record<string, SubtopicNote> | null>(null)
  useEffect(() => {
    let alive = true
    loadSubtopicNotes().then((n) => alive && setNotes(n))
    return () => {
      alive = false
    }
  }, [])
  return notes
}
