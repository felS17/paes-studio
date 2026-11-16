import type { PersistStorage, StorageValue } from 'zustand/middleware'

/** Todos los stores persisten bajo una sola clave de localStorage, cada uno en su propio campo. */
export const STORAGE_KEY = 'paes-studio-storage'

type Root = Record<string, unknown>

// Última lectura ya interpretada: mientras el texto guardado no cambie (otra pestaña), no se vuelve a interpretar.
let lastRaw: string | null = null
let lastRoot: Root = {}

function readRoot(): Root {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === lastRaw) return lastRoot
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    lastRoot = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Root) : {}
    lastRaw = raw
    return lastRoot
  } catch {
    return {}
  }
}

function writeRoot(root: Root) {
  try {
    const raw = JSON.stringify(root)
    localStorage.setItem(STORAGE_KEY, raw)
    lastRaw = raw
    lastRoot = root
  } catch (err) {
    lastRaw = null
    console.warn('[paes-studio] No se pudo guardar el progreso en localStorage.', err)
  }
}

/**
 * Almacén compartido. Recibe y entrega objetos, así cada guardado serializa una sola vez (antes eran dos
 * `stringify` y dos `parse` por cada clic en una alternativa).
 */
export const persistStorage: PersistStorage<unknown> = {
  getItem: (name) => (readRoot()[name] as StorageValue<unknown> | undefined) ?? null,
  setItem: (name, value) => writeRoot({ ...readRoot(), [name]: value }),
  removeItem: (name) => {
    const root = { ...readRoot() }
    delete root[name]
    writeRoot(root)
  },
}
