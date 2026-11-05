import { create } from 'zustand'
import type { SubjectId } from '@/types/exam'

export type InspectorTarget =
  | { kind: 'subtopic'; id: string }
  /** Una asignatura completa o, con `axis`, solo uno de sus ejes. */
  | { kind: 'subject'; subject: SubjectId; axis?: string }

export type InspectorTab = 'ficha' | 'pdf' | 'flashcards'

interface InspectorState {
  target: InspectorTarget | null
  tab: InspectorTab
  isOpen: boolean
  /** Bloqueado durante un ensayo cronometrado: no se abre hasta entregar. */
  locked: boolean
  openInspector: (target: InspectorTarget, tab?: InspectorTab) => void
  /** Vuelve a mostrar lo último que se consultó. */
  reopen: () => void
  closeInspector: () => void
  setTab: (tab: InspectorTab) => void
  setLocked: (locked: boolean) => void
}

/** Panel contextual global: consulta teoría, compendio y flashcards desde cualquier vista sin abandonarla. */
export const useInspectorStore = create<InspectorState>()((set) => ({
  target: null,
  tab: 'ficha',
  isOpen: false,
  locked: false,
  openInspector: (target, tab = 'ficha') => set((s) => (s.locked ? s : { target, tab, isOpen: true })),
  reopen: () => set((s) => (s.locked || !s.target ? s : { isOpen: true })),
  closeInspector: () => set({ isOpen: false }),
  setTab: (tab) => set({ tab }),
  setLocked: (locked) => set((s) => ({ locked, isOpen: locked ? false : s.isOpen })),
}))
