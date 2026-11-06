import { useMemo, useState } from 'react'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useStreakStore } from '@/store/useStreakStore'
import { localDateKey } from '@/utils/daily'
import { streakSummary, withAttemptDays } from '@/utils/streak'

/** Tu racha de estudio: lo marcado en vivo más los días en que entregaste un intento. */
export function useStreak() {
  const days = useStreakStore((s) => s.days)
  const attempts = useAnalyticsStore((s) => s.attempts)
  const [today] = useState(() => localDateKey())
  return useMemo(() => streakSummary(withAttemptDays(days, attempts), today), [attempts, days, today])
}
