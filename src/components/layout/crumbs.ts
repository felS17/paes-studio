import { useLocation } from 'react-router-dom'
import { attemptTitle, EXAMS_BY_ID } from '@/data/catalog'
import { DECKS } from '@/data/flashcards'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useExamStore } from '@/store/useExamStore'
import { NAV_ITEMS } from './nav'

export interface Crumb {
  label: string
  to?: string
}

const section = (to: string): Crumb[] => {
  const item = NAV_ITEMS.find((i) => i.to === to)
  return item ? [{ label: item.label, to }] : []
}

/** Migas del flujo actual: la «aplicación» de la barra de tareas y, si entraste a algo, su nombre. */
export function useCrumbs(): Crumb[] {
  const { pathname } = useLocation()
  const attempts = useAnalyticsStore((s) => s.attempts)
  const sets = useExamStore((s) => s.sets)
  const [root, id] = pathname.split('/').filter(Boolean).map(decodeURIComponent)

  if (!root) return section('/')
  if (root === 'ensayo' && id) {
    const set = sets[id]
    const title = set?.title ?? EXAMS_BY_ID.get(id)?.title ?? 'ensayo'
    return [...section(set ? '/subtemas' : '/ensayos'), { label: title }]
  }
  if (root === 'resultados') {
    const attempt = attempts.find((a) => a.id === id)
    return [...section('/analitica'), { label: attempt ? attemptTitle(attempt) : 'resultado' }]
  }
  const base = section(`/${root}`)
  if (!base.length) return [{ label: 'página no encontrada' }]
  if (root === 'flashcards' && id) return [...base, { label: DECKS.find((d) => d.id === id)?.title ?? 'mazo' }]
  return base
}
