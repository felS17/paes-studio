export interface NavItem {
  to: string
  label: string
  /** Rótulo de dos letras para la barra reducida: la barra va solo con texto, sin íconos. */
  short: string
  end?: boolean
}

/** Las «aplicaciones» de la barra de tareas; también dan el primer nivel de las migas. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'inicio', short: 'in', end: true },
  { to: '/ensayos', label: 'ensayos', short: 'en' },
  { to: '/subtemas', label: 'temas', short: 'te' },
  { to: '/flashcards', label: 'flashcards', short: 'fl' },
  { to: '/zettelkasten', label: 'mapa', short: 'ma' },
  { to: '/material', label: 'guías', short: 'gu' },
  { to: '/analitica', label: 'stats', short: 'st' },
]

/** Atajo para colapsar la barra lateral, escrito como en el teclado de cada sistema. */
export const SIDEBAR_SHORTCUT = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘B' : 'Ctrl+B'

export const DOCK_ITEM =
  'relative flex h-8 shrink-0 items-center gap-2.5 rounded-md px-2 font-mono text-[12.5px] whitespace-nowrap transition-colors duration-150'
export const DOCK_IDLE =
  'text-zinc-500 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-100/[0.05] dark:hover:text-zinc-100'
export const DOCK_ACTIVE = 'bg-zinc-900/[0.05] text-zinc-900 dark:bg-zinc-100/[0.07] dark:text-zinc-100'
/** En la barra reducida, cada ítem es un cuadrado con su rótulo de dos letras. */
export const DOCK_RAIL = 'w-8 justify-center px-0'
