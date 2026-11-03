import { EXPLAINED_QUESTIONS, QUESTIONS_BY_SUBTOPIC, SUBTOPIC_OF_QUESTION, SUBTOPICS_BY_ID } from '@/data/temario'
import { SUBJECTS } from '@/data/subjects'
import type { AttemptRecord } from '@/types/analytics'
import type { PracticeSet } from '@/types/exam'
import { latestResults, type LatestResult } from './analytics'
import { examIdOfQuestion } from './practice'

export interface SubtopicStat {
  /** Preguntas del subtema respondidas al menos una vez (según su último intento). */
  answered: number
  correct: number
  /** Acierto histórico (0–1) o null si aún no respondes ninguna. */
  accuracy: number | null
  /** Errores pendientes: preguntas cuyo último intento fue incorrecto. */
  pending: number
}

const EMPTY: SubtopicStat = { answered: 0, correct: 0, accuracy: null, pending: 0 }
export const emptyStat = (): SubtopicStat => ({ ...EMPTY })

/** Acierto por subtema a partir del último resultado de cada pregunta (solo respondidas). */
export function subtopicStats(attempts: AttemptRecord[], latest = latestResults(attempts)): Map<string, SubtopicStat> {
  const map = new Map<string, SubtopicStat>()
  for (const [qid, r] of latest) {
    if (r.selected === null) continue
    const sub = SUBTOPIC_OF_QUESTION.get(qid)
    if (!sub) continue
    const s = map.get(sub) ?? emptyStat()
    s.answered += 1
    if (r.isCorrect) s.correct += 1
    else s.pending += 1
    map.set(sub, s)
  }
  for (const s of map.values()) s.accuracy = s.answered ? s.correct / s.answered : null
  return map
}

/** Suma las estadísticas de varios subtemas (un eje o una asignatura). */
export function combineStats(ids: string[], stats: Map<string, SubtopicStat>): SubtopicStat {
  const out = emptyStat()
  for (const id of ids) {
    const s = stats.get(id)
    if (!s) continue
    out.answered += s.answered
    out.correct += s.correct
    out.pending += s.pending
  }
  out.accuracy = out.answered ? out.correct / out.answered : null
  return out
}

/** Dominio de un subtema: guía el contraste de sus nodos en el Zettelkasten. */
export type Mastery = 'sin-explorar' | 'en-progreso' | 'dominado'
export const masteryOf = (s: SubtopicStat | undefined): Mastery =>
  !s || !s.answered ? 'sin-explorar' : s.answered >= 3 && (s.accuracy ?? 0) >= 0.8 && s.pending === 0 ? 'dominado' : 'en-progreso'

function shuffle<T>(list: T[]): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export type DrillSize = 10 | 20 | 'todas'

type SetDraft = Omit<PracticeSet, 'id' | 'createdAt'>

/**
 * Drill de uno o varios subtemas a través de todos los ensayos: primero tus errores pendientes, luego las
 * preguntas que nunca respondiste (las que traen solución paso a paso primero) y al final las que ya acertaste.
 */
export function drillDraftFor(
  subtopicIds: string[],
  size: DrillSize,
  latest: Map<string, LatestResult>,
  info: { subject: PracticeSet['subject']; title: string; scope: string },
): SetDraft {
  const failed: string[] = []
  const unseenExplained: string[] = []
  const unseen: string[] = []
  const rest: string[] = []
  for (const id of subtopicIds) {
    for (const qid of QUESTIONS_BY_SUBTOPIC.get(id) ?? []) {
      const r = latest.get(qid)
      if (r && r.selected !== null && !r.isCorrect) failed.push(qid)
      else if (!r) (EXPLAINED_QUESTIONS.has(qid) ? unseenExplained : unseen).push(qid)
      else rest.push(qid)
    }
  }
  const ordered = [...shuffle(failed), ...shuffle(unseenExplained), ...shuffle(unseen), ...shuffle(rest)]
  const ids = size === 'todas' ? ordered : ordered.slice(0, size)
  return {
    kind: 'subtema',
    subject: info.subject,
    title: info.title,
    description: `${ids.length} preguntas de ${info.scope} reunidas de todos los ensayos: primero tus errores pendientes y luego las que aún no respondes.`,
    items: ids.map((questionId) => ({ examId: examIdOfQuestion(questionId), questionId })),
  }
}

/** Drill de un subtema (explorador por subtemas y Zettelkasten). */
export function subtopicDrillDraft(
  subtopicId: string,
  size: DrillSize,
  attempts: AttemptRecord[],
  latest: Map<string, LatestResult> = latestResults(attempts),
): SetDraft {
  const sub = SUBTOPICS_BY_ID.get(subtopicId)
  if (!sub) throw new Error(`Subtema desconocido: ${subtopicId}`)
  return drillDraftFor([subtopicId], size, latest, {
    subject: sub.subject,
    title: sub.title,
    scope: `«${sub.title}» (${SUBJECTS[sub.subject].short}, ${sub.axis})`,
  })
}

/** Cuántas preguntas del banco reúne un conjunto de subtemas. */
export const questionCountOf = (subtopicIds: string[]) =>
  subtopicIds.reduce((n, id) => n + (QUESTIONS_BY_SUBTOPIC.get(id)?.length ?? 0), 0)
