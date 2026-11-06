import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DailyQuote } from '@/components/dashboard/DailyQuote'
import { HubShell } from '@/components/dashboard/HubShell'
import { NebulaCanvas } from '@/components/dashboard/NebulaCanvas'
import { PixelIcon, type PixelIconName } from '@/components/icons/PixelIcon'
import { EXAMS } from '@/data/catalog'
import { TOTAL_CARDS } from '@/data/flashcards'
import { THEME_BY_ID } from '@/data/themes'
import { useDailyAction } from '@/hooks/useDailyAction'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import { useTheme } from '@/hooks/useTheme'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useStreakStore } from '@/store/useStreakStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { globalAccuracy, latestResults } from '@/utils/analytics'
import { localDateKey } from '@/utils/daily'
import { streakSummary } from '@/utils/streak'
import { quickDrillDraft, quickDrillSubject } from '@/utils/subtopics'

const COMMANDS: { label: string; icon: PixelIconName; to: string }[] = [
  { label: 'ensayos', icon: 'document', to: '/ensayos' },
  { label: 'temas', icon: 'tree', to: '/subtemas' },
  { label: 'flashcards', icon: 'cards', to: '/flashcards' },
  { label: 'mapa', icon: 'constellation', to: '/zettelkasten' },
  { label: 'guías', icon: 'book', to: '/material' },
  { label: 'stats (task manager)', icon: 'monitor', to: '/analitica' },
]

const ROW =
  'group flex h-8 w-full items-center gap-2.5 px-4 text-left text-zinc-700 transition-colors focus-visible:-outline-offset-2 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-100/[0.05] dark:hover:text-zinc-100'

function CommandBody({ icon, label }: { icon: PixelIconName; label: string }) {
  return (
    <>
      <span aria-hidden className="text-zinc-400 group-hover:text-accent dark:text-zinc-500">❯</span>
      <PixelIcon name={icon} className="text-zinc-500 group-hover:text-accent dark:text-zinc-400" />
      {label}
    </>
  )
}

function Field({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[10ch_minmax(0,1fr)] gap-x-2">
      <dt className="flex justify-between">
        <span className="text-accent">{name}</span>
        <span aria-hidden className="text-zinc-400 dark:text-zinc-500">:</span>
      </dt>
      <dd className="min-w-0 text-zinc-900 tabular-nums dark:text-zinc-100">{children}</dd>
    </div>
  )
}

/**
 * La ventana del Inicio: nebulosa y datos estilo `fastfetch` arriba, comandos de un clic al centro y el prompt abajo.
 * Una sola caja, separada por líneas finas: toda acción se hace con un clic y escribir siempre es opcional.
 */
export function AnimfetchHero() {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const days = useStreakStore((s) => s.days)
  const openAppearance = useWorkspaceStore((s) => s.openAppearance)
  const startPractice = useStartPracticeSet()
  const runDaily = useDailyAction()
  const { resolved } = useTheme()
  const [today] = useState(() => localDateKey())

  const latest = useMemo(() => latestResults(attempts), [attempts])
  const train = (size: 10 | 20) => startPractice(quickDrillDraft(quickDrillSubject(attempts, latest).subject, latest, size))

  const { current } = streakSummary(days, today)
  const accuracy = useMemo(() => globalAccuracy(attempts), [attempts])
  const theme = THEME_BY_ID[resolved]
  const blocks = [theme.accent2, theme.accent, theme.text, theme.graph.mid, theme.graph.faint]

  return (
    <section aria-label="Ventana de inicio" className="@container overflow-hidden rounded-xl border border-zinc-200/80 bg-surface dark:border-zinc-800/80">
      <p aria-hidden className="border-b border-zinc-200/80 px-4 py-1.5 font-mono text-[12px] text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
        paes@studio
      </p>

      <div className="grid @2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <NebulaCanvas className="h-44 @2xl:h-auto @2xl:min-h-[260px]" />
        <div className="flex min-w-0 flex-col gap-4 p-4">
          <dl className="font-mono text-[13px] leading-[1.75]">
            <Field name="racha">{current} {current === 1 ? 'día' : 'días'}</Field>
            <Field name="ensayos">{EXAMS.length}</Field>
            <Field name="tarjetas">{TOTAL_CARDS}</Field>
            <Field name="acierto">{accuracy === null ? '—' : `${Math.round(accuracy * 100)} %`}</Field>
            <Field name="tema">
              <button
                type="button"
                onClick={() => openAppearance('tema')}
                aria-label={`Cambiar tema. Ahora usas ${theme.label}`}
                className="group inline-flex flex-wrap items-center gap-x-2 rounded-sm text-left"
              >
                <span className="underline-offset-4 group-hover:underline">{theme.label}</span>
                <span aria-hidden className="whitespace-nowrap">
                  {blocks.map((color, i) => (
                    <span key={i} style={{ color }}>█</span>
                  ))}
                </span>
              </button>
            </Field>
          </dl>
          <div className="mt-auto">
            <DailyQuote />
          </div>
        </div>
      </div>

      <nav aria-label="Comandos" className="border-t border-zinc-200/80 py-1.5 font-mono text-[13px] dark:border-zinc-800/80">
        <button type="button" className={ROW} onClick={() => train(10)}>
          <CommandBody icon="bolt" label="entrenar 10 rápidas" />
        </button>
        {COMMANDS.map(({ label, icon, to }) => (
          <Link key={to} to={to} className={ROW}>
            <CommandBody icon={icon} label={label} />
          </Link>
        ))}
      </nav>

      <HubShell onTrain={train} onDaily={runDaily} />
    </section>
  )
}
