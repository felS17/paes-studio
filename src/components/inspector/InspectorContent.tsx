import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, X } from 'lucide-react'
import { Accuracy } from '@/components/dashboard/Accuracy'
import { DrillDialog } from '@/components/dashboard/SubtopicExplorer'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { ManimEmbed } from '@/components/manim/ManimEmbed'
import { SubtopicNoteView } from '@/components/zettelkasten/SubtopicNoteView'
import { cardLinksFor } from '@/data/flashcards/links'
import { SUBJECTS } from '@/data/subjects'
import { CROSS_LINKS, SUBTOPIC_OF_QUESTION, subtopicPdfHref, SUBTOPICS_BY_ID, TEMARIO_BY_SUBJECT } from '@/data/temario'
import { useSubtopicNotes } from '@/hooks/useSubtopicNotes'
import { useExamRoute } from '@/hooks/useWorkspace'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useInspectorStore, type InspectorTab, type InspectorTarget } from '@/store/useInspectorStore'
import type { SubjectId } from '@/types/exam'
import { latestResults, type LatestResult } from '@/utils/analytics'
import { formatPercent } from '@/utils/format'
import { GENERIC_TOPICS } from '@/utils/knowledgeGraph'
import { combineStats, subtopicStats, type SubtopicStat } from '@/utils/subtopics'
import { InspectorFlashcards } from './InspectorFlashcards'

// El formulario (KaTeX y sus tarjetas) se descarga solo si se abre esa pestaña.
const TopicCheatCards = lazy(() => import('@/components/cheatsheets/CheatSheets').then((m) => ({ default: m.TopicCheatCards })))

const pageHref = (pdf: string, page?: number) => (page ? `${pdf}#page=${page}` : pdf)

/** Lo que el Inspector necesita saber de su objetivo, sea un subtema, un eje o una asignatura. */
function resolveTarget(target: InspectorTarget) {
  if (target.kind === 'subtopic') {
    const sub = SUBTOPICS_BY_ID.get(target.id)
    if (!sub) return null
    return { subject: sub.subject, title: sub.title, context: sub.axis, subtopicIds: [sub.id], pdfHref: subtopicPdfHref(sub), pdfPage: sub.pdfPage, sub, axes: [] }
  }
  const temario = TEMARIO_BY_SUBJECT.get(target.subject)
  if (!temario) return null
  const onlyAxis = target.axis ? temario.axes.find((a) => a.name === target.axis) : undefined
  const axes = onlyAxis ? [onlyAxis] : temario.axes
  const firstPage = onlyAxis?.subtopics[0]?.pdfPage
  return {
    subject: target.subject,
    title: onlyAxis?.name ?? SUBJECTS[target.subject].name,
    context: onlyAxis ? SUBJECTS[target.subject].short : 'Materia completa',
    subtopicIds: axes.flatMap((a) => a.subtopics.map((s) => s.id)),
    pdfHref: pageHref(temario.pdf, firstPage),
    pdfPage: firstPage,
    sub: undefined,
    axes,
  }
}

