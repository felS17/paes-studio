import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import type { GlossaryEntry } from '@/data/glossary'

const WIDTH = 260

/**
 * Término del glosario dentro de un texto: subrayado punteado; al tocarlo (o con Enter) muestra su definición corta.
 * Se cierra al tocar fuera, con Esc o al desplazar la vista.
 */
export function GlossaryTerm({ text, entry }: { text: string; entry: GlossaryEntry }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const button = useRef<HTMLButtonElement>(null)
  const tip = useRef<HTMLSpanElement>(null)
  const id = useId()

  useLayoutEffect(() => {
    if (!open || !button.current) return
    const r = button.current.getBoundingClientRect()
    const height = tip.current?.offsetHeight ?? 80
    const below = r.bottom + 6 + height < window.innerHeight
    setPos({
      top: below ? r.bottom + 6 : Math.max(8, r.top - 6 - height),
      left: Math.min(Math.max(8, r.left), window.innerWidth - WIDTH - 8),
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const close = (e: Event) => {
      if (e.type === 'pointerdown' && (button.current?.contains(e.target as Node) || tip.current?.contains(e.target as Node))) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', close)
    document.addEventListener('scroll', close, true)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('scroll', close, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
        className="cursor-help rounded-sm underline decoration-zinc-400 decoration-dotted underline-offset-[3px] transition-colors hover:decoration-accent focus-visible:decoration-accent dark:decoration-zinc-500"
        style={{ font: 'inherit', color: 'inherit', padding: 0, letterSpacing: 'inherit' }}
      >
        {text}
      </button>
      {open && (
        <span
          ref={tip}
          id={id}
          role="tooltip"
          className="fixed z-50 block rounded-lg border border-zinc-200/80 bg-surface px-3 py-2 text-left text-[12.5px] leading-snug font-normal normal-case shadow-[0_6px_24px_rgba(0,0,0,0.12)] dark:border-zinc-800/80"
          style={{ width: WIDTH, maxWidth: 'calc(100vw - 16px)', top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}
        >
          <span className="block font-medium text-zinc-900 dark:text-zinc-100">{entry.term}</span>
          <span className="mt-0.5 block text-zinc-600 dark:text-zinc-300">{entry.definition}</span>
        </span>
      )}
    </>
  )
}
