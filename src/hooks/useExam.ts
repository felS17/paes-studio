import { useEffect, useState } from 'react'
import { loadExam } from '@/data/catalog'
import type { Exam } from '@/types/exam'

type State = { id: string; exam?: Exam; error?: string }

/** Carga diferida de un ensayo completo (chunk JSON propio). */
export function useExam(id: string | undefined) {
  const [state, setState] = useState<State | null>(null)
  useEffect(() => {
    if (!id) return
    let alive = true
    loadExam(id).then(
      (exam) => alive && setState({ id, exam }),
      (err: unknown) => alive && setState({ id, error: err instanceof Error ? err.message : String(err) }),
    )
    return () => {
      alive = false
    }
  }, [id])
  if (!id) return { exam: undefined, error: 'Falta el identificador del ensayo.', loading: false }
  const current = state?.id === id ? state : null
  return { exam: current?.exam, error: current?.error, loading: !current }
}
