import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, ListChecks } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { Panel } from '@/components/ui/panel'
import { SubjectTag } from '@/components/ui/subject-tag'
import { subjectLabel } from '@/data/subjects'
import { cn } from '@/lib/utils'
import { sessionKey, useExamStore } from '@/store/useExamStore'
import type { Exam, ExamMode } from '@/types/exam'
import { formatClock, formatMinutes } from '@/utils/format'

const MODES: { mode: ExamMode; title: string; icon: typeof Clock; body: (exam: Exam) => string }[] = [
  {
    mode: 'practica',
    title: 'Modo práctica',
    icon: ListChecks,
    body: (exam) =>
      exam.source === 'curado'
        ? 'Verificas cada respuesta al instante y ves el desarrollo paso a paso. Sin límite de tiempo.'
        : 'Verificas cada respuesta al instante con el clavijero oficial. Sin límite de tiempo.',
  },
  {
    mode: 'ensayo',
    title: 'Modo ensayo',
    icon: Clock,
    body: (exam) =>
      `Condiciones de prueba: ${formatMinutes(exam.durationMinutes)} de reloj, sin ver claves hasta entregar. Al final obtienes tu puntaje PAES.`,
  },
]

export function ExamIntro({ exam }: { exam: Exam }) {
  const navigate = useNavigate()
  const sessions = useExamStore((s) => s.sessions)
  const discard = useExamStore((s) => s.discard)
  const snapshots = exam.questions.filter((q) => q.presentation === 'snapshot').length
  const pilots = exam.questions.filter((q) => q.pilot).length
  const optionCount = Math.max(...exam.questions.map((q) => q.options.length))

  const facts: [string, React.ReactNode][] = [
    ['Preguntas', <span className="tabular-nums">{exam.questions.length}</span>],
    ['Tiempo de ensayo', formatMinutes(exam.durationMinutes)],
    ...(exam.passages.length ? [['Lecturas', <span className="tabular-nums">{exam.passages.length}</span>] as [string, React.ReactNode]] : []),
    ['Fuente', exam.source === 'demre' ? 'Folleto oficial DEMRE' : 'Ensayo curado'],
    ...(exam.form ? [['Forma', <span className="tabular-nums">{exam.form}</span>] as [string, React.ReactNode]] : []),
    ...(pilots ? [['Preguntas piloto', <span className="tabular-nums">{pilots}</span>] as [string, React.ReactNode]] : []),
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/ensayos"><ArrowLeft />Ensayos</Link>
      </Button>
      <div className="mt-6">
        <SubjectTag subject={exam.subject} label={subjectLabel(exam.subject, exam.area)} />
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">{exam.title}</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">{exam.description}</p>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-zinc-200/80 py-4 sm:grid-cols-3 dark:border-zinc-800/80">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
            <dd className="mt-0.5 text-[13.5px] font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {MODES.map(({ mode, title, icon: Icon, body }) => {
          const session = sessions[sessionKey(exam.id, mode)]
          const answered = session ? Object.keys(session.answers).length : 0
          return (
            <Panel key={mode} className={cn('flex flex-col p-5', mode === 'ensayo' && 'border-zinc-300 dark:border-zinc-700')}>
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-zinc-500" />
                <h2 className="text-[14px] font-semibold tracking-tight">{title}</h2>
                {session && <Badge tone="outline" className="ml-auto">En curso</Badge>}
              </div>
              <p className="mt-2 flex-1 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">{body(exam)}</p>
              {session && (
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="tabular-nums">{answered}/{exam.questions.length}</span> respondidas,{' '}
                  <span className="font-mono tabular-nums">{formatClock(session.elapsedMs)}</span> transcurridos
                </p>
              )}
              <div className="mt-4 flex gap-2">
                <Button variant={mode === 'ensayo' ? 'primary' : 'secondary'} onClick={() => navigate(`?modo=${mode}`)}>
                  {session ? 'Continuar' : mode === 'ensayo' ? 'Comenzar ensayo' : 'Comenzar práctica'}
                </Button>
                {session && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      discard(session.key)
                      navigate(`?modo=${mode}`)
                    }}
                  >
                    Empezar de nuevo
                  </Button>
                )}
              </div>
            </Panel>
          )
        })}
      </div>

      <div className="mt-8 space-y-3 text-[13px] text-zinc-600 dark:text-zinc-400">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="flex items-center gap-1.5">
            <Kbd>A</Kbd>–<Kbd>{['A', 'B', 'C', 'D', 'E'][optionCount - 1]}</Kbd> marcar alternativa
          </span>
          <span className="flex items-center gap-1.5"><Kbd>←</Kbd><Kbd>→</Kbd> navegar</span>
          <span className="flex items-center gap-1.5"><Kbd>F</Kbd> marcar duda</span>
          <span className="flex items-center gap-1.5"><Kbd>Enter</Kbd> verificar (práctica)</span>
          <span className="flex items-center gap-1.5"><Kbd>⌫</Kbd> borrar respuesta</span>
        </p>
        {snapshots > 0 && (
          <p className="leading-relaxed">
            {snapshots === exam.questions.length ? 'Todas las preguntas' : `${snapshots} preguntas`} con fórmulas, tablas o
            figuras se muestran como recorte fiel del folleto oficial; marcas tu respuesta con los botones bajo la imagen.
          </p>
        )}
        {exam.source === 'demre' && (
          <p className="leading-relaxed">
            El folleto publicado puede ser una selección de la prueba completa. El puntaje se calcula con la tabla de
            transformación oficial: es exacto si respondes la prueba completa y estimado (proporcional) si es una selección.
          </p>
        )}
      </div>
    </div>
  )
}
