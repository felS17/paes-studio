import { cn } from '@/lib/utils'

/** Tecla física. Mismo estilo que el badge de las alternativas A–E. */
export function Kbd({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-zinc-200 bg-zinc-50 px-1 font-mono text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400',
        className,
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}
