import { cn } from '@/lib/utils'

export interface SegmentOption<T extends string> {
  value: T
  label: React.ReactNode
  title?: string
}

/** Control segmentado (radiogroup) para filtros y preferencias. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = 'md',
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: SegmentOption<T>[]
  label: string
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-zinc-200/80 bg-zinc-100/60 p-0.5 dark:border-zinc-800/80 dark:bg-zinc-900/60',
        className,
      )}
      onKeyDown={(e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
        e.preventDefault()
        e.stopPropagation()
        const idx = options.findIndex((o) => o.value === value)
        const next = options[(idx + (e.key === 'ArrowRight' ? 1 : options.length - 1)) % options.length]
        onChange(next.value)
        const el = e.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next.value}"]`)
        el?.focus()
      }}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-value={o.value}
            title={o.title}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-md font-medium transition-colors duration-150',
              size === 'sm' ? 'h-6 px-2 text-[11px]' : 'h-7 px-2.5 text-xs',
              active
                ? 'bg-white text-zinc-900 shadow-[0_0_0_1px_rgba(24,24,27,0.08)] dark:bg-zinc-800 dark:text-zinc-100 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06)]'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
