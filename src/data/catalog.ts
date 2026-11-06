import { useExamStore } from '@/store/useExamStore'
import type { AttemptRecord } from '@/types/analytics'
import type { Exam, ExamMeta, Passage, Question } from '@/types/exam'
import index from './exams/index.json'
import { SUBJECTS, SUBJECT_TABS } from './subjects'

/** Catálogo liviano, siempre disponible. */
export const EXAMS: ExamMeta[] = index as unknown as ExamMeta[]

export const EXAMS_BY_ID: ReadonlyMap<string, ExamMeta> = new Map(EXAMS.map((e) => [e.id, e]))

/** Cada ensayo completo vive en su propio chunk y se descarga solo al abrirlo. */
const loaders = import.meta.glob<{ default: Exam }>('./exams/*/*.json')

const cache = new Map<string, Promise<Exam>>()

export const isPracticeSetId = (id: string) => id.startsWith('set-')

export function loadExam(id: string): Promise<Exam> {
  if (isPracticeSetId(id)) return buildPracticeSet(id)
  const meta = EXAMS_BY_ID.get(id)
  if (!meta) return Promise.reject(new Error(`No existe el ensayo "${id}".`))
  const loader = loaders[`./exams/${meta.file}`]
  if (!loader) return Promise.reject(new Error('No pudimos cargar este ensayo. Revisa tu conexión e inténtalo de nuevo.'))
  let pending = cache.get(id)
  if (!pending) {
    pending = loader().then((m) => m.default)
    pending.catch(() => cache.delete(id))
    cache.set(id, pending)
  }
  return pending
}

/**
 * Arma una práctica personalizada (por eje o revancha) como si fuera un ensayo: reúne las preguntas de
 * sus ensayos de origen, renumera y conserva las lecturas asociadas con identificadores únicos.
 */
async function buildPracticeSet(id: string): Promise<Exam> {
  const set = useExamStore.getState().sets[id]
  if (!set) throw new Error('Esta práctica ya no está guardada en este computador.')
  const sources = await Promise.all([...new Set(set.items.map((i) => i.examId))].map((examId) => loadExam(examId)))
  const byId = new Map(sources.map((e) => [e.id, e]))
  const passages: Passage[] = []
  const questions: Question[] = []
  for (const item of set.items) {
    const exam = byId.get(item.examId)
    const q = exam?.questions.find((x) => x.id === item.questionId)
    if (!exam || !q) continue
    let passageId: string | undefined
    if (q.passageId) {
      passageId = `${exam.id}::${q.passageId}`
      if (!passages.some((p) => p.id === passageId)) {
        const p = exam.passages.find((x) => x.id === q.passageId)
        if (p) passages.push({ ...p, id: passageId, title: `${p.title} (${exam.title})`, questionRange: undefined })
      }
    }
    questions.push({ ...q, number: questions.length + 1, passageId })
  }
  if (!questions.length) throw new Error('No se pudieron cargar las preguntas de esta práctica.')
  const info = SUBJECTS[set.subject]
  const first = sources[0]
  return {
    id,
    subject: set.subject,
    title: set.title,
    description: set.description,
    year: new Date(set.createdAt).getFullYear(),
    modality: 'personalizado',
    source: sources.every((e) => e.source === 'curado') ? 'curado' : 'demre',
    durationMinutes: Math.max(10, Math.round((info.officialMinutes * questions.length) / info.officialQuestions / 5) * 5),
    scoring: { method: 'reference-table', table: first.scoring.table },
    passages,
    questions,
  }
}

/** Años reales de rendición, para el filtro de `/ensayos`. Los ensayos curados no tienen uno. */
export const YEARS: number[] = [...new Set(EXAMS.filter((e) => e.source !== 'curado').map((e) => e.year))].sort((a, b) => b - a)

const MODALITY_ORDER: Partial<Record<ExamMeta['modality'], number>> = { regular: 0, invierno: 1 }

/** Pruebas oficiales de la más reciente a la más antigua, Regular antes que Invierno, y los curados siempre al final. */
export function sortExams(exams: ExamMeta[]): ExamMeta[] {
  const curated = (e: ExamMeta) => Number(e.source === 'curado')
  return [...exams].sort(
    (a, b) =>
      curated(a) - curated(b) ||
      b.year - a.year ||
      (MODALITY_ORDER[a.modality] ?? 9) - (MODALITY_ORDER[b.modality] ?? 9) ||
      SUBJECT_TABS.indexOf(a.subject) - SUBJECT_TABS.indexOf(b.subject) ||
      (a.area ?? '').localeCompare(b.area ?? ''),
  )
}

/** Nombre vigente de un intento: los guardados antes de normalizar los años traen el título antiguo. */
export const attemptTitle = (attempt: Pick<AttemptRecord, 'examId' | 'examTitle'>) => EXAMS_BY_ID.get(attempt.examId)?.title ?? attempt.examTitle
