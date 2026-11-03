import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { BarChart3, FileText, Layers, LayoutList, ListTree, Waypoints, type LucideIcon } from 'lucide-react'
import { DailyChallenge } from '@/components/dashboard/DailyChallenge'
import { SubtopicExplorer } from '@/components/dashboard/SubtopicExplorer'
import { LogoMark } from '@/components/layout/Logo'
import { EXAMS } from '@/data/catalog'
import { TOTAL_CARDS } from '@/data/flashcards'
import pdfs from '@/data/pdfs.json'
import { SUBJECT_ORDER } from '@/data/subjects'
import { SUBTOPICS } from '@/data/temario'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import type { SubjectId } from '@/types/exam'
import { latestResults, mistakeNotebook } from '@/utils/analytics'
import { masteryOf, subtopicStats } from '@/utils/subtopics'

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

  const progress = useMemo(() => {
    const latest = latestResults(attempts)
    const stats = subtopicStats(attempts, latest)
    const mastery = SUBTOPICS.map((s) => masteryOf(stats.get(s.id)))
    return {
      explored: mastery.filter((m) => m !== 'sin-explorar').length,
      mastered: mastery.filter((m) => m === 'dominado').length,
      mistakes: mistakeNotebook(attempts).length,
    }
  }, [attempts])

  const questions = EXAMS.reduce((n, e) => n + e.questionCount, 0)
  const pdfCount = Object.keys(pdfs).length
  const metrics: [number, string][] = [
    [EXAMS.length, 'Ensayos'],
    [questions, 'Preguntas'],
    [SUBTOPICS.length, 'Subtemas'],
    [TOTAL_CARDS, 'Flashcards'],
    [pdfCount, 'PDF de estudio'],
  ]

  const modules: ModuleCard[] = [
    {
      to: '/ensayos', title: 'Catálogo de ensayos', icon: LayoutList, span: 'lg:col-span-2',
      description: 'Rinde los ensayos oficiales del DEMRE y los curados en modo práctica, con corrección inmediata, o en modo ensayo con el tiempo oficial.',
      datum: `${EXAMS.length} ensayos, ${attempts.length} ${attempts.length === 1 ? 'intento guardado' : 'intentos guardados'}`,
    },
    {
      to: '/subtemas', title: 'Explorador de subtemas', icon: ListTree, span: '',
      description: 'Asignatura, eje y subtema: arma un drill de 10, 20 o todas las preguntas de un tema.',
      datum: `${progress.explored} de ${SUBTOPICS.length} explorados`,
    },
    {
      to: '/flashcards', title: 'Flashcards SM-2', icon: Layers, span: '',
      description: 'Repaso espaciado para Matemática M1 y M2, Biología, Física, Química e Historia.',
      datum: `${TOTAL_CARDS} tarjetas en 6 mazos`,
    },
    {
      to: '/zettelkasten', title: 'Zettelkasten: red de conocimiento', icon: Waypoints, span: 'lg:col-span-2',
      description: 'Un grafo de tu dominio del temario: cada pregunta que respondes se conecta a su subtema, y las ideas que comparten las materias quedan enlazadas.',
      datum: `${progress.mastered} ${progress.mastered === 1 ? 'subtema dominado' : 'subtemas dominados'}`,
    },
    {
      to: '/analitica', title: 'Analítica y cuaderno de errores', icon: BarChart3, span: 'lg:col-span-2',
      description: 'Tu evolución en la escala 100–1000, los ejes por mejorar, las preguntas que fallaste con su solución y el modo revancha.',
      datum: `${progress.mistakes} ${progress.mistakes === 1 ? 'pregunta por repasar' : 'preguntas por repasar'}`,
    },
    {
      to: '/material', title: 'Biblioteca LaTeX y Beamer', icon: FileText, span: '',
      description: 'Compendios teóricos y presentaciones de cada asignatura, listos para leer o descargar en PDF.',
      datum: `${pdfCount} PDF`,
    },
  ]

  return (
    <div className="space-y-14">
      {/* A. Presentación y métricas */}
      <section aria-labelledby="hero" className="space-y-8">
        <div className="max-w-3xl">
          <p className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
            <LogoMark className="size-5" />
            PAES Studio
          </p>
          <h1 id="hero" className="mt-5 text-[34px] leading-[1.08] font-semibold tracking-[-0.025em] text-balance sm:text-[46px]">
            Plataforma abierta de entrenamiento de alta precisión para la PAES
          </h1>
          <p className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Un entorno de estudio gratuito, sin anuncios ni muros de pago. Reúne las pruebas oficiales del DEMRE con su
            clavijero, soluciones paso a paso con fórmulas en KaTeX, repetición espaciada SM-2 y una red de conocimiento que
            conecta los subtemas de todas las asignaturas. Tu progreso se guarda solo en este navegador.
          </p>
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
        <h2 id="modulos" className="text-[18px] font-semibold tracking-tight">Módulos</h2>
        <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">Todo lo que ofrece la plataforma, a un clic.</p>
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
        <h2 id="mapa-subtemas" className="text-[18px] font-semibold tracking-tight">Mapa de los {SUBTOPICS.length} subtemas</h2>
        <p className="mt-1 max-w-[70ch] text-[13px] text-zinc-500 dark:text-zinc-400">
          Elige una asignatura, revisa sus ejes y lanza un drill de cualquier subtema o ábrelo en su compendio.
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
          <h2 id="sobre" className="text-[18px] font-semibold tracking-tight">Sobre PAES Studio</h2>
          <div className="mt-3 max-w-[64ch] space-y-3 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              PAES Studio nació para que cualquier estudiante pueda prepararse con el mismo material que publica el DEMRE,
              explicado con el detalle de un buen profesor y sin pagar por ello. Es un proyecto abierto bajo licencia MIT
              (2026): el código se puede leer, usar y mejorar.
            </p>
            <p>
              No hay cuentas ni servidores: tus ensayos, errores, flashcards y racha viven en tu navegador. Desde Analítica
              puedes exportar un respaldo e importarlo en otro equipo.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 dark:border-zinc-800/80 dark:bg-[#121215]">
          <h3 className="text-[15px] font-semibold tracking-tight">Contacto y contribuciones</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            ¿Encontraste un error en una solución o tienes una idea? Escribe o abre un issue.
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
