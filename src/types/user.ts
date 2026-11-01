/** Dominio: preferencias locales del estudiante. */

export type ThemePreference = 'light' | 'dark' | 'system'
export type ReaderFont = 'serif' | 'sans'

export interface ReaderSettings {
  font: ReaderFont
  /** Tamaño base del texto de lectura en px. */
  size: number
  paragraphNumbers: boolean
}

export interface UserSettings {
  theme: ThemePreference
  reader: ReaderSettings
  /** Proporción del panel de lectura en la vista dividida (0.3–0.7). */
  splitRatio: number
  showShortcutHints: boolean
}
