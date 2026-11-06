import { useEffect, useMemo, useState } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Check, ChevronRight, X } from 'lucide-react'
import { Accuracy } from '@/components/dashboard/Accuracy'
import { QuestionCard } from '@/components/exam/QuestionCard'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { Tag } from '@/components/ui/subject-tag'
import { loadExam } from '@/data/catalog'
import { SUBJECTS } from '@/data/subjects'
import { CROSS_LINKS, SUBTOPIC_OF_QUESTION, subtopicPdfHref, SUBTOPICS_BY_ID, TEMARIO_BY_SUBJECT } from '@/data/temario'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import { useSubtopicNotes } from '@/hooks/useSubtopicNotes'
import { cn } from '@/lib/utils'
import type { Question } from '@/types/exam'
import type { LatestResult } from '@/utils/analytics'
import { formatPercent, plural } from '@/utils/format'
import { nodeId, questionCaption, subtopicsUnder, type KNode } from '@/utils/knowledgeGraph'
import { SubtopicNoteView } from './SubtopicNoteView'
import { combineStats, drillDraftFor, questionCountOf, type DrillSize, type SubtopicStat } from '@/utils/subtopics'

const KIND_LABEL: Record<KNode['kind'], string> = {
  subject: 'Asignatura',
  axis: 'Eje temático',
  subtopic: 'Tema',
  concept: 'Concepto clave',
  question: 'Pregunta resuelta',
}

const examOf = (qid: string) => qid.replace(/-q\d+$/, '')

/** Carga bajo demanda las preguntas (con su solución) de los ensayos involucrados. */
function useQuestions(qids: string[]): Map<string, Question> | null {
  const key = qids.join('|')
  const [state, setState] = useState<{ key: string; map: Map<string, Question> } | null>(null)
  useEffect(() => {
    if (!key) return
    let alive = true
    const wanted = new Set(key.split('|'))
    Promise.all([...new Set([...wanted].map(examOf))].map((id) => loadExam(id).catch(() => null))).then((exams) => {
      if (!alive) return
      const map = new Map<string, Question>()
      for (const exam of exams) for (const q of exam?.questions ?? []) if (wanted.has(q.id)) map.set(q.id, q)
      setState({ key, map })
    })
    return () => {
      alive = false
    }
  }, [key])
  if (!key) return new Map()
  return state?.key === key ? state.map : null
}

function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('border-t border-zinc-200/80 px-5 py-4 dark:border-zinc-800/80', className)} aria-label={title}>
      <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  )
}

