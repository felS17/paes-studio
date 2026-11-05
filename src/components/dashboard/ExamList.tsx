import { Link } from 'react-router-dom'
import { InspectButton } from '@/components/inspector/InspectButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AREA_LABEL, SUBJECTS, SUBJECT_ORDER } from '@/data/subjects'
import { useExamStore } from '@/store/useExamStore'
import type { ExamMeta, SubjectId } from '@/types/exam'
import { formatMinutes } from '@/utils/format'

function ExamRow({ exam, best }: { exam: ExamMeta; best?: number }) {
  const inProgress = useExamStore((s) =>
    Object.values(s.sessions).filter((x) => x.examId === exam.id).sort((a, b) => b.updatedAt - a.updatedAt)[0],
  )
  return (
    <li className="group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50/80 sm:gap-4 dark:hover:bg-zinc-900/40">
      <div className="min-w-0 flex-1">
        <Link to={`/ensayo/${exam.id}`} className="block truncate text-[13.5px] font-medium after:absolute after:inset-0">
          {exam.area ? `${AREA_LABEL[exam.area]}, ` : ''}
          {exam.title}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="tabular-nums">{exam.questionCount} preguntas</span>
          <span>{formatMinutes(exam.durationMinutes)}</span>
          {exam.passageCount > 0 && <span className="tabular-nums">{exam.passageCount} lecturas</span>}
          {inProgress && (
            <span className="text-zinc-900 dark:text-zinc-100">
              En curso, {inProgress.mode === 'ensayo' ? 'ensayo' : 'práctica'}{' '}
              <span className="tabular-nums">{Object.keys(inProgress.answers).length}/{exam.questionCount}</span>
            </span>
          )}
        </p>
      </div>
      <div className="hidden shrink-0 md:block">
        {exam.source === 'curado' ? <Badge tone="solid">Con explicaciones</Badge> : <Badge>Oficial DEMRE</Badge>}
      </div>
      <div className="w-14 shrink-0 text-right" title={best ? 'Tu mejor puntaje en este ensayo' : undefined}>
        {best ? <span className="font-mono text-[13px] font-medium tabular-nums">{best}</span> : <span className="text-xs text-zinc-300 dark:text-zinc-700">—</span>}
      </div>
      <div className="relative z-10 hidden shrink-0 gap-1.5 sm:flex">
        <Button size="sm" variant="ghost" asChild>
          <Link to={`/ensayo/${exam.id}?modo=practica`}>Practicar</Link>
        </Button>
        <Button size="sm" asChild>
          <Link to={`/ensayo/${exam.id}?modo=ensayo`}>Rendir</Link>
        </Button>
      </div>
    </li>
  )
}

export function ExamList({ exams, bestScores }: { exams: ExamMeta[]; bestScores: Map<string, number> }) {
  const groups = SUBJECT_ORDER.map((id) => [id, exams.filter((e) => e.subject === id)] as [SubjectId, ExamMeta[]]).filter(
    ([, list]) => list.length,
  )
  return (
    <div className="space-y-8">
      {groups.map(([subject, list]) => (
        <section key={subject} aria-labelledby={`group-${subject}`}>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
            <h2 id={`group-${subject}`} className="text-[14px] font-semibold tracking-tight">
              {SUBJECTS[subject].name}
            </h2>
            <div className="flex items-center gap-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Prueba oficial: <span className="tabular-nums">{SUBJECTS[subject].officialQuestions}</span> preguntas en {formatMinutes(SUBJECTS[subject].officialMinutes)}
              </p>
              <InspectButton target={{ kind: 'subject', subject }} name={SUBJECTS[subject].name} withLabel />
            </div>
          </div>
          <ul className="divide-y divide-zinc-200/80 overflow-hidden rounded-xl border border-zinc-200/80 bg-white dark:divide-zinc-800/80 dark:border-zinc-800/80 dark:bg-[#121215]">
            {list.map((exam) => (
              <ExamRow key={exam.id} exam={exam} best={bestScores.get(exam.id)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
