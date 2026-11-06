import type { UiFontId } from '@/types/user'

export interface UiFontInfo {
  id: UiFontId
  label: string
  hint: string
  /** Para mostrar cada opción con su propia letra en el selector. Las reglas reales viven en src/styles/index.css. */
  stack: string
}

export const DEFAULT_UI_FONT: UiFontId = 'geist'

/** Las 5 tipografías del Inicio y los menús. El ExamRunner usa siempre `geist`. */
export const UI_FONTS: readonly UiFontInfo[] = [
  { id: 'geist', label: 'Geist Sans', hint: 'La de siempre: clara y sobria', stack: "'Geist Variable', 'Geist', sans-serif" },
  { id: 'space-grotesk', label: 'Space Grotesk', hint: 'Geométrica y con más carácter', stack: "'Space Grotesk', sans-serif" },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', hint: 'De editor de código, muy legible', stack: "'JetBrains Mono Variable', 'JetBrains Mono', monospace" },
  { id: 'fira-code', label: 'Fira Code', hint: 'De programador, con trazos abiertos', stack: "'Fira Code', monospace" },
  { id: 'ibm-plex-mono', label: 'IBM Plex Mono', hint: 'Como una máquina de escribir moderna', stack: "'IBM Plex Mono', monospace" },
]

export const UI_FONT_BY_ID = Object.fromEntries(UI_FONTS.map((f) => [f.id, f])) as Record<UiFontId, UiFontInfo>

export const isUiFontId = (value: unknown): value is UiFontId => typeof value === 'string' && value in UI_FONT_BY_ID
