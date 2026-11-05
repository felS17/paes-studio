import { create } from 'zustand'

interface WorkspaceState {
  /** Modo Zen: el estudiante desplegó la barra lateral durante un ensayo cronometrado. */
  zenExpanded: boolean
  /** Cajón de navegación en pantallas angostas. */
  drawerOpen: boolean
  setZenExpanded: (value: boolean) => void
  setDrawerOpen: (value: boolean) => void
}

/** Estado efímero del espacio de trabajo (no se persiste; el colapso de la barra vive en los ajustes). */
export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  zenExpanded: false,
  drawerOpen: false,
  setZenExpanded: (zenExpanded) => set({ zenExpanded }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
}))
