import { lazy, Suspense, useEffect, useRef } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { useInspectorStore } from '@/store/useInspectorStore'

// KaTeX, notas y mazos se descargan recién al abrir el Inspector por primera vez.
const InspectorContent = lazy(() => import('./InspectorContent').then((m) => ({ default: m.InspectorContent })))

function Body() {
  return (
    <Suspense fallback={<p className="p-5 text-[13px] text-zinc-500" role="status">Cargando…</p>}>
      <InspectorContent />
    </Suspense>
  )
}

const WIDTH = 'w-[clamp(22rem,38vw,38rem)]'

/** Panel a la derecha del área de trabajo en escritorio (vista dividida); hoja completa en pantallas angostas. */
export function Inspector() {
  const isOpen = useInspectorStore((s) => s.isOpen)
  const close = useInspectorStore((s) => s.closeInspector)
  const desktop = useMediaQuery('(min-width: 1024px)')
  const panelRef = useRef<HTMLDivElement>(null)

  // Al abrir, el foco pasa al panel; al cerrar, vuelve al botón que lo abrió.
  useEffect(() => {
    if (!isOpen || !desktop) return
    const previous = document.activeElement
    panelRef.current?.focus()
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [desktop, isOpen])

  useKeyboardShortcuts({ escape: close }, isOpen && desktop)

  if (!desktop) {
    return (
      <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && close()}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-zinc-950/25 data-[state=open]:animate-fade-in dark:bg-black/50" />
          <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-40 flex w-full flex-col bg-white data-[state=open]:animate-fade-in sm:w-[28rem] sm:border-l sm:border-zinc-200/80 dark:bg-[#121215] sm:dark:border-zinc-800/80">
            <DialogPrimitive.Title className="sr-only">Resumen del tema</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Resumen, guía en PDF y tarjetas del tema elegido</DialogPrimitive.Description>
            <Body />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    )
  }

  return (
    <aside
      aria-label="Resumen del tema"
      inert={!isOpen}
      className={cn('h-full shrink-0 overflow-hidden bg-white transition-[width] duration-200 ease-out dark:bg-[#121215]', isOpen ? cn(WIDTH, 'border-l border-zinc-200/80 dark:border-zinc-800/80') : 'w-0')}
    >
      <div ref={panelRef} tabIndex={-1} data-shortcuts-ignore className={cn('flex h-full flex-col outline-none', WIDTH)}>
        {isOpen && <Body />}
      </div>
    </aside>
  )
}
