import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Segmented } from '@/components/ui/segmented'
import { Accuracy } from '@/components/dashboard/Accuracy'
import { TopicBrowser } from '@/components/dashboard/TopicBrowser'
import { KnowledgeGraph } from '@/components/zettelkasten/KnowledgeGraph'
import { NodeDrawer } from '@/components/zettelkasten/NodeDrawer'
import { SUBJECT_ORDER, SUBJECT_TABS } from '@/data/subjects'
import { useElementWidth } from '@/hooks/useElementWidth'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import type { SubjectId } from '@/types/exam'
import { latestResults } from '@/utils/analytics'
import { buildKnowledgeGraph, type KNode } from '@/utils/knowledgeGraph'
import { subtopicStats } from '@/utils/subtopics'

type SubjectFilter = SubjectId | 'todas'

/** Muestras de la leyenda: el mismo trazo que el canvas, dibujado con CSS. */
function Swatch({ kind }: { kind: 'faint' | 'mid' | 'strong' | 'pending' | 'correct' | 'incorrect' | 'cross' }) {
  if (kind === 'cross') return <span aria-hidden className="w-5 border-t border-dashed border-zinc-500" />
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-2.5 rounded-full border',
        kind === 'faint' && 'border-zinc-300 bg-surface dark:border-zinc-600',
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
  /** Materia de la lista cuando el mapa muestra todas. */
  const [listSubject, setListSubject] = useState<SubjectId>(SUBJECT_TABS[0])
  /** La lista de temas no se monta hasta que la abres. */
  const [listOpen, setListOpen] = useState(false)

  const latest = useMemo(() => latestResults(attempts), [attempts])
  const stats = useMemo(() => subtopicStats(attempts, latest), [attempts, latest])
  const data = useMemo(() => buildKnowledgeGraph({ stats, latest, subject, showQuestions }), [stats, latest, subject, showQuestions])

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

  // El mapa ocupa casi toda la pantalla: solo le quedan arriba los controles y abajo la línea de la lista.
  const height = Math.max(420, window.innerHeight - 190)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-[20px] font-semibold tracking-tight">mapa</h1>
        <Segmented<SubjectFilter>
          label="Materia"
          className="max-w-full overflow-x-auto"
          value={subject}
          onChange={(v) => {
            setSelected(null)
            update({ asignatura: v === 'todas' ? null : v })
          }}
          options={[{ value: 'todas', label: 'todas' }, ...SUBJECT_TABS.map((id) => ({ value: id, label: id }))]}
        />
        <Segmented<'si' | 'no'>
          label="Preguntas resueltas en el mapa"
          size="sm"
          className="max-w-full overflow-x-auto sm:ml-auto"
          value={showQuestions ? 'si' : 'no'}
          onChange={(v) => update({ preguntas: v === 'no' ? 'no' : null })}
          options={[
            { value: 'si', label: 'con preguntas' },
            { value: 'no', label: 'solo temario' },
          ]}
        />
      </div>

      <div className="relative overflow-hidden rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
        <div ref={setEl} id="zk-grafo" className="relative scroll-mt-6" style={{ height }} aria-label="Mapa de conocimiento" role="img">
          {width > 0 && (
            <KnowledgeGraph
              data={data}
              width={width}
              height={height}
              theme={resolved}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
          )}
        </div>
        <details className="absolute bottom-2 left-2 rounded-md border border-zinc-200/80 bg-surface/90 text-[12px] text-zinc-600 dark:border-zinc-800/80 dark:text-zinc-400">
          <summary className="cursor-pointer rounded-md px-2 py-1 font-mono">leyenda</summary>
          <ul className="space-y-1 border-t border-zinc-200/80 px-2 py-2 dark:border-zinc-800/80" aria-label="Leyenda">
            <li className="flex items-center gap-2"><Swatch kind="faint" />sin explorar</li>
            <li className="flex items-center gap-2"><Swatch kind="mid" />en progreso</li>
            <li className="flex items-center gap-2"><Swatch kind="strong" />dominado: 75 % o más</li>
            <li className="flex items-center gap-2"><Swatch kind="pending" />con errores por repasar</li>
            <li className="flex items-center gap-2"><Swatch kind="correct" />respuesta correcta</li>
            <li className="flex items-center gap-2"><Swatch kind="incorrect" />respuesta incorrecta</li>
            <li className="flex items-center gap-2"><Swatch kind="cross" />enlace entre materias</li>
          </ul>
        </details>
      </div>

      <details onToggle={(e) => setListOpen(e.currentTarget.open)}>
        <summary className="cursor-pointer rounded-sm py-1 font-mono text-[12.5px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">ver lista de temas</summary>
        {listOpen && (
          <div className="mt-2">
            <TopicBrowser
              subject={subject === 'todas' ? listSubject : subject}
              onSubjectChange={(s) => {
                setListSubject(s)
                if (subject !== 'todas') {
                  setSelected(null)
                  update({ asignatura: s })
                }
              }}
              stats={stats}
              renderRow={(sub, stat) => (
                <li key={sub.id}>
                  <button
                    type="button"
                    onClick={() => navigateTo(`t:${sub.id}`)}
                    className="flex min-h-9 w-full items-center gap-2 py-1 pl-6 text-left text-[13px] transition-colors hover:bg-zinc-900/[0.02] dark:hover:bg-zinc-100/[0.03]"
                  >
                    <span className="min-w-0 flex-1 sm:truncate">{sub.title}</span>
                    <Accuracy stat={stat} />
                    <span aria-hidden className="w-[4.75rem] shrink-0" />
                  </button>
                </li>
              )}
            />
          </div>
        )}
      </details>

      <NodeDrawer node={selected} stats={stats} latest={latest} onClose={() => setSelected(null)} onNavigate={navigateTo} />
    </div>
  )
}
