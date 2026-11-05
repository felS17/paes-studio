import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BarChart3, FileText, Layers, LayoutList, ListTree, Waypoints, Zap, type LucideIcon } from 'lucide-react'
import { DailyChallenge } from '@/components/dashboard/DailyChallenge'
import { DailyQuote } from '@/components/dashboard/DailyQuote'
import { SubtopicExplorer } from '@/components/dashboard/SubtopicExplorer'
import { Button } from '@/components/ui/button'
import { EXAMS } from '@/data/catalog'
import { TOTAL_CARDS } from '@/data/flashcards'
import pdfs from '@/data/pdfs.json'
import { SUBJECTS, SUBJECT_ORDER } from '@/data/subjects'
import { SUBTOPICS } from '@/data/temario'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import type { SubjectId } from '@/types/exam'
import { latestResults, mistakeNotebook } from '@/utils/analytics'
import { masteryOf, quickDrillDraft, quickDrillSubject, subtopicStats } from '@/utils/subtopics'

const CONTACT = {
  author: 'felS (Felipe Schneeberger)',
  email: 'felipe.schneeberger@estudiante.uc.cl',
  github: 'https://github.com/felS17',
}

interface ModuleCard {
  to: string
  title: string
  icon: LucideIcon
  description: string
  /** Dato vivo del módulo (catálogo o tu progreso), en mono. */
  datum: string
  span: string
}

/**
 * Inicio: presentación del proyecto, métricas reales del banco, Desafío Diario, menú de módulos, mapa de los 67
 * subtemas y contacto. El catálogo de ensayos vive en /ensayos.
 */