function Mastery({ stat, questions }: { stat: SubtopicStat; questions: number }) {
  const items: [string, React.ReactNode, string?][] = [
    ['Tus aciertos aquí', stat.accuracy === null ? '—' : formatPercent(stat.accuracy), stat.answered ? `${stat.correct} de ${stat.answered} correctas` : 'Sin respuestas aún'],
    ['Respondidas', stat.answered, `de ${questions} disponibles`],
    ['Errores pendientes', stat.pending],
  ]
  return (
    <dl className="grid grid-cols-3 divide-x divide-zinc-200/80 dark:divide-zinc-800/80">
      {items.map(([label, value, note]) => (
        <div key={label} className="min-w-0 px-4 py-3">
          <dt className="truncate text-[11.5px] text-zinc-500 dark:text-zinc-400" title={label}>{label}</dt>
          <dd className="mt-0.5 font-mono text-[17px] font-medium tabular-nums">{value}</dd>
          {note && <dd className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400" title={note}>{note}</dd>}
        </div>
      ))}
    </dl>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-zinc-200/80 px-4 py-4 first:border-t-0 dark:border-zinc-800/80" aria-label={title}>
      <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  )
}

/** Conceptos que ya practicaste en el subtema (los mismos nodos del grafo) y sus enlaces con otros subtemas. */
function ZettelLinks({ id, subject, latest }: { id: string; subject: SubjectId; latest: Map<string, LatestResult> }) {
  const open = useInspectorStore((s) => s.openInspector)
  const concepts = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>()
    for (const [qid, r] of latest) {
      if (SUBTOPIC_OF_QUESTION.get(qid) !== id || r.selected === null) continue
      if (!r.topic || r.topic === r.axis || GENERIC_TOPICS.has(r.topic)) continue
      const c = map.get(r.topic) ?? { correct: 0, total: 0 }
      c.total += 1
      if (r.isCorrect) c.correct += 1
      map.set(r.topic, c)
    }
    return [...map.entries()].sort((a, b) => b[1].total - a[1].total).slice(0, 8)
  }, [id, latest])
  const cross = CROSS_LINKS.flatMap((l) => (l.a === id ? [{ id: l.b, why: l.why }] : l.b === id ? [{ id: l.a, why: l.why }] : []))
  return (
    <Block title="Lo que ya has practicado aquí">
      {concepts.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {concepts.map(([topic, c]) => (
            <li key={topic} className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200/80 bg-zinc-100 px-1.5 py-0.5 text-[11.5px] font-medium text-zinc-800 dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-200">
              {topic}
              <span className="font-mono font-normal text-zinc-500 tabular-nums dark:text-zinc-400">{c.correct}/{c.total}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Aparecerá a medida que respondas preguntas de este tema.</p>
      )}
      {cross.length > 0 && (
        <ul className="mt-3 space-y-2">
          {cross.map((c) => {
            const s = SUBTOPICS_BY_ID.get(c.id)
            if (!s) return null
            return (
              <li key={c.id} className="text-[13px]">
                <button type="button" onClick={() => open({ kind: 'subtopic', id: c.id })} className="font-medium underline-offset-4 hover:underline">
                  {s.title}
                </button>
                <span className="text-zinc-500 dark:text-zinc-400"> ({SUBJECTS[s.subject].short}). {c.why}</span>
              </li>
            )
          })}
        </ul>
      )}
      <Link to={`/zettelkasten?asignatura=${subject}`} className="mt-3 inline-block text-xs text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100">
        Ver en el mapa
      </Link>
    </Block>
  )
}

function PdfViewer({ href, label }: { href: string; label: string }) {
  // El ajuste al ancho hace legible el compendio en un panel angosto.
  const src = `${href}${href.includes('#') ? '&' : '#'}view=FitH`
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200/80 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
        <span className="min-w-0 truncate">{label}</span>
        <a href={href} target="_blank" rel="noreferrer" className="flex shrink-0 items-center gap-1.5 font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-100">
          Abrir en pestaña completa
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only"> (abre en una pestaña nueva)</span>
        </a>
      </div>
      <iframe key={src} src={src} title={label} className="min-h-0 w-full flex-1 bg-white" />
      <p className="shrink-0 border-t border-zinc-200/80 px-4 py-2 text-[11.5px] text-zinc-500 lg:hidden dark:border-zinc-800/80 dark:text-zinc-400">
        Si el PDF no se ve aquí, ábrelo en una pestaña completa.
      </p>
    </div>
  )
}

