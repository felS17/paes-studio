import { createJSONStorage, type StateStorage } from 'zustand/middleware'

/** Todos los stores persisten bajo una sola clave de localStorage, cada uno en su propio campo. */
export const STORAGE_KEY = 'paes-studio-storage'

function readRoot(): Record<string, unknown> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

function writeRoot(root: Record<string, unknown>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(root))
  } catch (err) {
    console.warn('[paes-studio] No se pudo guardar el progreso en localStorage.', err)
  }
}

const scopedStorage: StateStorage = {
  getItem: (name) => {
    const value = readRoot()[name]
    return value === undefined ? null : JSON.stringify(value)
  },
  setItem: (name, value) => {
    const root = readRoot()
    root[name] = JSON.parse(value)
    writeRoot(root)
  },
  removeItem: (name) => {
    const root = readRoot()
    delete root[name]
    writeRoot(root)
  },
}

export const persistStorage = createJSONStorage(() => scopedStorage)
