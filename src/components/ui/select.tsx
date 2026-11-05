import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Selector nativo (accesible y liviano) con la piel del sistema. */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className={cn('relative inline-flex', className)}>
      <select
        ref={ref}
        className="h-8 w-full appearance-none rounded-lg border border-zinc-200/80 bg-surface pr-8 pl-2.5 text-xs font-medium text-zinc-900 transition-colors hover:border-zinc-300 dark:border-zinc-800/80 dark:text-zinc-100 dark:hover:border-zinc-700"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-zinc-400" aria-hidden />
    </div>
  ),
)
Select.displayName = 'Select'
