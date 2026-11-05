import { useId } from 'react'
import { cn } from '@/lib/utils'

export interface TabItem<T extends string> {
  value: T
  label: string
  /** Cifra opcional junto a la etiqueta (en mono). */
  count?: number
}

/**
 * Pestañas con subrayado (patrón WAI-ARIA tabs, activación automática con ←/→, Inicio y Fin).
 * El contenido de la pestaña activa se pasa como children y queda enlazado a su pestaña.
 */
export function Tabs<T extends string>({ value, onChange, items, label, children, className, listClassName, panelClassName }: {
  value: T
  onChange: (value: T) => void
  items: TabItem<T>[]
  label: string
  children: React.ReactNode
  className?: string
  listClassName?: string
  panelClassName?: string
}) {
  const base = useId()
  const tabId = (v: T) => `${base}-tab-${v}`
  const panelId = `${base}-panel`
  const move = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = items.findIndex((i) => i.value === value)
    const next =
      e.key === 'ArrowRight' ? (idx + 1) % items.length
        : e.key === 'ArrowLeft' ? (idx - 1 + items.length) % items.length
          : e.key === 'Home' ? 0
            : e.key === 'End' ? items.length - 1
              : -1
    if (next < 0) return
    e.preventDefault()
    e.stopPropagation()
    onChange(items[next].value)
    document.getElementById(tabId(items[next].value))?.focus()
  }
  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={move}
        className={cn('-mx-1 flex gap-1 overflow-x-auto border-b border-zinc-200/80 px-1 dark:border-zinc-800/80', listClassName)}
      >
        {items.map((item) => {
          const active = item.value === value
          return (
            <button
              key={item.value}
              id={tabId(item.value)}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(item.value)}
              className={cn(
                '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-2.5 pt-1 pb-2.5 text-[13.5px] font-medium whitespace-nowrap transition-colors duration-150',
                active
                  ? 'border-accent text-zinc-900 dark:text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <span className={cn('font-mono text-[11.5px] tabular-nums', active ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-400 dark:text-zinc-500')}>
                  {item.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <div role="tabpanel" id={panelId} aria-labelledby={tabId(value)} tabIndex={0} className={cn('pt-6 focus-visible:outline-none', panelClassName)}>
        {children}
      </div>
    </div>
  )
}
