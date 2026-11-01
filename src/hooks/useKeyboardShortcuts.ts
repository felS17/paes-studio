import { useEffect, useRef } from 'react'

export type ShortcutMap = Record<string, (event: KeyboardEvent) => void>

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
}

/**
 * Atajos globales. Las claves son `event.key` normalizadas a minúscula para letras
 * (`a`…`e`, `f`, `arrowleft`, `arrowright`, `enter`, `?`). Se ignoran mientras se escribe en un campo,
 * con modificadores (Ctrl/Cmd/Alt) o cuando hay un diálogo abierto.
 */
export function useKeyboardShortcuts(map: ShortcutMap, enabled = true) {
  const ref = useRef(map)
  useEffect(() => {
    ref.current = map
  })
  useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return
      if (isTypingTarget(event.target)) return
      if (document.querySelector('[role="dialog"][data-state="open"]')) return
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase()
      const handler = ref.current[key]
      if (!handler) return
      // Enter sobre un botón enfocado mantiene su comportamiento nativo.
      if (key === 'enter' && event.target instanceof HTMLButtonElement && !event.target.dataset.shortcutPassthrough) return
      event.preventDefault()
      handler(event)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
