import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Panel } from '@/components/ui/panel'
import { Segmented } from '@/components/ui/segmented'
import { KnowledgeGraph } from '@/components/zettelkasten/KnowledgeGraph'
import { NodeDrawer } from '@/components/zettelkasten/NodeDrawer'
import { SUBJECTS, SUBJECT_ORDER } from '@/data/subjects'
import { SUBTOPICS } from '@/data/temario'
import { useElementWidth } from '@/hooks/useElementWidth'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import type { SubjectId } from '@/types/exam'
import { latestResults } from '@/utils/analytics'
import { buildKnowledgeGraph, type KNode } from '@/utils/knowledgeGraph'
import { masteryOf, subtopicStats } from '@/utils/subtopics'

type SubjectFilter = SubjectId | 'todas'

/** Muestras de la leyenda: el mismo trazo que el canvas, dibujado con CSS. */
function Swatch({ kind }: { kind: 'faint' | 'mid' | 'strong' | 'pending' | 'correct' | 'incorrect' | 'cross' }) {
  if (kind === 'cross') return <span aria-hidden className="w-5 border-t border-dashed border-zinc-500" />
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-2.5 rounded-full border',
        kind === 'faint' && 'border-zinc-300 bg-white dark:border-zinc-600 dark:bg-[#121215]',
        kind === 'mid' && 'border-zinc-500 bg-zinc-500 dark:border-zinc-400 dark:bg-zinc-400',
        kind === 'strong' && 'border-zinc-900 bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100',
        kind === 'pending' && 'border-dashed border-zinc-900 bg-white outline-1 outline-offset-1 outline-zinc-900 outline-dashed dark:border-zinc-100 dark:bg-transparent dark:outline-zinc-100',
        kind === 'correct' && 'size-2 border-emerald-500 bg-emerald-500',
        kind === 'incorrect' && 'size-2 border-[1.5px] border-rose-500 bg-white dark:bg-transparent',
      )}
    />
  )
}

/**
 * Zettelkasten: red de conocimiento Asignatura → Eje → Subtema que crece con tus preguntas resueltas, con
 * enlaces cruzados entre subtemas afines de distintas asignaturas.
 */
