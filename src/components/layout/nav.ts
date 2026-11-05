import { BarChart3, FileText, House, Layers, LayoutList, ListTree, Waypoints, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

/** Las cuatro secciones de la barra lateral; también dan el primer nivel de las migas. */
export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: 'Hoy', items: [{ to: '/', label: 'Inicio', icon: House, end: true }] },
  {
    title: 'Práctica',
    items: [
      { to: '/ensayos', label: 'Ensayos Completos', icon: LayoutList },
      { to: '/subtemas', label: 'Practicar por Tema', icon: ListTree },
      { to: '/flashcards', label: 'Flashcards', icon: Layers },
    ],
  },
  {
    title: 'Apuntes y Red',
    items: [
      { to: '/zettelkasten', label: 'Mapa de Conocimiento', icon: Waypoints },
      { to: '/material', label: 'Guías y Resúmenes PDF', icon: FileText },
    ],
  },
  { title: 'Tu Avance', items: [{ to: '/analitica', label: 'Estadísticas y Errores', icon: BarChart3 }] },
]

/** Atajo para colapsar la barra lateral, escrito como en el teclado de cada sistema. */
export const SIDEBAR_SHORTCUT = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘B' : 'Ctrl+B'

export function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex h-8 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150',
    isActive
      ? 'bg-zinc-900/[0.05] text-zinc-900 dark:bg-zinc-100/[0.07] dark:text-zinc-100'
      : 'text-zinc-500 hover:bg-zinc-900/[0.03] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-100/[0.04] dark:hover:text-zinc-100',
  )
}
