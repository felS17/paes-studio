import { EXPLAINED_QUESTIONS, QUESTIONS_BY_SUBTOPIC, SUBTOPIC_OF_QUESTION, SUBTOPICS, SUBTOPICS_BY_ID } from '@/data/temario'
import { SUBJECTS } from '@/data/subjects'
import type { AttemptRecord } from '@/types/analytics'
import type { PracticeSet, SubjectId } from '@/types/exam'
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

/** Acierto desde el que un tema cuenta como dominado, con al menos 3 preguntas para que no baste un golpe de suerte. */
export const MASTERY_ACCURACY = 0.75
const isMastered = (s: SubtopicStat) => s.answered >= 3 && (s.accuracy ?? 0) >= MASTERY_ACCURACY

/** Dominio de un subtema: guía el contraste de sus nodos en el mapa. */
export type Mastery = 'sin-explorar' | 'en-progreso' | 'dominado'
export const masteryOf = (s: SubtopicStat | undefined): Mastery =>
  !s || !s.answered ? 'sin-explorar' : isMastered(s) ? 'dominado' : 'en-progreso'

/** Estado de un proceso en el administrador de tareas (`/analitica`). */
export type ProcessState = 'dominado' | 'estable' | 'crítico' | 'sin datos'
export function processState(s: SubtopicStat): ProcessState {
  if (!s.answered) return 'sin datos'
  if (isMastered(s)) return 'dominado'
  return (s.accuracy ?? 0) < 0.5 ? 'crítico' : 'estable'
}

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

/**
 * Asignatura de «10 preguntas rápidas»: la de más errores pendientes; sin errores, la última que practicaste. Va
 * por una sola asignatura para que el puntaje estimado del intento siga teniendo sentido.
 */
export function quickDrillSubject(attempts: AttemptRecord[], latest: Map<string, LatestResult>): { subject: SubjectId; pending: number } {
  const pending = new Map<SubjectId, number>()
  for (const r of latest.values()) {
    if (r.selected !== null && !r.isCorrect) pending.set(r.subject, (pending.get(r.subject) ?? 0) + 1)
  }
  const [top] = [...pending].sort((a, b) => b[1] - a[1])
  if (top) return { subject: top[0], pending: top[1] }
  const last = attempts.reduce<AttemptRecord | null>((best, a) => (!best || a.finishedAt > best.finishedAt ? a : best), null)
  return { subject: last?.subject ?? 'm1', pending: 0 }
}

export function quickDrillDraft(subject: SubjectId, latest: Map<string, LatestResult>, size: 10 | 20 = 10): SetDraft {
  const ids = SUBTOPICS.filter((s) => s.subject === subject).map((s) => s.id)
  return drillDraftFor(ids, size, latest, { subject, title: `${size} preguntas rápidas`, scope: SUBJECTS[subject].short })
}

/** Cuántas preguntas del banco reúne un conjunto de subtemas. */
export const questionCountOf = (subtopicIds: string[]) =>
  subtopicIds.reduce((n, id) => n + (QUESTIONS_BY_SUBTOPIC.get(id)?.length ?? 0), 0)
