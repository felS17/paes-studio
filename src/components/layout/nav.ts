import { BarChart3, FileText, House, Layers, LayoutList, ListTree, Waypoints } from 'lucide-react'
import { cn } from '@/lib/utils'

export const NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: House, end: true },
  { to: '/ensayos', label: 'Ensayos', icon: LayoutList, end: false },
  { to: '/subtemas', label: 'Subtemas', icon: ListTree, end: false },
  { to: '/zettelkasten', label: 'Zettelkasten', icon: Waypoints, end: false },
  { to: '/flashcards', label: 'Flashcards', icon: Layers, end: false },
  { to: '/material', label: 'Material PDF', icon: FileText, end: false },
  { to: '/analitica', label: 'Analítica', icon: BarChart3, end: false },
] as const

export function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex h-8 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors duration-150',
    isActive
      ? 'bg-zinc-900/[0.05] text-zinc-900 dark:bg-zinc-100/[0.07] dark:text-zinc-100'
      : 'text-zinc-500 hover:bg-zinc-900/[0.03] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-100/[0.04] dark:hover:text-zinc-100',
  )
}
