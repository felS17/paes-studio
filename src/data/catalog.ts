import { useExamStore } from '@/store/useExamStore'
import type { Exam, ExamMeta, Passage, Question } from '@/types/exam'
import index from './exams/index.json'
import { SUBJECTS } from './subjects'

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
  if (!loader) return Promise.reject(new Error(`No se encontró el archivo de datos ${meta.file}.`))
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
  if (!set) throw new Error('Esta práctica ya no está guardada en este navegador.')
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

export const YEARS: number[] = [...new Set(EXAMS.map((e) => e.year))].sort((a, b) => b - a)
