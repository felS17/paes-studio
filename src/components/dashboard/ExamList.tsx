import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AREA_LABEL, SUBJECT_TABS } from '@/data/subjects'
import { useExamStore } from '@/store/useExamStore'
import type { ExamMeta, SubjectId } from '@/types/exam'
import { formatMinutes } from '@/utils/format'

/** Una línea y 3 datos: nombre, su estado más útil y los botones para partir. */
function ExamRow({ exam, last }: { exam: ExamMeta; last?: number }) {
  const inProgress = useExamStore((s) =>
    Object.values(s.sessions).filter((x) => x.examId === exam.id).sort((a, b) => b.updatedAt - a.updatedAt)[0],
  )
  const detail = inProgress
    ? `en curso ${Object.keys(inProgress.answers).length}/${exam.questionCount}`
    : last
      ? `último ${last}`
      : `${exam.questionCount} preg, ${formatMinutes(exam.durationMinutes)}`
  return (
    <li className="relative flex min-h-10 items-center gap-3 py-1 transition-colors hover:bg-zinc-900/[0.02] dark:hover:bg-zinc-100/[0.03]">
      <Link to={`/ensayo/${exam.id}`} className="min-w-0 flex-1 text-[13.5px] after:absolute after:inset-0 sm:truncate">
        {exam.area ? `${AREA_LABEL[exam.area]}, ` : ''}
        {exam.title}
      </Link>
      <span className="shrink-0 font-mono text-[12px] text-zinc-500 tabular-nums sm:w-36 sm:text-right dark:text-zinc-400">{detail}</span>
      <div className="relative z-10 hidden shrink-0 gap-1 sm:flex">
        <Button size="sm" variant="ghost" asChild>
          <Link to={`/ensayo/${exam.id}?modo=practica`}>práctica</Link>
        </Button>
        <Button size="sm" asChild>
          <Link to={`/ensayo/${exam.id}?modo=ensayo`}>iniciar</Link>
        </Button>
      </div>
    </li>
  )
}

export function ExamList({ exams, lastScores }: { exams: ExamMeta[]; lastScores: Map<string, number> }) {
  const groups = SUBJECT_TABS.map((id) => [id, exams.filter((e) => e.subject === id)] as [SubjectId, ExamMeta[]]).filter(([, list]) => list.length)
  return (
    <div className="space-y-6">
      {groups.map(([subject, list]) => (
        <section key={subject} aria-labelledby={`group-${subject}`}>
          <h2 id={`group-${subject}`} className="mb-1 font-mono text-[12px] text-zinc-500 dark:text-zinc-400">{subject}</h2>
          <ul className="divide-y divide-zinc-200/80 border-y border-zinc-200/80 dark:divide-zinc-800/80 dark:border-zinc-800/80">
            {list.map((exam) => (
              <ExamRow key={exam.id} exam={exam} last={lastScores.get(exam.id)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
