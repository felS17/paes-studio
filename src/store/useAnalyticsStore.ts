import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AttemptRecord } from '@/types/analytics'
import { persistStorage } from './storage'

interface AnalyticsState {
  attempts: AttemptRecord[]
  addAttempt: (attempt: AttemptRecord) => void
  removeAttempt: (id: string) => void
  /** Devuelve cuántos intentos nuevos se incorporaron. */
  importAttempts: (incoming: AttemptRecord[], strategy: 'merge' | 'replace') => number
  clear: () => void
}

const byDate = (a: AttemptRecord, b: AttemptRecord) => a.finishedAt - b.finishedAt

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      attempts: [],
      addAttempt: (attempt) => set((s) => ({ attempts: [...s.attempts, attempt].sort(byDate) })),
      removeAttempt: (id) => set((s) => ({ attempts: s.attempts.filter((a) => a.id !== id) })),
      importAttempts: (incoming, strategy) => {
        if (strategy === 'replace') {
          set({ attempts: [...incoming].sort(byDate) })
          return incoming.length
        }
        const known = new Set(get().attempts.map((a) => a.id))
        const fresh = incoming.filter((a) => !known.has(a.id))
        set((s) => ({ attempts: [...s.attempts, ...fresh].sort(byDate) }))
        return fresh.length
      },
      clear: () => set({ attempts: [] }),
    }),
    { name: 'analytics', storage: persistStorage, version: 1 },
  ),
)
