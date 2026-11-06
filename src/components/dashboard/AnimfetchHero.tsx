import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { DailyQuote } from '@/components/dashboard/DailyQuote'
import { HubShell } from '@/components/dashboard/HubShell'
import { NebulaCanvas } from '@/components/dashboard/NebulaCanvas'
import { PaesCountdown } from '@/components/dashboard/PaesCountdown'
import { PixelIcon, type PixelIconName } from '@/components/icons/PixelIcon'
import { EXAMS } from '@/data/catalog'
import { TOTAL_CARDS } from '@/data/flashcards'
import { QUOTES, quoteIndexOf } from '@/data/quotes'
import { SUBTOPICS } from '@/data/temario'
import { THEME_BY_ID } from '@/data/themes'
import { useDailyAction } from '@/hooks/useDailyAction'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import { useStreak } from '@/hooks/useStreak'
import { useTheme } from '@/hooks/useTheme'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import type { SubjectId } from '@/types/exam'
import { globalAccuracy, latestResults } from '@/utils/analytics'
import { quickDrillDraft, quickDrillSubject } from '@/utils/subtopics'

const curated = EXAMS.filter((e) => e.source === 'curado').length

const COMMANDS: { label: string; hint: string; icon: PixelIconName; to: string }[] = [
  { label: 'ensayos', hint: `${EXAMS.length - curated} pruebas oficiales demre y ${curated} curados`, icon: 'document', to: '/ensayos' },
  { label: 'temas', hint: `${SUBTOPICS.length} subtemas, con resumen y práctica`, icon: 'tree', to: '/subtemas' },
  { label: 'flashcards', hint: `${TOTAL_CARDS} tarjetas de memoria`, icon: 'cards', to: '/flashcards' },
  { label: 'mapa', hint: 'cómo se conecta lo que sabes', icon: 'constellation', to: '/zettelkasten' },
  { label: 'guías', hint: 'resúmenes pdf y formulario express', icon: 'book', to: '/material' },
  { label: 'stats (task manager)', hint: 'ritmo, errores y progreso', icon: 'monitor', to: '/analitica' },
]

const ROW =
  'group flex h-11 w-full min-w-0 items-center gap-2.5 px-5 text-left text-zinc-700 transition-colors focus-visible:-outline-offset-2 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-100/[0.05] dark:hover:text-zinc-100'

function CommandBody({ icon, label, hint }: { icon: PixelIconName; label: string; hint: string }) {
  return (
    <>
      <span aria-hidden className="text-zinc-400 group-hover:text-accent dark:text-zinc-500">❯</span>
      <PixelIcon name={icon} className="text-zinc-500 group-hover:text-accent dark:text-zinc-400" />
      <span className="shrink-0 @md:w-[21ch]">{label}</span>
      <span className="hidden min-w-0 truncate text-[12px] text-zinc-500 @md:block dark:text-zinc-400">{hint}</span>
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
 * Una sola caja, separada por líneas finas: toda acción se hace con un clic y escribir siempre es opcional. No lleva
 * `overflow-hidden` porque recortaría el menú flotante del prompt.
 */
export function AnimfetchHero() {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const openAppearance = useWorkspaceStore((s) => s.openAppearance)
  const startPractice = useStartPracticeSet()
  const runDaily = useDailyAction()
  const { resolved } = useTheme()
  const { current } = useStreak()
  const [quoteIndex, setQuoteIndex] = useState(() => quoteIndexOf(new Date()))
  const nextQuote = () => setQuoteIndex((i) => (i + 1) % QUOTES.length)

  const latest = useMemo(() => latestResults(attempts), [attempts])
  const quick = useMemo(() => quickDrillSubject(attempts, latest), [attempts, latest])
  const train = (size: 10 | 20, subject: SubjectId = quick.subject) => startPractice(quickDrillDraft(subject, latest, size))

  const accuracy = useMemo(() => globalAccuracy(attempts), [attempts])
  const theme = THEME_BY_ID[resolved]
  const blocks = [theme.accent2, theme.accent, theme.text, theme.graph.mid, theme.graph.faint]
  const trainHint = quick.pending
    ? `de ${quick.subject}, partiendo por ${quick.pending === 1 ? 'tu error pendiente' : `tus ${quick.pending} errores pendientes`}`
    : `de ${quick.subject}, con la explicación apenas respondes`

  return (
    <section aria-label="Ventana de inicio" className="@container rounded-xl border border-zinc-200/80 bg-surface dark:border-zinc-800/80">
      <p aria-hidden className="border-b border-zinc-200/80 px-5 py-2 font-mono text-[12px] text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
        paes@studio
      </p>

      <div className="grid @3xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <NebulaCanvas className="h-56 @lg:h-72 @3xl:h-auto @3xl:min-h-[340px]" />
        <div className="flex min-w-0 flex-col gap-5 p-5 @3xl:p-6">
          {/* En la ventana más ancha, el contador y los datos caben lado a lado y le dejan aire a la composición. */}
          <div className="flex flex-col gap-5 @[1300px]:flex-row @[1300px]:items-start @[1300px]:justify-between @[1300px]:gap-8">
            <PaesCountdown />
            <dl className="shrink-0 font-mono text-[14px] leading-[1.9]">
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
          </div>
          <div className="mt-auto">
            <DailyQuote index={quoteIndex} onNext={nextQuote} />
          </div>
        </div>
      </div>

      <nav aria-label="Comandos" className="grid border-t border-zinc-200/80 py-2 font-mono text-[13.5px] @3xl:grid-cols-2 dark:border-zinc-800/80">
        <button type="button" className={`${ROW} @3xl:col-span-2`} onClick={() => train(10)}>
          <CommandBody icon="bolt" label="entrenar 10 rápidas" hint={trainHint} />
        </button>
        {COMMANDS.map(({ label, hint, icon, to }) => (
          <Link key={to} to={to} className={ROW}>
            <CommandBody icon={icon} label={label} hint={hint} />
          </Link>
        ))}
      </nav>

      <HubShell onTrain={train} onDaily={runDaily} onQuote={nextQuote} />
    </section>
  )
}
