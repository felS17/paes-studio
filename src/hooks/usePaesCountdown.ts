import { useEffect, useState } from 'react'
import { paesCountdown } from '@/utils/paesCountdown'

/** Cuenta regresiva a la próxima PAES. Muestra minutos, así que basta con refrescarla cada 15 segundos. */
export function usePaesCountdown() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(timer)
  }, [])
  return paesCountdown(now)
}
