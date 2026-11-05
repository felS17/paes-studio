import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SubjectMono } from '@/components/ui/subject-tag'
import { EXAMS_BY_ID } from '@/data/catalog'
import { subjectLabel } from '@/data/subjects'
import { useStorageUsage } from '@/hooks/useStorageUsage'
import { useSidebar } from '@/hooks/useWorkspace'
import { cn } from '@/lib/utils'
import { sessionKey, useExamStore } from '@/store/useExamStore'
import { useStreakStore } from '@/store/useStreakStore'
import { dailySetId, localDateKey } from '@/utils/daily'
import { streakSummary } from '@/utils/streak'
import { Logo, LogoMark } from './Logo'
import { NAV_SECTIONS, navLinkClass, SIDEBAR_SHORTCUT } from './nav'
import { ThemeToggle } from './ThemeToggle'

const SECTION_TITLE = 'px-2.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500'
const STATUS_ROW =
  'flex h-7 items-center justify-between gap-3 rounded-lg px-2.5 text-[12px] text-zinc-500 transition-colors hover:bg-zinc-900/[0.03] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-100/[0.04] dark:hover:text-zinc-100'
const STORAGE_QUOTA = 5 * 1024 * 1024

/** Racha activa y estado del Desafío Diario de hoy, en una línea cada uno. */
function FocusStatus({ rail }: { rail: boolean }) {
  const [today] = useState(() => localDateKey())
  const days = useStreakStore((s) => s.days)
  const session = useExamStore((s) => s.sessions[sessionKey(dailySetId(today), 'practica')])
  const { current } = streakSummary(days, today)
  const answered = session ? Object.keys(session.answers).length : 0
  const challenge = days[today]?.challenge ? 'Completado' : session ? `En curso ${answered}/3` : 'Pendiente'
  const streakLabel = `${current} ${current === 1 ? 'día' : 'días'}`

  if (rail) {
    return (
      <Link
        to="/"
        title={`Racha activa: ${streakLabel}. Desafío Diario: ${challenge.toLowerCase()}.`}
        aria-label={`Racha activa: ${streakLabel}. Desafío Diario: ${challenge.toLowerCase()}.`}
        className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg font-mono text-[12px] font-medium text-zinc-500 tabular-nums transition-colors hover:bg-zinc-900/[0.03] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-100/[0.04] dark:hover:text-zinc-100"
      >
        {current}
      </Link>
    )
  }
  return (
    <div className="mt-0.5">
      <Link to="/" className={STATUS_ROW}>
        Racha activa
        <span className="font-mono text-zinc-900 tabular-nums dark:text-zinc-100">{streakLabel}</span>
      </Link>
      <Link to="/" className={STATUS_ROW}>
        Desafío Diario
        <span className={cn('tabular-nums', challenge !== 'Pendiente' && 'text-zinc-900 dark:text-zinc-100')}>{challenge}</span>
      </Link>
    </div>
  )
}

