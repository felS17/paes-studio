import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { PixelIcon } from '@/components/icons/PixelIcon'
import { Button } from '@/components/ui/button'
import { EXAMS_BY_ID } from '@/data/catalog'
import { useSidebar } from '@/hooks/useWorkspace'
import { cn } from '@/lib/utils'
import { useExamStore } from '@/store/useExamStore'
import { useStreakStore } from '@/store/useStreakStore'
import { localDateKey } from '@/utils/daily'
import { streakSummary } from '@/utils/streak'
import { Logo, LogoMark } from './Logo'
import { DOCK_ACTIVE, DOCK_IDLE, DOCK_ITEM, DOCK_RAIL, NAV_ITEMS, SIDEBAR_SHORTCUT } from './nav'
import { ThemeToggle } from './ThemeToggle'

/** `retomar`: un clic para volver al ensayo o la práctica más reciente. Sin nada en curso, no ocupa lugar. */
function ResumeItem({ rail }: { rail: boolean }) {
  const sessions = useExamStore((s) => s.sessions)
  const sets = useExamStore((s) => s.sets)
  const session = Object.values(sessions)
    .filter((s) => EXAMS_BY_ID.has(s.examId) || sets[s.examId])
    .sort((a, b) => b.updatedAt - a.updatedAt)[0]
  if (!session) return null

  const meta = EXAMS_BY_ID.get(session.examId)
  const set = sets[session.examId]
  const total = meta?.questionCount ?? set!.items.length
  const answered = Object.keys(session.answers).length
  const name = set?.kind === 'diario' ? 'desafío del día' : meta?.title ?? set!.title
  const title = `retomar ${name}: ${answered} de ${total}`
  return (
    <Link
      to={`/ensayo/${session.examId}?modo=${session.mode}`}
      title={title}
      aria-label={title}
      className={cn(DOCK_ITEM, DOCK_IDLE, rail && DOCK_RAIL)}
    >
      <PixelIcon name="play" />
      {!rail && (
        <>
          retomar
          <span className="ml-auto text-[11px] tabular-nums">{answered}/{total}</span>
        </>
      )}
    </Link>
  )
}

/** `racha`: días seguidos de estudio, siempre a la vista. */
function StreakItem({ rail }: { rail: boolean }) {
  const [today] = useState(() => localDateKey())
  const days = useStreakStore((s) => s.days)
  const { current } = streakSummary(days, today)
  const title = `racha de estudio: ${current} ${current === 1 ? 'día' : 'días'}`
  return (
    <Link to="/" title={title} aria-label={title} className={cn(DOCK_ITEM, DOCK_IDLE, rail && DOCK_RAIL)}>
      <PixelIcon name="flame" />
      {!rail && (
        <>
          racha
          <span className="ml-auto text-zinc-900 tabular-nums dark:text-zinc-100">{current}</span>
        </>
      )}
    </Link>
  )
}

function DockBody({ rail, header }: { rail: boolean; header: React.ReactNode }) {
  const padding = rail ? 'px-3' : 'px-2.5'
  return (
    <>
      {header}
      <nav className={cn('mt-4 min-h-0 flex-1 space-y-0.5 overflow-x-hidden overflow-y-auto', padding)} aria-label="Principal">
        {NAV_ITEMS.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={rail ? label : undefined}
            aria-label={rail ? label : undefined}
            className={({ isActive }) => cn(DOCK_ITEM, isActive ? DOCK_ACTIVE : DOCK_IDLE, rail && DOCK_RAIL)}
          >
            {({ isActive }) => (
              <>
                {isActive && <span aria-hidden className="absolute top-1.5 bottom-1.5 -left-2 w-0.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />}
                <PixelIcon name={icon} />
                {!rail && label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className={cn('mt-3 space-y-0.5 border-t border-zinc-200/80 pt-3 dark:border-zinc-800/80', padding)}>
        <ResumeItem rail={rail} />
        <ThemeToggle compact={rail} />
        <StreakItem rail={rail} />
      </div>
    </>
  )
}

const SURFACE = 'border-zinc-200/80 bg-canvas dark:border-zinc-800/80'

/**
 * Barra de tareas: columna fija y colapsable a íconos en escritorio, cajón en pantallas angostas y oculta durante un
 * ensayo cronometrado (Modo Zen) hasta que el estudiante la despliegue.
 */
export function Sidebar() {
  const { state, desktop, toggle, drawerOpen, setDrawerOpen } = useSidebar()

  if (!desktop) {
    return (
      <DialogPrimitive.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/25 data-[state=open]:animate-fade-in dark:bg-black/50" />
          <DialogPrimitive.Content
            className={cn('fixed inset-y-0 left-0 z-50 flex w-[min(14rem,calc(100vw-3rem))] flex-col border-r py-3 data-[state=open]:animate-fade-in', SURFACE)}
            // Cualquier enlace del cajón lo cierra al navegar.
            onClick={(e) => {
              if ((e.target as Element).closest('a')) setDrawerOpen(false)
            }}
          >
            <DialogPrimitive.Title className="sr-only">Menú</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Secciones de PAES Studio</DialogPrimitive.Description>
            <DockBody
              rail={false}
              header={
                <div className="flex h-8 items-center justify-between px-3.5">
                  <Logo />
                  <DialogPrimitive.Close asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Cerrar menú"><PixelIcon name="close" /></Button>
                  </DialogPrimitive.Close>
                </div>
              }
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    )
  }

  const rail = state === 'rail'
  const hidden = state === 'hidden'
  const toggleLabel = `${rail ? 'Expandir' : 'Achicar'} barra (${SIDEBAR_SHORTCUT})`
  return (
    <aside
      inert={hidden}
      className={cn(
        'h-full shrink-0 overflow-hidden transition-[width] duration-200 ease-out',
        hidden ? 'w-0' : rail ? 'w-14 border-r' : 'w-44 border-r',
        SURFACE,
      )}
    >
      <div className={cn('flex h-full flex-col py-3', rail ? 'w-14' : 'w-44')}>
        <DockBody
          rail={rail}
          header={
            rail ? (
              <div className="flex flex-col items-center gap-2 px-3">
                <Link to="/" aria-label="PAES Studio, inicio" className="rounded-md"><LogoMark /></Link>
                <Button variant="ghost" size="icon" onClick={toggle} title={toggleLabel} aria-label={toggleLabel}><PixelIcon name="chevron-right" /></Button>
              </div>
            ) : (
              <div className="flex h-8 items-center justify-between pr-2 pl-3">
                <Logo />
                <Button variant="ghost" size="icon-sm" onClick={toggle} title={toggleLabel} aria-label={toggleLabel}><PixelIcon name="chevron-left" /></Button>
              </div>
            )
          }
        />
      </div>
    </aside>
  )
}
