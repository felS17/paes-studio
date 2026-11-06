import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { sessionKey, useExamStore } from '@/store/useExamStore'
import { useStreakStore } from '@/store/useStreakStore'
import { dailyDraft, dailyPicks, dailySetId, localDateKey } from '@/utils/daily'

/**
 * Atajo al Desafío del Día desde el Inicio: lo empieza, lo retoma o, si hoy ya está listo, lleva a su resultado en vez
 * de repetirlo. El nombre del botón siempre dice qué va a pasar.
 */
export function useDailyAction() {
  const navigate = useNavigate()
  const [today] = useState(() => localDateKey())
  const setId = dailySetId(today)
  const ensureSet = useExamStore((s) => s.ensureSet)
  const session = useExamStore((s) => s.sessions[sessionKey(setId, 'practica')])
  const done = useStreakStore((s) => Boolean(s.days[today]?.challenge))

  const run = useCallback(() => {
    const attempt = useAnalyticsStore.getState().attempts.findLast((a) => a.examId === setId)
    if (done && !session && attempt) {
      navigate(`/resultados/${attempt.id}`)
      return
    }
    if (!dailyPicks(today).length) return
    ensureSet(setId, dailyDraft(today))
    navigate(`/ensayo/${setId}?modo=practica`)
  }, [done, ensureSet, navigate, session, setId, today])

  const answered = session ? Object.keys(session.answers).length : 0
  const label = session ? `Continuar Desafío (${answered}/3)` : done ? 'Ver Desafío de hoy' : 'Desafío Diario (3 preg)'
  return { run, label }
}
