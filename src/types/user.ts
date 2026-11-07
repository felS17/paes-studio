/** Dominio: preferencias locales del estudiante. */

export type ThemeId =
  | 'github-dark'
  | 'catppuccin-mocha'
  | 'tokyo-night'
  | 'gruvbox-dark'
  | 'nord'
  | 'rose-pine'
  | 'dracula'
  | 'geist-dark'
  | 'geist-light'
  | 'paper'
/** `system` sigue al dispositivo con los dos temas Geist. */
export type ThemePreference = ThemeId | 'system'
export type ReaderFont = 'serif' | 'sans'
export type TutorRate = 1 | 1.25 | 1.5
/** Tipografía del Inicio y los menús. El ExamRunner la ignora: ver `useUiFont`. */
export type UiFontId = 'geist' | 'space-grotesk' | 'jetbrains-mono' | 'fira-code' | 'ibm-plex-mono'

export interface ReaderSettings {
  font: ReaderFont
  /** Tamaño base del texto de lectura en px. */
  size: number
  paragraphNumbers: boolean
}

export interface UserSettings {
  /** Alias del estudiante en la ventana del Inicio. Sin definir, la sesión se llama `paes`. */
  userName: string | null
  theme: ThemePreference
  uiFont: UiFontId
  /** Velocidad del tutor de voz. */
  tutorRate: TutorRate
  /** Nebulosa del Inicio: `null` sigue a la preferencia de movimiento reducido del dispositivo. */
  nebulaPaused: boolean | null
  reader: ReaderSettings
  /** Proporción del panel de lectura en la vista dividida (0.3–0.7). */
  splitRatio: number
  showShortcutHints: boolean
  /** Barra lateral reducida a íconos (escritorio). */
  sidebarCollapsed: boolean
}
