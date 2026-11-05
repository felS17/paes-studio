import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { title: React.ReactNode; description?: React.ReactNode }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/30 backdrop-blur-[2px] data-[state=open]:animate-fade-in dark:bg-black/60" />
      <DialogPrimitive.Content
        className={cn(
          'fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200/80 bg-surface p-5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] data-[state=open]:animate-fade-in dark:border-zinc-800/80',
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Title className="text-[15px] font-semibold tracking-tight">{title}</DialogPrimitive.Title>
        {description ? (
          <DialogPrimitive.Description className="mt-1.5 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </DialogPrimitive.Description>
        ) : (
          <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
        )}
        {children}
        <DialogPrimitive.Close
          className="absolute top-3.5 right-3.5 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:hover:bg-zinc-100/[0.06] dark:hover:text-zinc-100"
          aria-label="Cerrar"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

/** Panel lateral derecho (hoja de respuestas en pantallas medianas y pequeñas). */
export function SheetContent({
  className,
  children,
  title,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { title: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/25 data-[state=open]:animate-fade-in dark:bg-black/50" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-[min(20rem,calc(100vw-3rem))] flex-col border-l border-zinc-200/80 bg-surface data-[state=open]:animate-fade-in dark:border-zinc-800/80',
          className,
        )}
        {...props}
      >
        <div className="flex h-12 items-center justify-between border-b border-zinc-200/80 px-4 dark:border-zinc-800/80">
          <DialogPrimitive.Title className="text-[13px] font-semibold tracking-tight">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">{title}</DialogPrimitive.Description>
          <DialogPrimitive.Close
            className="rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
