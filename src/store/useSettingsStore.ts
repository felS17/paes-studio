import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReaderSettings, ThemePreference, TutorRate, UiFontId, UserSettings } from '@/types/user'
import { persistStorage } from './storage'

interface SettingsState extends UserSettings {
  setTheme: (theme: ThemePreference) => void
  setUiFont: (font: UiFontId) => void
  setNebulaPaused: (paused: boolean) => void
  setTutorRate: (rate: TutorRate) => void
  setReader: (patch: Partial<ReaderSettings>) => void
  setSplitRatio: (ratio: number) => void
  setShowShortcutHints: (value: boolean) => void
  setSidebarCollapsed: (value: boolean) => void
}

export const READER_SIZES = [14, 15, 16, 17, 18, 20, 22] as const

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      uiFont: 'geist',
      nebulaPaused: null,
      tutorRate: 1,
      reader: { font: 'sans', size: 16, paragraphNumbers: true },
      splitRatio: 0.52,
      showShortcutHints: true,
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
      setUiFont: (uiFont) => set({ uiFont }),
      setNebulaPaused: (nebulaPaused) => set({ nebulaPaused }),
      setTutorRate: (tutorRate) => set({ tutorRate }),
      setReader: (patch) => set((s) => ({ reader: { ...s.reader, ...patch } })),
      setSplitRatio: (ratio) => set({ splitRatio: Math.min(0.7, Math.max(0.3, ratio)) }),
      setShowShortcutHints: (value) => set({ showShortcutHints: value }),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
    }),
    {
      name: 'settings',
      storage: persistStorage,
      version: 3,
      migrate: (state, version) => {
        const saved = state as Omit<Partial<SettingsState>, 'theme'> & { theme?: string }
        // Antes de los temas con nombre se guardaba `light` o `dark`.
        const theme = saved.theme === 'light' ? 'geist-light' : saved.theme === 'dark' ? 'geist-dark' : saved.theme
        // Desde la v2.3 la lectura del ensayo parte en la letra normal de examen; el botón Serif/Sans sigue ahí.
        const reader = version < 3 && saved.reader ? { ...saved.reader, font: 'sans' as const } : saved.reader
        return { ...saved, theme: theme ?? 'system', ...(reader && { reader }) } as SettingsState
      },
    },
  ),
)
