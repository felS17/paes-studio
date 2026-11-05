import { useCallback } from 'react'
import { useMatch, useSearchParams } from 'react-router-dom'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

/** `running`: hay un ExamRunner en pantalla. `timed`: es un ensayo cronometrado (Modo Zen, Inspector bloqueado). */
export function useExamRoute() {
  const match = useMatch('/ensayo/:examId')
  const [params] = useSearchParams()
  const mode = match ? params.get('modo') : null
  return { running: mode === 'practica' || mode === 'ensayo', timed: mode === 'ensayo' }
}

export type SidebarState = 'full' | 'rail' | 'hidden'

/**
 * Estado de la barra lateral. En un ensayo cronometrado parte oculta (Modo Zen) y al desplegarla no altera tu
 * preferencia guardada; en pantallas angostas el mismo botón abre el cajón.
 */
export function useSidebar() {
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed)
  const setCollapsed = useSettingsStore((s) => s.setSidebarCollapsed)
  const zenExpanded = useWorkspaceStore((s) => s.zenExpanded)
  const setZenExpanded = useWorkspaceStore((s) => s.setZenExpanded)
  const drawerOpen = useWorkspaceStore((s) => s.drawerOpen)
  const setDrawerOpen = useWorkspaceStore((s) => s.setDrawerOpen)
  const { timed } = useExamRoute()
  const desktop = useMediaQuery('(min-width: 1024px)')

  const state: SidebarState = timed ? (zenExpanded ? 'full' : 'hidden') : collapsed ? 'rail' : 'full'
  const toggle = useCallback(() => {
    if (!desktop) setDrawerOpen(!useWorkspaceStore.getState().drawerOpen)
    else if (timed) setZenExpanded(!useWorkspaceStore.getState().zenExpanded)
    else setCollapsed(!useSettingsStore.getState().sidebarCollapsed)
  }, [desktop, setCollapsed, setDrawerOpen, setZenExpanded, timed])

  return { state, desktop, toggle, drawerOpen, setDrawerOpen }
}