export function ZettelkastenPage() {
  const [params, setParams] = useSearchParams()
  const subjectParam = params.get('asignatura')
  const subject: SubjectFilter = SUBJECT_ORDER.includes(subjectParam as SubjectId) ? (subjectParam as SubjectId) : 'todas'
  const showQuestions = params.get('preguntas') !== 'no'
  const attempts = useAnalyticsStore((s) => s.attempts)
  const { resolved } = useTheme()
  const [setEl, width] = useElementWidth()
  const [selected, setSelected] = useState<KNode | null>(null)

  const latest = useMemo(() => latestResults(attempts), [attempts])
  const stats = useMemo(() => subtopicStats(attempts, latest), [attempts, latest])
  const data = useMemo(() => buildKnowledgeGraph({ stats, latest, subject, showQuestions }), [stats, latest, subject, showQuestions])

  const summary = useMemo(() => {
    const scoped = SUBTOPICS.filter((s) => subject === 'todas' || s.subject === subject)
    const m = scoped.map((s) => masteryOf(stats.get(s.id)))
    return {
      total: scoped.length,
      explored: m.filter((x) => x !== 'sin-explorar').length,
      mastered: m.filter((x) => x === 'dominado').length,
      pending: scoped.reduce((n, s) => n + (stats.get(s.id)?.pending ?? 0), 0),
      questions: data.nodes.filter((n) => n.kind === 'question').length,
    }
  }, [data, stats, subject])

  const update = (patch: Record<string, string | null>) => {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) p.delete(k)
      else p.set(k, v)
    }
    setParams(p, { replace: true })
  }

  const navigateTo = useCallback(
    (id: string) => {
      const node = data.nodes.find((n) => n.id === id)
      if (node) {
        setSelected(node)
        // Desde la lista o un enlace del panel: el grafo vuelve a la vista para mostrar el nodo resaltado.
        document.getElementById('zk-grafo')?.scrollIntoView({
          block: 'nearest',
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        })
      }
      else if (subject !== 'todas') update({ asignatura: null })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, subject],
  )

  const height = Math.max(460, Math.min(760, Math.round(window.innerHeight * 0.68)))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mapa de Conocimiento"
        description={
          <>
            Los <span className="tabular-nums">{SUBTOPICS.length}</span> temas de la PAES en un mapa que crece contigo: cada
            pregunta que respondes se suma a su tema, y las líneas punteadas muestran cómo se conectan las materias. Toca un
            punto para leer su resumen, ver tus preguntas y ponerte a practicar.
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<SubjectFilter>
          label="Asignatura"
          className="max-w-full overflow-x-auto"
          value={subject}
          onChange={(v) => {
            setSelected(null)
            update({ asignatura: v === 'todas' ? null : v })
          }}
          options={[{ value: 'todas', label: 'Todas' }, ...SUBJECT_ORDER.map((id) => ({ value: id, label: SUBJECTS[id].short }))]}
        />
        <Segmented<'si' | 'no'>
          label="Preguntas resueltas en el mapa"
          className="max-w-full overflow-x-auto"
          value={showQuestions ? 'si' : 'no'}
          onChange={(v) => update({ preguntas: v === 'no' ? 'no' : null })}
          options={[
            { value: 'si', label: 'Con preguntas resueltas' },
            { value: 'no', label: 'Solo temario' },
          ]}
        />
      </div>

      <Panel className="overflow-hidden">
        <dl className="grid grid-cols-2 border-b border-zinc-200/80 sm:grid-cols-4 dark:border-zinc-800/80">
          {(
            [
              ['Temas explorados', `${summary.explored}/${summary.total}`],
              ['Dominados', summary.mastered],
              ['Errores pendientes', summary.pending],
              ['Preguntas en tu mapa', summary.questions],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="border-zinc-200/80 px-5 py-3 not-last:border-r max-sm:odd:border-r max-sm:[&:nth-child(-n+2)]:border-b dark:border-zinc-800/80">
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
              <dd className="mt-0.5 font-mono text-[17px] font-medium tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
        <div ref={setEl} id="zk-grafo" className="relative scroll-mt-6" style={{ height }} aria-label="Mapa de conocimiento" role="img">
          {width > 0 && (
            <KnowledgeGraph
              data={data}
              width={width}
              height={height}
              dark={resolved === 'dark'}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
          )}
          {!attempts.length && (
            <p className="pointer-events-none absolute inset-x-0 bottom-4 mx-auto w-fit max-w-[90%] rounded-lg border border-zinc-200/80 bg-white/90 px-3 py-2 text-center text-xs text-zinc-600 dark:border-zinc-800/80 dark:bg-[#121215]/90 dark:text-zinc-400">
              Tu mapa te está esperando: responde una práctica o un ensayo y tus preguntas aparecerán aquí, conectadas a su tema.
            </p>
          )}
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-zinc-200/80 px-5 py-3 text-xs text-zinc-600 dark:border-zinc-800/80 dark:text-zinc-400" aria-label="Leyenda">
          <li className="flex items-center gap-2"><Swatch kind="faint" />Sin explorar</li>
          <li className="flex items-center gap-2"><Swatch kind="mid" />En progreso</li>
          <li className="flex items-center gap-2"><Swatch kind="strong" />Dominado: 80 % o más, sin errores pendientes</li>
          <li className="flex items-center gap-2"><Swatch kind="pending" />Con errores por repasar</li>
          <li className="flex items-center gap-2"><Swatch kind="correct" />Respuesta correcta</li>
          <li className="flex items-center gap-2"><Swatch kind="incorrect" />Respuesta incorrecta</li>
          <li className="flex items-center gap-2"><Swatch kind="cross" />Enlace entre materias</li>
        </ul>
      </Panel>

      <section aria-labelledby="zk-lista" className="space-y-2">
        <h2 id="zk-lista" className="px-1 text-[14px] font-semibold tracking-tight">Abrir un tema</h2>
        <p className="px-1 text-[13px] text-zinc-500 dark:text-zinc-400">
          El mismo mapa en forma de lista, para navegar con teclado o lector de pantalla.
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {SUBTOPICS.filter((s) => subject === 'todas' || s.subject === subject).map((s) => {
            const m = masteryOf(stats.get(s.id))
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => navigateTo(`t:${s.id}`)}
                  className={cn(
                    'rounded-md border px-2 py-1 text-[12px] transition-colors',
                    m === 'dominado'
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : m === 'en-progreso'
                        ? 'border-zinc-300 bg-white text-zinc-900 hover:border-zinc-400 dark:border-zinc-700 dark:bg-[#121215] dark:text-zinc-100'
                        : 'border-zinc-200/80 text-zinc-500 hover:text-zinc-900 dark:border-zinc-800/80 dark:text-zinc-400 dark:hover:text-zinc-100',
                    (stats.get(s.id)?.pending ?? 0) > 0 && 'border-dashed',
                  )}
                >
                  {s.title}
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <NodeDrawer node={selected} stats={stats} latest={latest} onClose={() => setSelected(null)} onNavigate={navigateTo} />
    </div>
  )
}
