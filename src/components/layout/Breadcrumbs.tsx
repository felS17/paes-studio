import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { EXAMS_BY_ID } from '@/data/catalog'
import { DECKS } from '@/data/flashcards'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useExamStore } from '@/store/useExamStore'
import { NAV_SECTIONS } from './nav'

interface Crumb {
  label: string
  to?: string
}

const section = (to: string): Crumb[] => {
  const owner = NAV_SECTIONS.find((s) => s.items.some((i) => i.to === to))
  const item = owner?.items.find((i) => i.to === to)
  if (!owner || !item) return []
  return to === '/' ? [{ label: item.label, to }] : [{ label: owner.title }, { label: item.label, to }]
}

/** Migas del flujo actual. Las secciones no son vistas, así que solo los módulos llevan enlace. */
function useCrumbs(): Crumb[] {
  const { pathname } = useLocation()
  const attempts = useAnalyticsStore((s) => s.attempts)
  const sets = useExamStore((s) => s.sets)
  const [root, id] = pathname.split('/').filter(Boolean).map(decodeURIComponent)

  if (!root) return section('/')
  if (root === 'ensayo' && id) {
    const set = sets[id]
    const title = set?.title ?? EXAMS_BY_ID.get(id)?.title ?? 'Ensayo'
    return [...section(set ? '/subtemas' : '/ensayos'), { label: title }]
  }
  if (root === 'resultados') {
    const attempt = attempts.find((a) => a.id === id)
    return [...section('/analitica'), { label: attempt?.examTitle ?? 'Resultado' }]
  }
  const base = section(`/${root}`)
  if (!base.length) return [{ label: 'Página no encontrada' }]
  if (root === 'flashcards' && id) return [...base, { label: DECKS.find((d) => d.id === id)?.title ?? 'Mazo' }]
  return base
}

export function Breadcrumbs() {
  const crumbs = useCrumbs()
  return (
    <nav aria-label="Ruta actual" className="min-w-0 flex-1">
      <ol className="flex items-center gap-1.5 text-[13px] whitespace-nowrap">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <Fragment key={`${c.label}-${i}`}>
              {i > 0 && <li aria-hidden className="text-zinc-300 dark:text-zinc-700">/</li>}
              <li className={last ? 'min-w-0 truncate font-medium text-zinc-900 dark:text-zinc-100' : 'hidden text-zinc-500 sm:block dark:text-zinc-400'} aria-current={last ? 'page' : undefined}>
                {c.to && !last ? (
                  <Link to={c.to} className="rounded underline-offset-4 hover:text-zinc-900 hover:underline dark:hover:text-zinc-100">{c.label}</Link>
                ) : c.label}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
