import { cn } from '@/lib/utils'

export function EmptyState({ title, children, action, className }: {
  title: string
  children?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-start gap-2 rounded-xl border border-dashed border-zinc-300/80 px-5 py-6 dark:border-zinc-700/80', className)}>
      <p className="text-[13px] font-medium">{title}</p>
      {children && <div className="max-w-prose text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{children}</div>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
