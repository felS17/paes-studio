import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain, Compass, Palette, Target, Zap } from 'lucide-react'
import { DailyQuote } from '@/components/dashboard/DailyQuote'
import { HubShell } from '@/components/dashboard/HubShell'
import { NebulaCanvas } from '@/components/dashboard/NebulaCanvas'
import { Button } from '@/components/ui/button'
import { EXAMS } from '@/data/catalog'
import { TOTAL_CARDS } from '@/data/flashcards'
import { SUBJECTS } from '@/data/subjects'
import { SUBTOPICS } from '@/data/temario'
import { THEME_BY_ID } from '@/data/themes'
import { useDailyAction } from '@/hooks/useDailyAction'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import { useTheme } from '@/hooks/useTheme'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useStreakStore } from '@/store/useStreakStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import type { latestResults } from '@/utils/analytics'
import { localDateKey } from '@/utils/daily'
import { streakSummary } from '@/utils/streak'
import { quickDrillDraft, quickDrillSubject } from '@/utils/subtopics'

const number = (value: number) => value.toLocaleString('es-CL')

function Field({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9ch_minmax(0,1fr)] gap-x-2">
      <dt className="flex justify-between">
        <span className="font-medium text-accent">{name}</span>
        <span aria-hidden className="text-zinc-400 dark:text-zinc-500">:</span>
      </dt>
      <dd className="min-w-0 text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  )
}

/**
 * La joya del Inicio: nebulosa animada a la izquierda y tus datos estilo `fastfetch` a la derecha. Abajo van los botones
 * que hacen todo con un clic y, en segundo plano, el mini-shell opcional.
 */
export function AnimfetchHero({ latest, explored }: { latest: ReturnType<typeof latestResults>; explored: number }) {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const days = useStreakStore((s) => s.days)
  const openAppearance = useWorkspaceStore((s) => s.openAppearance)
  const startPractice = useStartPracticeSet()
  const daily = useDailyAction()
  const { resolved } = useTheme()
  const [today] = useState(() => localDateKey())

  const quick = useMemo(() => quickDrillSubject(attempts, latest), [attempts, latest])
  const train = (size: 10 | 20) => startPractice(quickDrillDraft(quick.subject, latest, size))

  const { current } = streakSummary(days, today)
  const questions = EXAMS.reduce((n, e) => n + e.questionCount, 0)
  const { answered, correct } = useMemo(
    () => attempts.reduce((sum, a) => ({ answered: sum.answered + a.answered, correct: sum.correct + a.correct }), { answered: 0, correct: 0 }),
    [attempts],
  )
  const theme = THEME_BY_ID[resolved]
  const blocks = [theme.accent2, theme.accent, theme.text, theme.graph.mid, theme.graph.faint]

  return (
    <section aria-labelledby="hero" className="@container overflow-hidden rounded-xl border border-zinc-200/80 bg-surface dark:border-zinc-800/80">
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-zinc-200/80 px-4 py-3 sm:px-5 dark:border-zinc-800/80">
        <h1 id="hero" className="text-[18px] leading-tight font-semibold tracking-[-0.015em] text-balance sm:text-[20px]">
          Entrena con las pruebas reales del DEMRE, gratis
        </h1>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Sin cuentas ni contraseñas. Tu progreso se guarda solo.</p>
      </header>

      <div className="grid @3xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <NebulaCanvas className="h-56 border-b border-zinc-200/80 @lg:h-64 @3xl:h-auto @3xl:min-h-[400px] @3xl:border-r @3xl:border-b-0 dark:border-zinc-800/80" />

        <div className="flex min-w-0 flex-col gap-5 p-4 sm:p-5">
          <div className="font-mono text-[13px] leading-[1.75]">
            <p aria-hidden className="truncate">
              <span className="font-medium text-accent">paes@studio</span>
              <span className="text-zinc-400 dark:text-zinc-500"> ~ $ </span>
              <span className="text-zinc-900 dark:text-zinc-100">animfetch --nebula</span>
            </p>
            <dl className="mt-3">
              <Field name="Estado">
                {current > 0 ? `Racha activa de ${current} ${current === 1 ? 'día' : 'días'}` : 'Sin racha aún: hoy puedes partirla'}
              </Field>
              <Field name="Banco">{number(EXAMS.length)} ensayos · {number(questions)} preguntas</Field>
              <Field name="Memoria">{number(TOTAL_CARDS)} flashcards</Field>
              <Field name="Dominio">
                {answered > 0
                  ? `${Math.round((correct / answered) * 100)} % de acierto global`
                  : `${explored} de ${SUBTOPICS.length} temas explorados`}
              </Field>
              <Field name="Tema">
                <button
                  type="button"
                  onClick={() => openAppearance('tema')}
                  aria-label={`Cambiar tema. Ahora usas ${theme.label}`}
                  className="group inline-flex flex-wrap items-center gap-x-2.5 rounded-sm text-left"
                >
                  <span className="underline-offset-4 group-hover:underline">{theme.label}</span>
                  <span aria-hidden className="whitespace-nowrap">
                    {blocks.map((color, i) => (
                      <span key={i} style={{ color }}>███</span>
                    ))}
                  </span>
                </button>
              </Field>
            </dl>
          </div>
          <div className="mt-auto border-t border-zinc-200/80 pt-4 dark:border-zinc-800/80">
            <DailyQuote />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-zinc-200/80 p-3 sm:p-4 dark:border-zinc-800/80">
        <div className="grid gap-2 sm:flex sm:flex-wrap">
          <Button variant="primary" size="lg" onClick={() => train(10)}>
            <Zap />
            Entrenar 10 preguntas rápidas
          </Button>
          <Button size="lg" onClick={daily.run}>
            <Target />
            {daily.label}
          </Button>
          <Button size="lg" asChild>
            <Link to="/ensayos"><Compass />Ir a Ensayos</Link>
          </Button>
          <Button size="lg" asChild>
            <Link to="/flashcards"><Brain />Repasar Flashcards</Link>
          </Button>
          <Button size="lg" onClick={() => openAppearance('tema')}>
            <Palette />
            Cambiar Tema
          </Button>
        </div>
        <p className="text-[12.5px] leading-snug text-zinc-500 dark:text-zinc-400">
          {quick.pending
            ? `Entrenar parte por ${quick.pending === 1 ? 'tu error pendiente' : `tus ${quick.pending} errores pendientes`} de ${SUBJECTS[quick.subject].short}.`
            : `Entrenar usa preguntas de ${SUBJECTS[quick.subject].short}, con la explicación apenas respondes.`}
        </p>
        <HubShell onTrain={train} onDaily={daily.run} />
      </div>
    </section>
  )
}
