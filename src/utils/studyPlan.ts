import { TEMARIO_BY_SUBJECT } from '@/data/temario'
import type { StudyPlan } from '@/types/analytics'
import type { SubjectId } from '@/types/exam'
import { localDateKey } from './dateKey'
import { MASTERY_ACCURACY, type SubtopicStat } from './subtopics'

/** Con menos respuestas, el acierto de un tema todavía no dice nada (igual que en el diagnóstico). */
const MIN_ANSWERS = 3

const dateOf = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** Días de estudio entre dos fechas (ambas incluidas) que caen en los días de la semana elegidos (0 = domingo). */
export function studyDates(fromKey: string, toKey: string, weekdays: number[]): string[] {
  const out: string[] = []
  const end = dateOf(toKey).getTime()
  for (const d = dateOf(fromKey); d.getTime() <= end && out.length < 400; d.setDate(d.getDate() + 1)) {
    if (weekdays.includes(d.getDay())) out.push(localDateKey(d))
  }
  return out
}

/**
 * Temas de una materia en orden de repaso: primero los débiles según tu diagnóstico (menor acierto primero), luego
 * los que aún no tienen datos, en el orden del temario, y al final los que ya dominas.
 */
function subjectOrder(subject: SubjectId, stats: Map<string, SubtopicStat>): string[] {
  const ids = (TEMARIO_BY_SUBJECT.get(subject)?.axes ?? []).flatMap((a) => a.subtopics.map((s) => s.id))
  const known = (id: string) => (stats.get(id)?.answered ?? 0) >= MIN_ANSWERS
  const acc = (id: string) => stats.get(id)?.accuracy ?? 0
  const weak = ids.filter((id) => known(id) && acc(id) < MASTERY_ACCURACY).sort((a, b) => acc(a) - acc(b))
  const unknown = ids.filter((id) => !known(id))
  const mastered = ids.filter((id) => known(id) && acc(id) >= MASTERY_ACCURACY)
  return [...weak, ...unknown, ...mastered]
}

/**
 * Reparte los temas de las materias elegidas entre los días disponibles, alternando materias. Si sobran días, el
 * plan vuelve a empezar por los temas más débiles.
 */
export function buildStudyPlan(
  config: { subjects: SubjectId[]; weekdays: number[] },
  stats: Map<string, SubtopicStat>,
  fromKey: string,
  toKey: string,
): StudyPlan {
  const lists = config.subjects.map((s) => subjectOrder(s, stats))
  const queue: string[] = []
  for (let i = 0; lists.some((l) => i < l.length); i++) for (const l of lists) if (i < l.length) queue.push(l[i])
  const dates = studyDates(fromKey, toKey, config.weekdays)
  const n = queue.length
  const days = dates.map((date, i) => ({
    date,
    subtopics: !n ? [] : n >= dates.length ? queue.slice(Math.floor((i * n) / dates.length), Math.floor(((i + 1) * n) / dates.length)) : [queue[i % n]],
  }))
  return { subjects: config.subjects, weekdays: config.weekdays, createdOn: fromKey, until: toKey, days }
}
