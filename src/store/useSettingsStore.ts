import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReaderSettings, ThemePreference, UserSettings } from '@/types/user'
import { persistStorage } from './storage'

interface SettingsState extends UserSettings {
  setTheme: (theme: ThemePreference) => void
  setReader: (patch: Partial<ReaderSettings>) => void
  setSplitRatio: (ratio: number) => void
  setShowShortcutHints: (value: boolean) => void
}

export const READER_SIZES = [14, 15, 16, 17, 18, 20, 22] as const

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      reader: { font: 'serif', size: 16, paragraphNumbers: true },
      splitRatio: 0.52,
      showShortcutHints: true,
      setTheme: (theme) => set({ theme }),
      setReader: (patch) => set((s) => ({ reader: { ...s.reader, ...patch } })),
      setSplitRatio: (ratio) => set({ splitRatio: Math.min(0.7, Math.max(0.3, ratio)) }),
      setShowShortcutHints: (value) => set({ showShortcutHints: value }),
    }),
    { name: 'settings', storage: persistStorage, version: 1 },
  ),
)