function Metrics({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 border-t border-zinc-200/80 sm:grid-cols-4 dark:border-zinc-800/80">
      {items.map(([label, value]) => (
        <div key={label} className="border-zinc-200/80 px-5 py-3 not-last:border-r max-sm:odd:border-r max-sm:[&:nth-child(-n+2)]:border-b dark:border-zinc-800/80">
          <dt className="text-[11.5px] text-zinc-500 dark:text-zinc-400">{label}</dt>
          <dd className="mt-0.5 font-mono text-[16px] font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Historial de preguntas respondidas en el nodo, con la pregunta y su solución KaTeX al expandir. */
function AnsweredList({ entries }: { entries: [string, LatestResult][] }) {
  const shown = entries.slice(0, 15)
  const questions = useQuestions(shown.map(([qid]) => qid))
  const [openChoice, setOpen] = useState<string | null | undefined>(undefined)
  const firstError = shown.find(([, r]) => !r.isCorrect)?.[0] ?? null
  const open = openChoice === undefined ? firstError : openChoice
  if (!entries.length) {
    return <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Aún no respondes preguntas de aquí. Practica un poco y aparecerán en tu mapa.</p>
  }
  return (
    <ul className="-mx-1 space-y-1">
      {shown.map(([qid, r]) => {
        const q = questions?.get(qid)
        const isOpen = open === qid
        return (
          <li key={qid} className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : qid)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[12.5px]"
            >
              <ChevronRight className={cn('size-3.5 shrink-0 text-zinc-400 transition-transform duration-150', isOpen && 'rotate-90')} />
              <span className="min-w-0 flex-1 truncate">{questionCaption(qid)}</span>
              <span className={cn('flex shrink-0 items-center gap-1 text-[11.5px] font-medium', r.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400')}>
                {r.isCorrect ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                {r.isCorrect ? 'Correcta' : `Marcaste ${r.selected}`}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-zinc-200/80 px-3 py-4 dark:border-zinc-800/80">
                {q ? (
                  <QuestionCard
                    question={q}
                    mode="revision"
                    position={q.number}
                    total={q.number}
                    selected={r.selected ?? undefined}
                    revealed
                    flagged={false}
                  />
                ) : (
                  <p className="text-[13px] text-zinc-500">{questions ? 'No se encontró la pregunta en el catálogo.' : 'Cargando la pregunta…'}</p>
                )}
              </div>
            )}
          </li>
        )
      })}
      {entries.length > shown.length && (
        <li className="px-1 pt-1 text-xs text-zinc-500 dark:text-zinc-400">
          y {plural(entries.length - shown.length, 'pregunta más', 'preguntas más')}; la práctica las incluye.
        </li>
      )}
    </ul>
  )
}

interface DrawerProps {
  node: KNode | null
  stats: Map<string, SubtopicStat>
  latest: Map<string, LatestResult>
  onClose: () => void
  /** Selecciona otro nodo (enlaces del Zettelkasten). */
  onNavigate: (id: string) => void
}

/** Panel lateral editorial: métricas de dominio, nota del concepto, preguntas respondidas y drill del nodo. */
export function NodeDrawer({ node, stats, latest, onClose, onNavigate }: DrawerProps) {
  const notes = useSubtopicNotes()
  const startPractice = useStartPracticeSet()
  const [size, setSize] = useState<DrillSize>(10)

  const subtopicIds = useMemo(() => (node ? subtopicsUnder(node) : []), [node])
  const entries = useMemo(() => {
    if (!node) return []
    const ids = new Set(subtopicIds)
    return [...latest.entries()]
      .filter(([qid, r]) => {
        if (r.selected === null || !ids.has(SUBTOPIC_OF_QUESTION.get(qid) ?? '')) return false
        if (node.kind === 'question') return qid === node.questionId
        if (node.kind === 'concept') return r.topic === node.label
        return true
      })
      .sort((a, b) => Number(a[1].isCorrect) - Number(b[1].isCorrect) || b[1].at - a[1].at)
  }, [latest, node, subtopicIds])

  if (!node) return null
  const stat = combineStats(subtopicIds, stats)
  const bank = questionCountOf(subtopicIds)
  const sub = node.subtopicId ? SUBTOPICS_BY_ID.get(node.subtopicId) : undefined
  const title = node.kind === 'question' && node.questionId ? questionCaption(node.questionId) : node.label
  const drillTitle = node.kind === 'subject' ? `Práctica de ${SUBJECTS[node.subject].short}` : sub?.title ?? node.label
  const result = node.kind === 'question' && node.questionId ? latest.get(node.questionId) : undefined
  const cross = sub ? CROSS_LINKS.filter((l) => l.a === sub.id || l.b === sub.id).map((l) => ({ id: l.a === sub.id ? l.b : l.a, why: l.why })) : []
  const temario = TEMARIO_BY_SUBJECT.get(node.subject)

  const launch = () =>
    startPractice(
      drillDraftFor(subtopicIds, size, latest, {
        subject: node.subject,
        title: drillTitle,
        scope: sub ? `«${sub.title}» (${SUBJECTS[sub.subject].short})` : node.kind === 'axis' ? `${node.axis} (${SUBJECTS[node.subject].short})` : SUBJECTS[node.subject].name,
      }),
    )

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()} modal={false}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          onInteractOutside={(e) => e.preventDefault()}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-y-0 right-0 z-40 flex w-[min(31rem,100vw)] flex-col border-l border-zinc-200/80 bg-surface data-[state=open]:animate-fade-in dark:border-zinc-800/80"
        >
          <div className="flex items-start gap-3 px-5 pt-4 pb-3">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5">
                <Tag>{KIND_LABEL[node.kind]}</Tag>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {SUBJECTS[node.subject].short}
                  {node.axis && node.kind !== 'axis' ? `, ${node.axis}` : ''}
                </span>
              </p>
              <DialogPrimitive.Title className="mt-2 text-[17px] leading-snug font-semibold tracking-tight">{title}</DialogPrimitive.Title>
              <DialogPrimitive.Description className="mt-1 text-[12.5px] text-zinc-500 dark:text-zinc-400">
                {node.kind === 'concept' && sub ? `Concepto de «${sub.title}» que aparece en tus preguntas respondidas.` : null}
                {node.kind === 'question' && sub ? `Tema: ${sub.title}.` : null}
                {node.kind === 'axis' ? temario?.axes.find((a) => a.name === node.axis)?.description : null}
                {node.kind === 'subject' ? temario?.name : null}
                {node.kind === 'subtopic' && sub ? (
                  <a href={subtopicPdfHref(sub)} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-zinc-900 hover:underline dark:hover:text-zinc-100">
                    Guía de {SUBJECTS[sub.subject].short}{sub.pdfPage ? `, página ${sub.pdfPage}` : ''}
                    <span className="sr-only"> (abre en una pestaña nueva)</span>
                  </a>
                ) : null}
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="rounded-md p-1 text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100" aria-label="Cerrar panel">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {result ? (
              <Metrics
                items={[
                  ['Resultado', result.isCorrect ? 'Correcta' : 'Incorrecta'],
                  ['Marcaste', result.selected ?? '—'],
                  ['Clave', result.correct],
                  ['Subtema', formatPercent(stats.get(node.subtopicId ?? '')?.accuracy ?? 0)],
                ]}
              />
            ) : (
              <Metrics
                items={[
                  ['Disponibles', bank.toLocaleString('es-CL')],
                  ['Respondidas', stat.answered],
                  ['Acierto', stat.accuracy === null ? '—' : formatPercent(stat.accuracy)],
                  ['Por repasar', stat.pending],
                ]}
              />
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200/80 px-5 py-3 dark:border-zinc-800/80">
              <Segmented<string>
                label="Cantidad de preguntas"
                size="sm"
                value={String(size)}
                onChange={(v) => setSize(v === 'todas' ? 'todas' : (Number(v) as 10 | 20))}
                options={[
                  { value: '10', label: '10' },
                  { value: '20', label: '20' },
                  { value: 'todas', label: `Todas (${bank})` },
                ]}
              />
              <Button variant="primary" size="sm" onClick={launch} disabled={!bank} className="ml-auto">
                Empezar a practicar
              </Button>
            </div>

            {(node.kind === 'subtopic' || node.kind === 'concept' || node.kind === 'question') && node.subtopicId && (
              <Section title={node.kind === 'subtopic' ? 'Resumen del concepto' : `Resumen de «${sub?.title}»`}>
                <SubtopicNoteView id={node.subtopicId} notes={notes} />
              </Section>
            )}

            {(node.kind === 'axis' || node.kind === 'subject') && (
              <Section title={node.kind === 'axis' ? 'Temas de este eje' : 'Ejes y temas'}>
                <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {subtopicIds.map((id) => {
                    const s = SUBTOPICS_BY_ID.get(id)!
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => onNavigate(nodeId.subtopic(id))}
                          className="flex w-full items-center gap-3 py-2 text-left text-[13px] hover:text-zinc-900 dark:hover:text-zinc-100"
                        >
                          <span className="min-w-0 flex-1 truncate">{s.title}</span>
                          <Accuracy stat={stats.get(id)} />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </Section>
            )}

            {cross.length > 0 && (
              <Section title="Se conecta con">
                <ul className="space-y-2">
                  {cross.map((c) => {
                    const s = SUBTOPICS_BY_ID.get(c.id)
                    if (!s) return null
                    return (
                      <li key={c.id} className="text-[13px]">
                        <button
                          type="button"
                          onClick={() => onNavigate(nodeId.subtopic(c.id))}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {s.title}
                        </button>
                        <span className="text-zinc-500 dark:text-zinc-400"> ({SUBJECTS[s.subject].short}). {c.why}</span>
                      </li>
                    )
                  })}
                </ul>
              </Section>
            )}

            {node.kind !== 'subject' && (
              <Section title={node.kind === 'question' ? 'Pregunta y solución' : `Preguntas respondidas (${entries.length})`}>
                <AnsweredList key={node.id} entries={entries} />
              </Section>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
