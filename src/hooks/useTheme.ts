import { useEffect, useSyncExternalStore } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'

const query = '(prefers-color-scheme: dark)'

function subscribe(cb: () => void) {
  const mql = window.matchMedia(query)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

/** Aplica la clase `dark` en <html> según la preferencia guardada o la del sistema. */
export function useTheme() {
  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const systemDark = useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false)
  const resolved: 'light' | 'dark' = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute('content', resolved === 'dark' ? '#09090B' : '#FAFAFA')
    })
  }, [resolved])

  return { theme, resolved, setTheme }
}
