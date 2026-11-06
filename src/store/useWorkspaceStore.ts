import { create } from 'zustand'

export type AppearanceTab = 'tema' | 'fuente'

interface WorkspaceState {
  /** Modo Zen: el estudiante desplegó la barra lateral durante un ensayo cronometrado. */
  zenExpanded: boolean
  /** Cajón de navegación en pantallas angostas. */
  drawerOpen: boolean
  /** Selector de Apariencia: la pestaña abierta, o `null` si está cerrado. */
  appearance: AppearanceTab | null
  setZenExpanded: (value: boolean) => void
  setDrawerOpen: (value: boolean) => void
  /** Abre el selector y cierra el cajón móvil: dos diálogos modales a la vez se pelean el foco. */
  openAppearance: (tab: AppearanceTab) => void
  closeAppearance: () => void
}

/** Estado efímero del espacio de trabajo (no se persiste; el colapso de la barra vive en los ajustes). */
export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  zenExpanded: false,
  drawerOpen: false,
  appearance: null,
  setZenExpanded: (zenExpanded) => set({ zenExpanded }),
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  openAppearance: (appearance) => set({ appearance, drawerOpen: false }),
  closeAppearance: () => set({ appearance: null }),
}))
