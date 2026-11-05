import { useSyncExternalStore } from 'react'
import { STORAGE_KEY } from '@/store/storage'

function read() {
  try {
    return localStorage.getItem(STORAGE_KEY)?.length ?? 0
  } catch {
    return 0
  }
}

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 15_000)
  window.addEventListener('storage', onChange)
  return () => {
    window.clearInterval(id)
    window.removeEventListener('storage', onChange)
  }
}

/** Caracteres que ocupa el progreso en localStorage; se actualiza cada 15 s y con cada render. */
export const useStorageUsage = () => useSyncExternalStore(subscribe, read, () => 0)