/** Ensayos y prácticas sin terminar, para retomarlos desde cualquier vista. */
function InProgress() {
  const sessions = useExamStore((s) => s.sessions)
  const sets = useExamStore((s) => s.sets)
  const list = Object.values(sessions)
    .filter((s) => EXAMS_BY_ID.has(s.examId) || sets[s.examId])
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3)
  if (!list.length) return null
  return (
    <div className="mt-2.5">
      <p className={SECTION_TITLE}>En curso</p>
      <ul className="mt-1 space-y-0.5">
        {list.map((s) => {
          const meta = EXAMS_BY_ID.get(s.examId)
          const set = sets[s.examId]
          const subject = meta?.subject ?? set!.subject
          const title = meta?.title ?? set!.title
          const total = meta?.questionCount ?? set!.items.length
          const answered = Object.keys(s.answers).length
          return (
            <li key={s.key}>
              <Link
                to={`/ensayo/${s.examId}?modo=${s.mode}`}
                className="group flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-zinc-600 transition-colors hover:bg-zinc-900/[0.03] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-100/[0.04] dark:hover:text-zinc-100"
              >
                <SubjectMono subject={subject} className="mt-px size-5 text-[9px]" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{set?.kind === 'diario' ? 'Desafío Diario' : subjectLabel(subject, meta?.area)}</span>
                  <span className="block truncate text-zinc-400 dark:text-zinc-500">
                    {title}, {s.mode === 'ensayo' ? 'ensayo' : 'práctica'}{' '}
                    <span className="tabular-nums">{answered}/{total}</span>
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Cuánto ocupa el progreso en este navegador. */
function StorageStatus({ rail }: { rail: boolean }) {
  const used = useStorageUsage()
  const kb = Math.max(1, Math.round(used / 1024))
  const share = Math.min(1, used / STORAGE_QUOTA)
  const label = `Tu progreso ocupa ${kb} KB de unos 5 MB y se guarda solo en este navegador. Respáldalo desde Analítica.`
  if (rail) {
    return (
      <Link
        to="/analitica"
        title={label}
        aria-label={label}
        className="flex h-8 w-8 items-center justify-center rounded-lg font-mono text-[10px] text-zinc-500 tabular-nums transition-colors hover:bg-zinc-900/[0.03] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-100/[0.04] dark:hover:text-zinc-100"
      >
        {kb >= 1000 ? `${(kb / 1024).toFixed(1)}M` : `${kb}K`}
      </Link>
    )
  }
  return (
    <Link to="/analitica" title={label} className="block rounded-lg px-2.5 py-1.5 transition-colors hover:bg-zinc-900/[0.03] dark:hover:bg-zinc-100/[0.04]">
      <span className="flex items-baseline justify-between gap-3 text-[11.5px] text-zinc-500 dark:text-zinc-400">
        Guardado en este navegador
        <span className="font-mono whitespace-nowrap text-zinc-900 tabular-nums dark:text-zinc-100">{kb} KB</span>
      </span>
      <span aria-hidden className="mt-1.5 block h-0.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <span className="block h-full rounded-full bg-zinc-900 dark:bg-zinc-100" style={{ width: `${Math.max(share * 100, 1)}%` }} />
      </span>
    </Link>
  )
}

function SidebarBody({ rail, header }: { rail: boolean; header: React.ReactNode }) {
  return (
    <>
      {header}
      <nav className={cn('mt-4 min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto', rail ? 'px-3' : 'px-2.5')} aria-label="Principal">
        {NAV_SECTIONS.map((section, i) => (
          <div key={section.title}>
            {rail
              ? i > 0 && <div aria-hidden className="mb-3 border-t border-zinc-200/80 dark:border-zinc-800/80" />
              : <p className={cn(SECTION_TITLE, 'mb-1')}>{section.title}</p>}
            <div className="space-y-0.5">
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  title={rail ? label : undefined}
                  aria-label={rail ? label : undefined}
                  className={(state) => cn(navLinkClass(state), rail && 'w-8 justify-center px-0')}
                >
                  <Icon className="size-4 shrink-0" />
                  {!rail && label}
                </NavLink>
              ))}
            </div>
            {i === 0 && <FocusStatus rail={rail} />}
            {i === 0 && !rail && <InProgress />}
          </div>
        ))}
      </nav>
      <div className={cn('mt-3 space-y-2 border-t border-zinc-200/80 pt-3 dark:border-zinc-800/80', rail ? 'px-3' : 'px-2.5')}>
        <StorageStatus rail={rail} />
        {rail ? <ThemeToggle compact /> : <ThemeToggle className="ml-2.5" />}
      </div>
    </>
  )
}

const SURFACE = 'border-zinc-200/80 bg-[#FAFAFA] dark:border-zinc-800/80 dark:bg-[#09090B]'

/**
 * Navegación del espacio de trabajo: columna fija y colapsable a íconos en escritorio, cajón en pantallas
 * angostas y oculta durante un ensayo cronometrado (Modo Zen) hasta que el estudiante la despliegue.
 */
export function Sidebar() {
  const { state, desktop, toggle, drawerOpen, setDrawerOpen } = useSidebar()

  if (!desktop) {
    return (
      <DialogPrimitive.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/25 data-[state=open]:animate-fade-in dark:bg-black/50" />
          <DialogPrimitive.Content
            className={cn('fixed inset-y-0 left-0 z-50 flex w-[min(17rem,calc(100vw-3rem))] flex-col border-r py-3 data-[state=open]:animate-fade-in', SURFACE)}
            // Cualquier enlace del cajón lo cierra al navegar.
            onClick={(e) => {
              if ((e.target as Element).closest('a')) setDrawerOpen(false)
            }}
          >
            <DialogPrimitive.Title className="sr-only">Navegación</DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">Secciones de PAES Studio</DialogPrimitive.Description>
            <SidebarBody
              rail={false}
              header={
                <div className="flex h-8 items-center justify-between px-3.5">
                  <Logo />
                  <DialogPrimitive.Close asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Cerrar navegación"><X /></Button>
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
  const toggleLabel = `${rail ? 'Expandir' : 'Colapsar'} barra lateral (${SIDEBAR_SHORTCUT})`
  return (
    <aside
      inert={hidden}
      className={cn(
        'h-dvh shrink-0 overflow-hidden transition-[width] duration-200 ease-out',
        hidden ? 'w-0' : rail ? 'w-14 border-r' : 'w-60 border-r',
        SURFACE,
      )}
    >
      <div className={cn('flex h-full flex-col py-3', rail ? 'w-14' : 'w-60')}>
        <SidebarBody
          rail={rail}
          header={
            rail ? (
              <div className="flex flex-col items-center gap-2 px-3">
                <Link to="/" aria-label="PAES Studio, Hub Central" className="rounded-md"><LogoMark /></Link>
                <Button variant="ghost" size="icon" onClick={toggle} title={toggleLabel} aria-label={toggleLabel}><PanelLeftOpen /></Button>
              </div>
            ) : (
              <div className="flex h-8 items-center justify-between px-3.5">
                <Logo />
                <Button variant="ghost" size="icon-sm" onClick={toggle} title={toggleLabel} aria-label={toggleLabel}><PanelLeftClose /></Button>
              </div>
            )
          }
        />
      </div>
    </aside>
  )
}
