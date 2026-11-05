import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Buscador instantáneo: filtra mientras escribes; Esc o la X lo limpian. */
export function SearchInput({ value, onChange, placeholder, label, className }: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-zinc-400" />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.stopPropagation()
            onChange('')
          }
        }}
        className="h-8 w-full rounded-lg border border-zinc-200/80 bg-surface pr-8 pl-8 text-[13px] text-zinc-900 transition-colors placeholder:text-zinc-400 hover:border-zinc-300 dark:border-zinc-800/80 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:hover:border-zinc-700"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
