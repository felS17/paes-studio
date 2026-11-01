import type { AttemptRecord } from '@/types/analytics'
import type { ScienceArea, SubjectId } from '@/types/exam'
import { SUBJECT_ORDER } from '@/data/subjects'

/** Hitos de la escala PAES que marca el gráfico de proyección. */
export const MILESTONES = [600, 750, 900, 1000] as const

export interface ProjectionPoint {
  attemptId: string
  finishedAt: number
  /** Promedio del último puntaje de cada asignatura vista hasta este intento. */
  avg: number
  /** Puntaje del intento que movió la curva. */
  score: number
  subject: SubjectId
  area?: ScienceArea
  examTitle: string
}

/** Una serie: tras cada intento entregado, el promedio del último puntaje de cada asignatura vista hasta ese momento. */
export function buildProjection(attempts: AttemptRecord[]): ProjectionPoint[] {
  const latest = new Map<SubjectId, number>()
  return [...attempts]
    .sort((a, b) => a.finishedAt - b.finishedAt)
    .map((a) => {
      latest.set(a.subject, a.paesScore)
      const values = [...latest.values()]
      return {
        attemptId: a.id,
        finishedAt: a.finishedAt,
        avg: Math.round(values.reduce((n, v) => n + v, 0) / values.length),
        score: a.paesScore,
        subject: a.subject,
        area: a.area,
        examTitle: a.examTitle,
      }
    })
}

export interface LatestBySubject {
  subject: SubjectId
  score: number
  area?: ScienceArea
}

/** Último puntaje de cada asignatura (en el orden estándar), solo las que tienen intentos. */
export function latestBySubject(attempts: AttemptRecord[]): Map<SubjectId, LatestBySubject> {
  const map = new Map<SubjectId, LatestBySubject>()
  for (const a of [...attempts].sort((x, y) => x.finishedAt - y.finishedAt)) {
    map.set(a.subject, { subject: a.subject, score: a.paesScore, area: a.area })
  }
  return new Map(SUBJECT_ORDER.flatMap((id) => (map.has(id) ? [[id, map.get(id)!] as const] : [])))
}

/** Siguiente hito aún no alcanzado, o null si ya llegó a 1000. */
export const nextMilestone = (value: number): number | null => MILESTONES.find((m) => value < m) ?? null
