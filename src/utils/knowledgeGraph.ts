import { EXAMS_BY_ID } from '@/data/catalog'
import { SUBJECTS, SUBJECT_ORDER } from '@/data/subjects'
import { CROSS_LINKS, SUBTOPIC_OF_QUESTION, SUBTOPICS_BY_ID, TEMARIO } from '@/data/temario'
import type { SubjectId } from '@/types/exam'
import type { LatestResult } from './analytics'
import { masteryOf, type Mastery, type SubtopicStat } from './subtopics'

export type NodeKind = 'subject' | 'axis' | 'subtopic' | 'concept' | 'question'

export interface KNode {
  id: string
  kind: NodeKind
  label: string
  subject: SubjectId
  axis?: string
  subtopicId?: string
  questionId?: string
  /** Subtemas: dominio según el último intento de cada pregunta. */
  mastery?: Mastery
  /** Preguntas: resultado de su último intento. */
  status?: 'correct' | 'incorrect'
  /** Errores pendientes bajo este nodo. */
  pending: number
  /** Radio en unidades del grafo. */
  r: number
  // Posición asignada por la simulación (d3-force).
  x?: number
  y?: number
}

export interface KLink {
  source: string | KNode
  target: string | KNode
  kind: 'tree' | 'cross' | 'leaf'
  why?: string
}

export interface KnowledgeGraphData {
  nodes: KNode[]
  links: KLink[]
}

/** Etiquetas de tema demasiado generales para ser un «concepto clave» propio. */
export const GENERIC_TOPICS = new Set([
  'Números', 'Álgebra y funciones', 'Geometría', 'Probabilidad y estadística', 'Interpretar', 'Localizar', 'Evaluar',
  'Biología', 'Física', 'Química', 'Química general', 'Procesos históricos', 'Historia', 'Economía',
  'Historia: mundo, América y Chile', 'Formación ciudadana', 'Sistema económico', 'Geografía y espacio',
])

/** Máximo de preguntas dibujadas (las más recientes): mantiene el canvas fluido con historiales largos. */
const MAX_QUESTIONS = 600

const pad = (n: number) => n.toString().padStart(2, '0')
export const questionNumberOf = (qid: string) => Number(qid.match(/-q(\d+)$/)?.[1] ?? 0)
const examOf = (qid: string) => qid.replace(/-q\d+$/, '')

/** «M1, Invierno 2026, pregunta 12» para el panel lateral. */
export function questionCaption(qid: string): string {
  const meta = EXAMS_BY_ID.get(examOf(qid))
  const n = questionNumberOf(qid)
  return meta ? `${meta.title}, pregunta ${n}` : `Pregunta ${n}`
}

export const nodeId = {
  subject: (s: SubjectId) => `s:${s}`,
  axis: (s: SubjectId, axis: string) => `a:${s}:${axis}`,
  subtopic: (id: string) => `t:${id}`,
  concept: (sub: string, topic: string) => `c:${sub}:${topic}`,
  question: (qid: string) => `q:${qid}`,
}

/**
 * Red de conocimiento: Asignatura → Eje → Subtema (los 67 del temario) y, alrededor de cada subtema, las
 * preguntas que ya respondiste agrupadas por su concepto clave. Los enlaces cruzados unen subtemas afines de
 * distintas asignaturas.
 */
