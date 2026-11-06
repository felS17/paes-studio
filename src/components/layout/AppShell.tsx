import { Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PanelRight } from 'lucide-react'
import { PixelIcon } from '@/components/icons/PixelIcon'
import { Inspector } from '@/components/inspector/Inspector'
import { Button } from '@/components/ui/button'
import { useUiFont } from '@/hooks/useUiFont'
import { useExamRoute, useSidebar } from '@/hooks/useWorkspace'
import { cn } from '@/lib/utils'
import { useInspectorStore } from '@/store/useInspectorStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { AppearanceDialog } from './AppearanceDialog'
import { Breadcrumbs } from './Breadcrumbs'
import { useCrumbs } from './crumbs'
import { Footer } from './Footer'
import { Sidebar } from './Sidebar'
import { StatusBar } from './StatusBar'

function Loading() {
  return (
    <div className="flex min-h-[40vh] flex-1 items-center justify-center text-[13px] text-zinc-500" role="status">
      Cargando…
    </div>
  )
}

/**
 * Cabecera contextual: dónde estás y, si consultaste algo, cómo volver a verlo. En escritorio la barra de tareas ya
 * dice en qué vista estás, así que solo aparece cuando entraste a algo o hay un resumen abierto.
 */
function StageHeader() {
  const { desktop, toggle } = useSidebar()
  const crumbs = useCrumbs()
  const hasTarget = useInspectorStore((s) => s.target !== null)
  const isOpen = useInspectorStore((s) => s.isOpen)
  const reopen = useInspectorStore((s) => s.reopen)
  const close = useInspectorStore((s) => s.closeInspector)
  if (desktop && crumbs.length < 2 && !hasTarget) return null
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-200/80 px-3 sm:px-4 lg:px-5 dark:border-zinc-800/80">
      {!desktop && (
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Abrir menú"><PixelIcon name="menu" /></Button>
      )}
      <Breadcrumbs crumbs={crumbs} />
      {hasTarget && (
        <Button
          variant="ghost"
          size="icon"
          className={cn('ml-auto', isOpen && 'text-zinc-900 dark:text-zinc-100')}
          aria-pressed={isOpen}
          onClick={isOpen ? close : reopen}
          title={isOpen ? 'Cerrar el resumen' : 'Volver a abrir el resumen'}
          aria-label={isOpen ? 'Cerrar el resumen' : 'Volver a abrir el resumen'}
        >
          <PanelRight />
        </Button>
      )}
    </header>
  )
}

/**
 * App Shell del espacio de trabajo: barra lateral, área de trabajo con desplazamiento propio e Inspector a la
 * derecha, más la barra de estado abajo. El ExamRunner ocupa toda el área (trae su propia cabecera y pie), oculta la
 * barra de estado, usa siempre la letra normal de examen y en ensayo cronometrado activa el Modo Zen y bloquea el
 * Inspector.
 */
export function AppShell() {
  const { pathname } = useLocation()
  const { running, timed } = useExamRoute()
  const { toggle } = useSidebar()
  const setLocked = useInspectorStore((s) => s.setLocked)
  const setZenExpanded = useWorkspaceStore((s) => s.setZenExpanded)
  const stageRef = useRef<HTMLElement>(null)
  useUiFont()

  // El desplazamiento vive en el área de trabajo: cada vista nueva parte desde arriba.
  useEffect(() => {
    stageRef.current?.scrollTo({ top: 0 })
  }, [pathname])

  useEffect(() => {
    setLocked(timed)
    if (!timed) setZenExpanded(false)
  }, [setLocked, setZenExpanded, timed])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle])

  return (
    // `relative` aquí y en <main>: sin él, los hijos absolutos (como `sr-only`) escapan del recorte y estiran la ventana.
    <div className="relative flex h-dvh flex-col overflow-hidden bg-canvas">
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          {!running && <StageHeader />}
          <div className="flex min-h-0 flex-1">
            <main
              ref={stageRef}
              className={cn('relative flex min-h-0 min-w-0 flex-1 flex-col', running ? 'overflow-hidden' : 'overflow-y-auto')}
            >
              <div
                className={cn(
                  'flex w-full flex-1 flex-col',
                  running ? 'min-h-0' : 'mx-auto px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-8',
                  // Solo el Inicio aprovecha los monitores grandes: 1480 px de ventana más el margen lateral.
                  !running && (pathname === '/' ? 'max-w-[1560px]' : 'max-w-[1280px]'),
                )}
              >
                <Suspense fallback={<Loading />}>
                  <Outlet />
                </Suspense>
              </div>
              {!running && pathname !== '/' && <Footer />}
            </main>
            <Inspector />
          </div>
        </div>
      </div>
      {!running && <StatusBar />}
      <AppearanceDialog />
    </div>
  )
}

export function PageHeader({ title, description, actions }: {
  title: string
  description?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[20px] font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
