import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { sessionKey, useExamStore } from '@/store/useExamStore'
import { useStreakStore } from '@/store/useStreakStore'
import { dailyDraft, dailyPicks, dailySetId, localDateKey } from '@/utils/daily'

/** Comando `daily`: empieza o retoma el Desafío del Día; si hoy ya está listo, lleva a su resultado en vez de repetirlo. */
export function useDailyAction() {
  const navigate = useNavigate()
  const [today] = useState(() => localDateKey())
  const ensureSet = useExamStore((s) => s.ensureSet)

  return useCallback(() => {
    const setId = dailySetId(today)
    const session = useExamStore.getState().sessions[sessionKey(setId, 'practica')]
    const done = Boolean(useStreakStore.getState().days[today]?.challenge)
    const attempt = useAnalyticsStore.getState().attempts.findLast((a) => a.examId === setId)
    if (done && !session && attempt) {
      navigate(`/resultados/${attempt.id}`)
      return
    }
    if (!dailyPicks(today).length) return
    ensureSet(setId, dailyDraft(today))
    navigate(`/ensayo/${setId}?modo=practica`)
  }, [ensureSet, navigate, today])
}
