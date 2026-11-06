import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { sortExams } from '@/data/catalog'
import { AREA_LABEL } from '@/data/subjects'
import { useExamStore } from '@/store/useExamStore'
import type { ExamMeta } from '@/types/exam'
import { formatMinutes } from '@/utils/format'

const LIST = 'divide-y divide-zinc-200/80 border-y border-zinc-200/80 dark:divide-zinc-800/80 dark:border-zinc-800/80'
const CURATED_GROUP = 'ensayos curados'

/** Una línea y 3 datos: nombre, su estado más útil y los botones para partir. */
function ExamRow({ exam, label, last }: { exam: ExamMeta; label: string; last?: number }) {
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
      <Link to={`/ensayo/${exam.id}`} className="min-w-0 flex-1 text-[13.5px] after:absolute after:inset-0 sm:truncate">{label}</Link>
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

const withArea = (exam: ExamMeta, name: string) => (exam.area ? `${AREA_LABEL[exam.area]}, ${name}` : name)

/**
 * Pruebas oficiales de la más reciente a la más antigua y los curados al final. Con todas las materias, cada prueba
 * es un grupo y sus filas son las materias; con una sola materia, una lista corrida de pruebas.
 */
export function ExamList({ exams, lastScores, flat }: { exams: ExamMeta[]; lastScores: Map<string, number>; flat: boolean }) {
  const sorted = sortExams(exams)
  if (flat) {
    return (
      <ul className={LIST}>
        {sorted.map((exam) => <ExamRow key={exam.id} exam={exam} label={withArea(exam, exam.title)} last={lastScores.get(exam.id)} />)}
      </ul>
    )
  }
  const groups = new Map<string, ExamMeta[]>()
  for (const exam of sorted) {
    const name = exam.source === 'curado' ? CURATED_GROUP : exam.title
    groups.set(name, [...(groups.get(name) ?? []), exam])
  }
  return (
    <div className="space-y-6">
      {[...groups].map(([name, list], i) => (
        <section key={name} aria-labelledby={`grupo-${i}`}>
          <h2 id={`grupo-${i}`} className="mb-1 font-mono text-[12px] text-zinc-500 dark:text-zinc-400">{name}</h2>
          <ul className={LIST}>
            {list.map((exam) => <ExamRow key={exam.id} exam={exam} label={withArea(exam, exam.subject)} last={lastScores.get(exam.id)} />)}
          </ul>
        </section>
      ))}
    </div>
  )
}
