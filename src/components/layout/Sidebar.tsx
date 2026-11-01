import { NavLink, Link } from 'react-router-dom'
import { SubjectMono } from '@/components/ui/subject-tag'
import { EXAMS_BY_ID } from '@/data/catalog'
import { subjectLabel } from '@/data/subjects'
import { useExamStore } from '@/store/useExamStore'
import { Logo } from './Logo'
import { NAV_ITEMS, navLinkClass } from './nav'
import { ThemeToggle } from './ThemeToggle'

function InProgress() {
  const sessions = useExamStore((s) => s.sessions)
  const sets = useExamStore((s) => s.sets)
  const list = Object.values(sessions)
    .filter((s) => EXAMS_BY_ID.has(s.examId) || sets[s.examId])
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 4)
  if (!list.length) return null
  return (
    <div className="mt-6">
      <p className="px-2.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">En curso</p>
      <ul className="mt-1.5 space-y-0.5">
        {list.map((s) => {
          const meta = EXAMS_BY_ID.get(s.examId)
          const set = sets[s.examId]
          const subject = meta?.subject ?? set!.subject
          const title = meta?.title ?? set!.title
          const total = meta?.questionCount ?? set!.items.length
          const answered = Object.keys(s.answers).length
          return (
            <li key={s.key}>
              <Link
                to={`/ensayo/${s.examId}?modo=${s.mode}`}
                className="group flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-[12px] text-zinc-600 transition-colors hover:bg-zinc-900/[0.03] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-100/[0.04] dark:hover:text-zinc-100"
              >
                <SubjectMono subject={subject} className="mt-px size-5 text-[9px]" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{subjectLabel(subject, meta?.area)}</span>
                  <span className="block truncate text-zinc-400 dark:text-zinc-500">
                    {title}, {s.mode === 'ensayo' ? 'ensayo' : 'práctica'}{' '}
                    <span className="tabular-nums">{answered}/{total}</span>
                  </span>
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-zinc-200/80 bg-[#FAFAFA] px-3 py-4 lg:flex dark:border-zinc-800/80 dark:bg-[#09090B]">
      <div className="px-1.5">
        <Logo />
      </div>
      <nav className="mt-6 space-y-0.5" aria-label="Principal">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <InProgress />
      <div className="mt-auto space-y-3 px-1.5">
        <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          Tu progreso se guarda solo en este navegador. Respáldalo desde Analítica.
        </p>
        <ThemeToggle />
      </div>
    </aside>
  )
}
