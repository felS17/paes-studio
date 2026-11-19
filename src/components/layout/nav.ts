import type { PixelIconName } from '@/components/icons/PixelIcon'

export interface NavItem {
  to: string
  label: string
  icon: PixelIconName
  end?: boolean
}

/** Las «aplicaciones» de la barra de tareas; también dan el primer nivel de las migas. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'inicio', icon: 'console', end: true },
  { to: '/ensayos', label: 'ensayos', icon: 'document' },
  { to: '/subtemas', label: 'temas', icon: 'tree' },
  { to: '/flashcards', label: 'flashcards', icon: 'cards' },
  { to: '/zettelkasten', label: 'mapa', icon: 'constellation' },
  { to: '/material', label: 'guías', icon: 'book' },
  { to: '/analitica', label: 'stats', icon: 'monitor' },
]

/** Atajo para colapsar la barra lateral, escrito como en el teclado de cada sistema. */
export const SIDEBAR_SHORTCUT = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘B' : 'Ctrl+B'

export const DOCK_ITEM =
  'relative flex h-8 shrink-0 items-center gap-2.5 rounded-md px-2 font-mono text-[12.5px] whitespace-nowrap transition-colors duration-150'
export const DOCK_IDLE =
  'text-zinc-500 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-100/[0.05] dark:hover:text-zinc-100'
export const DOCK_ACTIVE = 'bg-zinc-900/[0.05] text-zinc-900 dark:bg-zinc-100/[0.07] dark:text-zinc-100'
/** En la barra reducida a íconos, cada ítem es un cuadrado. */
export const DOCK_RAIL = 'w-8 justify-center px-0'