export function buildKnowledgeGraph({ stats, latest, subject, showQuestions }: {
  stats: Map<string, SubtopicStat>
  latest: Map<string, LatestResult>
  subject: SubjectId | 'todas'
  showQuestions: boolean
}): KnowledgeGraphData {
  const nodes: KNode[] = []
  const links: KLink[] = []
  const included = new Set<string>()
  const subjects = subject === 'todas' ? SUBJECT_ORDER : [subject]

  for (const s of TEMARIO.subjects) {
    if (!subjects.includes(s.subject)) continue
    const sid = nodeId.subject(s.subject)
    let subjectPending = 0
    const subjectNode: KNode = { id: sid, kind: 'subject', label: SUBJECTS[s.subject].short, subject: s.subject, pending: 0, r: 7 }
    nodes.push(subjectNode)
    for (const axis of s.axes) {
      const aid = nodeId.axis(s.subject, axis.name)
      let axisPending = 0
      const axisNode: KNode = { id: aid, kind: 'axis', label: axis.name, subject: s.subject, axis: axis.name, pending: 0, r: 4.2 }
      nodes.push(axisNode)
      links.push({ source: sid, target: aid, kind: 'tree' })
      for (const sub of axis.subtopics) {
        const stat = stats.get(sub.id)
        const pending = stat?.pending ?? 0
        axisPending += pending
        nodes.push({
          id: nodeId.subtopic(sub.id),
          kind: 'subtopic',
          label: sub.title,
          subject: s.subject,
          axis: axis.name,
          subtopicId: sub.id,
          mastery: masteryOf(stat),
          pending,
          r: 2.4 + Math.min(2.6, Math.sqrt(sub.questionCount) * 0.24),
        })
        included.add(sub.id)
        links.push({ source: aid, target: nodeId.subtopic(sub.id), kind: 'tree' })
      }
      axisNode.pending = axisPending
      subjectPending += axisPending
    }
    subjectNode.pending = subjectPending
  }

  for (const { a, b, why } of CROSS_LINKS) {
    if (included.has(a) && included.has(b)) links.push({ source: nodeId.subtopic(a), target: nodeId.subtopic(b), kind: 'cross', why })
  }

  if (showQuestions) {
    const answered = [...latest.entries()]
      .filter(([qid, r]) => r.selected !== null && included.has(SUBTOPIC_OF_QUESTION.get(qid) ?? ''))
      .sort((x, y) => y[1].at - x[1].at)
      .slice(0, MAX_QUESTIONS)
    const concepts = new Set<string>()
    for (const [qid, r] of answered) {
      const sub = SUBTOPIC_OF_QUESTION.get(qid)!
      const meta = SUBTOPICS_BY_ID.get(sub)!
      const topic = r.topic && !GENERIC_TOPICS.has(r.topic) && r.topic !== r.axis && r.topic !== meta.title ? r.topic : null
      let parent = nodeId.subtopic(sub)
      if (topic) {
        const cid = nodeId.concept(sub, topic)
        if (!concepts.has(cid)) {
          concepts.add(cid)
          nodes.push({ id: cid, kind: 'concept', label: topic, subject: meta.subject, axis: meta.axis, subtopicId: sub, pending: 0, r: 1.7 })
          links.push({ source: parent, target: cid, kind: 'leaf' })
        }
        parent = cid
      }
      const n = questionNumberOf(qid)
      nodes.push({
        id: nodeId.question(qid),
        kind: 'question',
        label: `P${pad(n)}`,
        subject: meta.subject,
        axis: meta.axis,
        subtopicId: sub,
        questionId: qid,
        status: r.isCorrect ? 'correct' : 'incorrect',
        pending: r.isCorrect ? 0 : 1,
        r: 1.25,
      })
      links.push({ source: parent, target: nodeId.question(qid), kind: 'leaf' })
    }
    // Un concepto con preguntas falladas también queda marcado.
    const byId = new Map(nodes.map((n) => [n.id, n]))
    for (const l of links) {
      const t = byId.get(String(l.target))
      const s = byId.get(String(l.source))
      if (s?.kind === 'concept' && t?.kind === 'question') s.pending += t.pending
    }
  }
  return { nodes, links }
}

/** Ids de subtemas bajo un nodo (para estadísticas y drills). */
export function subtopicsUnder(node: KNode): string[] {
  if (node.subtopicId) return [node.subtopicId]
  const s = TEMARIO.subjects.find((x) => x.subject === node.subject)
  if (!s) return []
  const axes = node.kind === 'axis' ? s.axes.filter((a) => a.name === node.axis) : s.axes
  return axes.flatMap((a) => a.subtopics.map((x) => x.id))
}
