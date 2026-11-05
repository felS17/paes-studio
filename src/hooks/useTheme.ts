import { useEffect, useSyncExternalStore } from 'react'
import { isThemeId, THEME_BY_ID } from '@/data/themes'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { ThemeId } from '@/types/user'

const query = '(prefers-color-scheme: dark)'

function subscribe(cb: () => void) {
  const mql = window.matchMedia(query)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

/**
 * Aplica el tema en <html>: `data-theme` activa sus tokens de color (src/styles/index.css) y la clase `dark` activa
 * las variantes `dark:` de Tailwind. Sin preferencia, sigue al sistema con los dos temas Geist.
 */
export function useTheme() {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const systemDark = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
  const resolved: ThemeId = isThemeId(theme) ? theme : systemDark ? 'geist-dark' : 'geist-light'

  useEffect(() => {
    const root = document.documentElement
    const info = THEME_BY_ID[resolved]
    root.dataset.theme = resolved
    root.classList.toggle('dark', info.dark)
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute('content', info.canvas)
    })
  }, [resolved])

  return { theme, resolved, setTheme }
}