export function HomePage() {
  const [params, setParams] = useSearchParams()
  const attempts = useAnalyticsStore((s) => s.attempts)
  const materia = params.get('materia')
  const subject: SubjectId = SUBJECT_ORDER.includes(materia as SubjectId) ? (materia as SubjectId) : 'lectora'

  const startPractice = useStartPracticeSet()
  const latest = useMemo(() => latestResults(attempts), [attempts])
  const quick = useMemo(() => quickDrillSubject(attempts, latest), [attempts, latest])

  const progress = useMemo(() => {
    const stats = subtopicStats(attempts, latest)
    const mastery = SUBTOPICS.map((s) => masteryOf(stats.get(s.id)))
    return {
      explored: mastery.filter((m) => m !== 'sin-explorar').length,
      mastered: mastery.filter((m) => m === 'dominado').length,
      mistakes: mistakeNotebook(attempts).length,
    }
  }, [attempts, latest])

  const questions = EXAMS.reduce((n, e) => n + e.questionCount, 0)
  const pdfCount = Object.keys(pdfs).length
  const metrics: [number, string][] = [
    [EXAMS.length, 'Ensayos'],
    [questions, 'Preguntas'],
    [SUBTOPICS.length, 'Temas'],
    [TOTAL_CARDS, 'Flashcards'],
    [pdfCount, 'Guías en PDF'],
  ]

  const modules: ModuleCard[] = [
    {
      to: '/ensayos', title: 'Ponerse a prueba (Ensayos Oficiales)', icon: LayoutList, span: 'lg:col-span-2',
      description: 'Rinde una prueba real con el tiempo oficial y mira qué puntaje sacarías hoy. ¿Sin apuro? En modo práctica corriges cada pregunta al momento.',
      datum: `${EXAMS.length} ensayos, ${attempts.length} ${attempts.length === 1 ? 'intento guardado' : 'intentos guardados'}`,
    },
    {
      to: '/subtemas', title: 'Atacar un tema específico (Drills rápidos)', icon: ListTree, span: '',
      description: 'Elige justo lo que te cuesta y practica 10, 20 o todas las preguntas de ese tema, sacadas de todas las pruebas.',
      datum: `${progress.explored} de ${SUBTOPICS.length} temas explorados`,
    },
    {
      to: '/flashcards', title: 'Entrenar la memoria en 5 min (Flashcards)', icon: Layers, span: '',
      description: 'Tarjetas inteligentes que te preguntan justo lo que estás a punto de olvidar. Hay de Matemática, Biología, Física, Química e Historia.',
      datum: `${TOTAL_CARDS} tarjetas en 6 mazos`,
    },
    {
      to: '/zettelkasten', title: 'Ver cómo se conecta lo que sabes (Mapa Mental)', icon: Waypoints, span: 'lg:col-span-2',
      description: 'Cada pregunta que respondes se suma a tu mapa del temario: ahí ves qué ya dominas, qué te falta y cómo se conectan las materias.',
      datum: `${progress.mastered} ${progress.mastered === 1 ? 'tema dominado' : 'temas dominados'}`,
    },
    {
      to: '/analitica', title: 'Mirar cuánto has avanzado (Estadísticas y Errores)', icon: BarChart3, span: 'lg:col-span-2',
      description: 'Mira cómo sube tu puntaje, qué temas reforzar y vuelve a las preguntas que fallaste hasta que te salgan.',
      datum: `${progress.mistakes} ${progress.mistakes === 1 ? 'pregunta por repasar' : 'preguntas por repasar'}`,
    },
    {
      to: '/material', title: 'Estudiar con guías claras (Resúmenes PDF)', icon: FileText, span: '',
      description: 'Un resumen y una presentación de repaso por materia, listos para leer o descargar.',
      datum: `${pdfCount} PDF`,
    },
  ]

  return (
    <div className="space-y-14">
      {/* A. Presentación y métricas */}
      <section aria-labelledby="hero" className="space-y-8">
        <DailyQuote />
        <div className="max-w-3xl border-t border-zinc-200/80 pt-8 dark:border-zinc-800/80">
          <h1 id="hero" className="text-[26px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance sm:text-[32px]">
            Entrena con las pruebas reales del DEMRE, gratis
          </h1>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Entra y entrena al tiro: sin crearte cuentas ni contraseñas. Tienes explicaciones paso a paso, claras y sin saltarse
            ningún cálculo, y tarjetas inteligentes que te preguntan justo lo que estás a punto de olvidar. Tu progreso se guarda
            automáticamente aquí mismo (y puedes descargarlo si cambias de computador).
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button variant="primary" size="lg" onClick={() => startPractice(quickDrillDraft(quick.subject, latest))}>
              <Zap />
              Entrenar 10 preguntas rápidas ahora
            </Button>
            <p className="max-w-[40ch] text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
              {quick.pending
                ? `Partimos por ${quick.pending === 1 ? 'tu error pendiente' : `tus ${quick.pending} errores pendientes`} de ${SUBJECTS[quick.subject].short}.`
                : `De ${SUBJECTS[quick.subject].short}, con la explicación apenas respondes.`}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 border-y border-zinc-200/80 sm:grid-cols-5 dark:border-zinc-800/80">
          {metrics.map(([value, label]) => (
            <div
              key={label}
              className="border-zinc-200/80 py-4 pr-4 max-sm:odd:border-r max-sm:[&:nth-child(-n+4)]:border-b sm:pl-5 sm:not-last:border-r sm:first:pl-0 max-sm:even:pl-4 dark:border-zinc-800/80"
            >
              <dd className="font-mono text-[26px] leading-none font-semibold tracking-tight tabular-nums">{value.toLocaleString('es-CL')}</dd>
              <dt className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
            </div>
          ))}
        </dl>
        <DailyChallenge />
      </section>

      {/* B. Menú de módulos */}
      <section aria-labelledby="modulos">
        <h2 id="modulos" className="text-[18px] font-semibold tracking-tight">¿Qué quieres hacer hoy?</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map(({ to, title, icon: Icon, description, datum, span }) => (
            <li
              key={to}
              className={cn(
                'group relative flex min-h-40 flex-col rounded-xl border border-zinc-200/80 bg-white p-5 transition-colors duration-150 hover:border-zinc-300 dark:border-zinc-800/80 dark:bg-[#121215] dark:hover:border-zinc-700',
                span,
              )}
            >
              <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                <Icon className="size-4 text-zinc-500 dark:text-zinc-400" aria-hidden />
                <Link to={to} className="after:absolute after:inset-0 after:rounded-xl">
                  {title}
                </Link>
              </h3>
              <p className="mt-2 max-w-[56ch] text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
              <p className="mt-auto pt-4 font-mono text-[12px] text-zinc-900 tabular-nums dark:text-zinc-100">{datum}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* C. Mapa de los 67 subtemas */}
      <section aria-labelledby="mapa-subtemas" id="subtemas" className="scroll-mt-20">
        <h2 id="mapa-subtemas" className="text-[18px] font-semibold tracking-tight">Elige un tema y ponte a practicar</h2>
        <p className="mt-1 max-w-[70ch] text-[13px] text-zinc-500 dark:text-zinc-400">
          Los {SUBTOPICS.length} temas de la PAES, ordenados por materia. Practica el que quieras o lee su resumen antes de partir.
        </p>
        <div className="mt-5">
          <SubtopicExplorer
            subject={subject}
            onSubjectChange={(s) => {
              const p = new URLSearchParams(params)
              p.set('materia', s)
              setParams(p, { replace: true, preventScrollReset: true })
            }}
          />
        </div>
      </section>

      {/* D. Sobre el proyecto y contacto */}
      <section aria-labelledby="sobre" className="grid gap-6 border-t border-zinc-200/80 pt-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] dark:border-zinc-800/80">
        <div>
          <h2 id="sobre" className="text-[18px] font-semibold tracking-tight">Por qué existe PAES Studio</h2>
          <div className="mt-3 max-w-[64ch] space-y-3 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              Preparar la PAES no debería depender de pagar un preuniversitario caro. PAES Studio nació para darte las pruebas
              reales del DEMRE explicadas con la paciencia y el detalle de un buen profe, gratis para siempre.
            </p>
            <p>
              Entra y entrena al tiro: sin crearte cuentas ni contraseñas. Tu progreso se guarda automáticamente aquí mismo (y
              puedes descargarlo si cambias de computador).
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-[#121215]">
          <h3 className="text-[15px] font-semibold tracking-tight">¿Viste un error o se te ocurrió una idea?</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            Escríbeme. Cada aviso ayuda a que esto funcione mejor para todos los que se están preparando.
          </p>
          <dl className="mt-4 space-y-3 text-[13px]">
            <div>
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">Autor</dt>
              <dd className="mt-0.5 font-medium">{CONTACT.author}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">Correo</dt>
              <dd className="mt-0.5">
                <a href={`mailto:${CONTACT.email}`} className="font-medium break-all underline-offset-4 hover:underline">{CONTACT.email}</a>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">GitHub</dt>
              <dd className="mt-0.5">
                <a href={CONTACT.github} target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline">
                  github.com/felS17
                  <span className="sr-only"> (abre en una pestaña nueva)</span>
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  )
}
