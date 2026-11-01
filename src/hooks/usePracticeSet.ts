import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExamStore } from '@/store/useExamStore'
import type { PracticeSet } from '@/types/exam'

/** Guarda una práctica personalizada y la abre en modo práctica. */
export function useStartPracticeSet() {
  const createSet = useExamStore((s) => s.createSet)
  const navigate = useNavigate()
  return useCallback(
    (draft: Omit<PracticeSet, 'id' | 'createdAt'>) => {
      if (!draft.items.length) return
      const id = createSet(draft)
      navigate(`/ensayo/${id}?modo=practica`)
    },
    [createSet, navigate],
  )
}
