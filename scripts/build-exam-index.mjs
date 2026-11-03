#!/usr/bin/env node
/**
 * Genera src/data/exams/index.json: catálogo liviano de todos los ensayos (oficiales y curados).
 * La app carga este índice al inicio y cada ensayo completo bajo demanda (import dinámico).
 * Se ejecuta automáticamente en `predev` y `prebuild`, y al final del pipeline Python.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const examsDir = join(root, 'src', 'data', 'exams')
const SUBJECTS = ['m1', 'm2', 'lectora', 'ciencias', 'historia']
const errors = []
const entries = []

for (const subject of SUBJECTS) {
  const dir = join(examsDir, subject)
  let files = []
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.json'))
  } catch {
    continue
  }
  for (const file of files) {
    const path = join(dir, file)
    if (!statSync(path).isFile()) continue
    let exam
    try {
      exam = JSON.parse(readFileSync(path, 'utf8'))
    } catch (e) {
      errors.push(`${file}: JSON inválido (${e.message})`)
      continue
    }
    const problems = validate(exam, subject)
    if (problems.length) {
      errors.push(...problems.map((p) => `${file}: ${p}`))
      continue
    }
    const axes = [...new Set(exam.questions.map((q) => q.axis))]
    const axisQuestions = {}
    for (const q of exam.questions) (axisQuestions[q.axis] ??= []).push(q.number)
    const subtopicQuestions = {}
    for (const q of exam.questions) if (q.subtopic) (subtopicQuestions[q.subtopic] ??= []).push(q.number)
    const explainedQuestions = exam.questions.filter((q) => q.explanation).map((q) => q.number)
    entries.push({
      id: exam.id,
      subject: exam.subject,
      ...(exam.area ? { area: exam.area } : {}),
      title: exam.title,
      description: exam.description,
      year: exam.year,
      modality: exam.modality,
      source: exam.source,
      questionCount: exam.questions.length,
      passageCount: exam.passages.length,
      durationMinutes: exam.durationMinutes,
      hasExplanations: exam.questions.some((q) => q.explanation),
      snapshotCount: exam.questions.filter((q) => q.snapshot).length,
      axes,
      axisQuestions,
      subtopicQuestions,
      explainedQuestions,
      file: relative(examsDir, path).replaceAll('\\', '/'),
    })
  }
}

function validate(exam, folder) {
  const out = []
  if (!exam || typeof exam !== 'object') return ['no es un objeto']
  for (const k of ['id', 'subject', 'title', 'year', 'modality', 'source', 'durationMinutes', 'scoring', 'questions', 'passages']) {
    if (exam[k] === undefined) out.push(`falta "${k}"`)
  }
  if (out.length) return out
  if (exam.subject !== folder) out.push(`asignatura "${exam.subject}" en carpeta "${folder}"`)
  if (!Array.isArray(exam.scoring.table) || exam.scoring.table.length < 2) out.push('tabla de puntaje vacía')
  const passageIds = new Set(exam.passages.map((p) => p.id))
  const ids = new Set()
  exam.questions.forEach((q, i) => {
    const tag = `pregunta ${q.number ?? i + 1}`
    if (ids.has(q.id)) out.push(`${tag}: id duplicado ${q.id}`)
    ids.add(q.id)
    if (!Array.isArray(q.options) || q.options.length < 2) out.push(`${tag}: alternativas insuficientes`)
    else if (!q.options.some((o) => o.key === q.answer)) out.push(`${tag}: la clave ${q.answer} no está entre las alternativas`)
    if (q.passageId && !passageIds.has(q.passageId)) out.push(`${tag}: lectura ${q.passageId} inexistente`)
    if (!q.axis) out.push(`${tag}: sin eje temático`)
  })
  return out
}

const order = { curado: 0, regular: 1, invierno: 2, personalizado: 3 }
entries.sort(
  (a, b) =>
    SUBJECTS.indexOf(a.subject) - SUBJECTS.indexOf(b.subject) ||
    order[a.modality] - order[b.modality] ||
    b.year - a.year ||
    (a.area ?? '').localeCompare(b.area ?? ''),
)
writeFileSync(join(examsDir, 'index.json'), JSON.stringify(entries, null, 1) + '\n')
const questions = entries.reduce((n, e) => n + e.questionCount, 0)
console.log(`✓ index.json: ${entries.length} ensayos, ${questions} preguntas`)
if (errors.length) {
  console.error(`✗ ${errors.length} problema(s) de datos:\n  ` + errors.join('\n  '))
  process.exit(1)
}