/** Contenido del Inspector: ficha conceptual, visor del compendio y flashcards del subtema, eje o asignatura. */
export function InspectorContent() {
  const target = useInspectorStore((s) => s.target)
  const tab = useInspectorStore((s) => s.tab)
  const setTab = useInspectorStore((s) => s.setTab)
  const close = useInspectorStore((s) => s.closeInspector)
  const open = useInspectorStore((s) => s.openInspector)
  const attempts = useAnalyticsStore((s) => s.attempts)
  const notes = useSubtopicNotes()
  const { running } = useExamRoute()
  const [drillOpen, setDrillOpen] = useState(false)
  const latest = useMemo(() => latestResults(attempts), [attempts])
  const stats = useMemo(() => subtopicStats(attempts, latest), [attempts, latest])

  const info = useMemo(() => (target ? resolveTarget(target) : null), [target])
  const links = useMemo(() => cardLinksFor(info?.subtopicIds ?? []), [info])
  if (!target || !info) return null

  const stat = combineStats(info.subtopicIds, stats)
  const questions = info.subtopicIds.reduce((n, id) => n + (SUBTOPICS_BY_ID.get(id)?.questionCount ?? 0), 0)
  const items: { value: InspectorTab; label: string }[] = [
    { value: 'ficha', label: 'Resumen y fórmulas' },
    { value: 'pdf', label: 'Guía en PDF' },
    { value: 'flashcards', label: 'Tarjetas rápidas' },
    { value: 'formulario', label: 'Formulario' },
  ]

  return (
    <>
      <div className="flex shrink-0 items-start gap-3 border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800/80">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {target.kind === 'subtopic' ? (
              <button type="button" onClick={() => open({ kind: 'subject', subject: info.subject, axis: info.context })} className="underline-offset-4 hover:text-zinc-900 hover:underline dark:hover:text-zinc-100">
                {SUBJECTS[info.subject].short}, {info.context}
              </button>
            ) : info.context}
          </p>
          <h2 className="mt-0.5 text-[15px] leading-snug font-semibold tracking-tight">{info.title}</h2>
        </div>
        {info.sub && !running && (
          <Button size="sm" onClick={() => setDrillOpen(true)} disabled={!info.sub.questionCount}>Practicar</Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Cerrar el resumen" title="Cerrar el resumen (Esc)"><X /></Button>
      </div>

      <Tabs<InspectorTab>
        label="Contenido del resumen"
        value={tab}
        onChange={setTab}
        items={items}
        className="flex min-h-0 flex-1 flex-col"
        listClassName="mx-0 shrink-0 px-2.5 pt-2"
        panelClassName="min-h-0 flex-1 overflow-y-auto pt-0"
      >
        {tab === 'ficha' && (
          <>
            <Mastery stat={stat} questions={questions} />
            {info.sub ? (
              <>
                <ManimEmbed subtopics={[info.sub.id]} className="px-4 pt-3" />
                <Block title="Resumen del tema">
                  <SubtopicNoteView id={info.sub.id} notes={notes} />
                </Block>
                <ZettelLinks id={info.sub.id} subject={info.subject} latest={latest} />
              </>
            ) : (
              info.axes.map((axis) => (
                <Block key={axis.name} title={axis.name}>
                  {axis.description && <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">{axis.description}</p>}
                  <ul className="mt-1.5 divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                    {axis.subtopics.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => open({ kind: 'subtopic', id: s.id })}
                          className="flex w-full items-center gap-3 py-2 text-left text-[13px] transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          <span className="min-w-0 flex-1 truncate">{s.title}</span>
                          <Accuracy stat={stats.get(s.id)} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </Block>
              ))
            )}
          </>
        )}
        {tab === 'pdf' && (
          <PdfViewer
            href={info.pdfHref}
            label={`Guía de ${SUBJECTS[info.subject].short}${info.pdfPage ? `, p. ${info.pdfPage}` : ''}`}
          />
        )}
        {tab === 'flashcards' && <InspectorFlashcards links={links} />}
        {tab === 'formulario' && (
          <Suspense fallback={<p className="p-4 text-[13px] text-zinc-500" role="status">Cargando…</p>}>
            <TopicCheatCards subtopicIds={info.subtopicIds} />
          </Suspense>
        )}
      </Tabs>

      {info.sub && !running && (
        <DrillDialog subtopic={drillOpen ? info.sub : null} onClose={() => setDrillOpen(false)} />
      )}
    </>
  )
}
