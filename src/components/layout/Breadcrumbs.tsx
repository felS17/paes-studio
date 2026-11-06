import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import type { Crumb } from './crumbs'

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Ruta actual" className="min-w-0 flex-1">
      <ol className="flex items-center gap-1.5 text-[13px] whitespace-nowrap">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1
          return (
            <Fragment key={`${c.label}-${i}`}>
              {i > 0 && <li aria-hidden className="text-zinc-300 dark:text-zinc-700">/</li>}
              <li className={last ? 'min-w-0 truncate font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'} aria-current={last ? 'page' : undefined}>
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
