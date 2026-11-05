import { useCallback, useEffect, useRef } from 'react'
import { useExamStore } from '@/store/useExamStore'

const noop = () => {}

/**
 * Reloj silencioso de la pregunta visible: suma tiempo solo con la pestaña visible y lo guarda al cambiar de
 * pregunta, al ocultar la pestaña, al salir y cada 10 s. Devuelve una función para guardar lo pendiente de
 * inmediato (antes de corregir el intento).
 */
export function useQuestionClock(sessionKey: string, questionId: string, running: boolean) {
  const addQuestionTime = useExamStore((s) => s.addQuestionTime)
  const flushRef = useRef<() => void>(noop)

  useEffect(() => {
    if (!running) return
    let last = document.visibilityState === 'visible' ? performance.now() : null
    const flush = () => {
      if (last === null) return
      const now = performance.now()
      addQuestionTime(sessionKey, questionId, now - last)
      last = now
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        flush()
        last = null
      } else {
        last = performance.now()
      }
    }
    flushRef.current = flush
    const id = window.setInterval(flush, 10_000)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
      flush()
      flushRef.current = noop
    }
  }, [addQuestionTime, questionId, running, sessionKey])

  return useCallback(() => flushRef.current(), [])
}
