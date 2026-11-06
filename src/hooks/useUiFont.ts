import { useLayoutEffect } from 'react'
import { DEFAULT_UI_FONT, isUiFontId } from '@/data/fonts'
import { useExamRoute } from '@/hooks/useWorkspace'
import { useSettingsStore } from '@/store/useSettingsStore'

/**
 * Aplica la tipografía de interfaz en <html>. Con un ExamRunner en pantalla vuelve siempre a Geist: un ensayo se lee
 * como un examen formal, incluidos sus diálogos, que viven fuera del árbol del ExamRunner. `useLayoutEffect` hace el
 * cambio antes de pintar, para que la pregunta nunca aparezca con la letra del Inicio.
 */
export function useUiFont() {
  const saved = useSettingsStore((s) => s.uiFont)
  const { running } = useExamRoute()
  const font = !running && isUiFontId(saved) ? saved : DEFAULT_UI_FONT
  useLayoutEffect(() => {
    document.documentElement.dataset.font = font
  }, [font])
}
