import * as React from 'react'
import { cn } from '@/lib/utils'

/** Superficie base: fondo blanco / #121215 con hairline de 1px. */
export const Panel = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-xl border border-zinc-200/80 bg-surface dark:border-zinc-800/80', className)}
      {...props}
    />
  ),
)
Panel.displayName = 'Panel'

export function PanelHeader({ className, title, description, actions }: {
  className?: string
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800/80', className)}>
      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  )
}
