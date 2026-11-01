import { useEffect, useRef, useState } from 'react'
import { useExamStore } from '@/store/useExamStore'

interface Options {
  sessionKey: string
  /** Límite en ms (modo ensayo). `null` = cronómetro ascendente (modo práctica). */
  limitMs: number | null
  running: boolean
  onExpire?: () => void
}

/**
 * Cronómetro persistente: acumula tiempo solo mientras la pestaña está visible y lo guarda en el store
 * cada 10 s, al ocultar la pestaña y al desmontar.
 */
export function useExamTimer({ sessionKey, limitMs, running, onExpire }: Options) {
  const addElapsed = useExamStore((s) => s.addElapsed)
  const stored = useExamStore((s) => s.sessions[sessionKey]?.elapsedMs ?? 0)
  const [pending, setPending] = useState(0)
  const pendingRef = useRef(0)
  const lastTick = useRef<number | null>(null)
  const expireRef = useRef(onExpire)
  const expired = useRef(false)

  useEffect(() => {
    expireRef.current = onExpire
  })

  useEffect(() => {
    if (!running) return
    const flush = () => {
      if (pendingRef.current > 0) {
        addElapsed(sessionKey, pendingRef.current)
        pendingRef.current = 0
        setPending(0)
      }
    }
    const tick = () => {
      const now = performance.now()
      if (document.visibilityState === 'visible' && lastTick.current !== null) {
        pendingRef.current += now - lastTick.current
        setPending(pendingRef.current)
      }
      lastTick.current = now
      if (pendingRef.current >= 10_000) flush()
    }
    lastTick.current = performance.now()
    const id = window.setInterval(tick, 250)
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        tick()
        flush()
      } else {
        lastTick.current = performance.now()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
      tick()
      flush()
      lastTick.current = null
    }
  }, [running, sessionKey, addElapsed])

  const elapsedMs = stored + pending
  const remainingMs = limitMs === null ? null : Math.max(0, limitMs - elapsedMs)

  useEffect(() => {
    if (running && remainingMs === 0 && !expired.current) {
      expired.current = true
      expireRef.current?.()
    }
  }, [remainingMs, running])

  return { elapsedMs, remainingMs }
}
