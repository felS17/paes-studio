import { useEffect, useState } from 'react'

/** Mide el ancho de un elemento con ResizeObserver. Uso: `const [setEl, width] = useElementWidth()`. */
export function useElementWidth(): [(el: HTMLElement | null) => void, number] {
  const [el, setEl] = useState<HTMLElement | null>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  return [setEl, width]
}
