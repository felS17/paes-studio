import { useMemo, useState } from 'react'
import { PixelIcon } from '@/components/icons/PixelIcon'
import { Button } from '@/components/ui/button'
import { LoadBar } from '@/components/ui/load-bar'
import { SUBJECTS, SUBJECT_TABS } from '@/data/subjects'
import { TEMARIO_BY_SUBJECT } from '@/data/temario'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import type { SubjectId } from '@/types/exam'
import { latestResults } from '@/utils/analytics'
import { formatPercent } from '@/utils/format'
import { combineStats, drillDraftFor, processState, subtopicStats, type ProcessState, type SubtopicStat } from '@/utils/subtopics'

type SortKey = 'proceso' | 'uso' | 'rendimiento' | 'estado'
interface Sort {
  key: SortKey
  dir: 'asc' | 'desc'
}

interface ProcessRow {
  id: string
  name: string
  subject: SubjectId
  /** Solo los ejes: las materias son la raíz del árbol. */
  axis?: string
  ids: string[]
  stat: SubtopicStat
  state: ProcessState
  children: ProcessRow[]
}

const STATE_ORDER: Record<ProcessState, number> = { crítico: 0, estable: 1, dominado: 2, 'sin datos': 3 }

function makeRow(id: string, name: string, subject: SubjectId, ids: string[], stats: Map<string, SubtopicStat>, axis?: string, children: ProcessRow[] = []): ProcessRow {
  const stat = combineStats(ids, stats)
  return { id, name, subject, axis, ids, stat, state: processState(stat), children }
}

function buildRows(stats: Map<string, SubtopicStat>): ProcessRow[] {
  return SUBJECT_TABS.map((subject) => {
    const axes = TEMARIO_BY_SUBJECT.get(subject)?.axes ?? []
    const children = axes.map((a) => makeRow(`${subject}:${a.name}`, a.name, subject, a.subtopics.map((s) => s.id), stats, a.name))
    return makeRow(subject, subject, subject, children.flatMap((c) => c.ids), stats, undefined, children)
  })
}

function compare(a: ProcessRow, b: ProcessRow, key: SortKey): number {
  if (key === 'proceso') return a.name.localeCompare(b.name, 'es')
  if (key === 'uso') return a.stat.answered - b.stat.answered
  if (key === 'estado') return STATE_ORDER[a.state] - STATE_ORDER[b.state]
  return (a.stat.accuracy ?? 0) - (b.stat.accuracy ?? 0)
}

/** Ordena cada nivel del árbol por separado. Lo que aún no tiene datos queda siempre al final. */
function sortRows(rows: ProcessRow[], sort: Sort): ProcessRow[] {
  const sign = sort.dir === 'asc' ? 1 : -1
  return [...rows]
    .sort((a, b) => {
      if (sort.key === 'rendimiento' && (a.stat.accuracy === null || b.stat.accuracy === null)) {
        return Number(a.stat.accuracy === null) - Number(b.stat.accuracy === null)
      }
      return sign * compare(a, b, sort.key)
    })
    .map((row) => ({ ...row, children: sortRows(row.children, sort) }))
}

function Header({ label, column, sort, onSort, className }: { label: string; column: SortKey; sort: Sort; onSort: (key: SortKey) => void; className?: string }) {
  const active = sort.key === column
  return (
    <th scope="col" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={cn('py-2 pr-3 text-left font-normal', className)}>
      <button type="button" onClick={() => onSort(column)} className={cn('rounded-sm font-mono text-[11.5px] hover:text-zinc-900 dark:hover:text-zinc-100', active ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400')}>
        {label}
        {active && <span aria-hidden> {sort.dir === 'asc' ? '↑' : '↓'}</span>}
      </button>
    </th>
  )
}

/**
 * Pestaña `procesos`: materias y ejes como un árbol de `htop`. Parte con las materias cerradas y lo más débil arriba;
 * cada fila se puede entrenar con un clic.
 */
export function ProcessTable() {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const start = useStartPracticeSet()
  const latest = useMemo(() => latestResults(attempts), [attempts])
  const [sort, setSort] = useState<Sort>({ key: 'rendimiento', dir: 'asc' })
  const [open, setOpen] = useState<Partial<Record<SubjectId, boolean>>>({})
  const rows = useMemo(() => sortRows(buildRows(subtopicStats(attempts, latest)), sort), [attempts, latest, sort])

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'proceso' || key === 'rendimiento' || key === 'estado' ? 'asc' : 'desc' }))

  const train = (row: ProcessRow) =>
    start(
      drillDraftFor(row.ids, 10, latest, {
        subject: row.subject,
        title: row.axis ?? '10 preguntas rápidas',
        scope: row.axis ? `${row.axis} (${SUBJECTS[row.subject].short})` : SUBJECTS[row.subject].short,
      }),
    )

  const cells = (row: ProcessRow) => (
    <>
      <td className="hidden py-1.5 pr-3 font-mono text-[12.5px] tabular-nums @xl:table-cell">{row.stat.answered || '—'}</td>
      <td className="py-1.5 pr-3">
        <span className="flex items-center gap-2">
          <LoadBar value={row.stat.accuracy} className="hidden w-20 @lg:flex" />
          <span className="font-mono text-[12.5px] tabular-nums">{row.stat.accuracy === null ? '—' : formatPercent(row.stat.accuracy)}</span>
        </span>
      </td>
      <td className={cn('hidden py-1.5 pr-3 font-mono text-[12px] @xl:table-cell', row.state === 'crítico' ? 'font-semibold text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400')}>
        {row.state}
      </td>
      <td className="py-1 text-right">
        <Button size="sm" variant="ghost" onClick={() => train(row)} aria-label={`Entrenar ${row.name}`}>entrenar</Button>
      </td>
    </>
  )

  return (
    <div className="@container">
      <table className="w-full table-fixed border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80">
            <Header label="proceso" column="proceso" sort={sort} onSort={onSort} />
            <Header label="uso" column="uso" sort={sort} onSort={onSort} className="hidden w-16 @xl:table-cell" />
            <Header label="rendimiento" column="rendimiento" sort={sort} onSort={onSort} className="w-24 @lg:w-44" />
            <Header label="estado" column="estado" sort={sort} onSort={onSort} className="hidden w-24 @xl:table-cell" />
            <th scope="col" className="w-20"><span className="sr-only">Acción</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
          {rows.map((row) => {
            const subject = row.subject
            const isOpen = Boolean(open[subject])
            return [
              <tr key={row.id}>
                <td className="py-1.5 pr-3">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen((o) => ({ ...o, [subject]: !isOpen }))}
                    className="flex items-center gap-1.5 rounded-sm font-medium"
                  >
                    <PixelIcon name="chevron-right" className={cn('text-zinc-400 transition-transform duration-150', isOpen && 'rotate-90')} />
                    {row.name}
                  </button>
                </td>
                {cells(row)}
              </tr>,
              ...(isOpen
                ? row.children.map((child, i) => (
                    <tr key={child.id}>
                      <td className="py-1.5 pr-3">
                        <span className="flex items-center gap-1.5 pl-[5px]">
                          <span aria-hidden className="shrink-0 font-mono text-zinc-400 dark:text-zinc-600">{i === row.children.length - 1 ? '└─' : '├─'}</span>
                          <span className="truncate" title={child.name}>{child.name}</span>
                        </span>
                      </td>
                      {cells(child)}
                    </tr>
                  ))
                : []),
            ]
          })}
        </tbody>
      </table>
    </div>
  )
}
