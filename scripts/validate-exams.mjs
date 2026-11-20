#!/usr/bin/env node
/**
 * Valida todos los ensayos de src/data/exams: JSON que parsea, clave dentro de las alternativas, coherencia con
 * el almacén de soluciones (scripts/pipeline/solutions/soluciones.json) y explicaciones con delimitadores `$` /
 * `$$` balanceados y fórmulas que compilan en KaTeX. Uso: npm run validate:exams
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import katex from 'katex'

const root = fileURLToPath(new URL('..', import.meta.url))
const examsDir = join(root, 'src', 'data', 'exams')
const store = JSON.parse(readFileSync(join(root, 'scripts', 'pipeline', 'solutions', 'soluciones.json'), 'utf8'))
const macros = { '\\sen': '\\operatorname{sen}', '\\tg': '\\operatorname{tg}', '\\R': '\\mathbb{R}', '\\N': '\\mathbb{N}', '\\Z': '\\mathbb{Z}', '\\Q': '\\mathbb{Q}' }
const DOLLAR = /(?<!\\)\$/g
const MATH = /(?<!\\)\$\$([\s\S]+?)(?<!\\)\$\$|(?<!\\)\$([^$]+?)(?<!\\)\$/g
const problems = []
function checkMath(t, tag) {
  if ((t.match(DOLLAR) ?? []).length % 2) problems.push(`${tag}: signos $ desbalanceados en «${t.slice(0, 50)}»`)
  for (const m of t.matchAll(MATH)) {
    formulas++
    try {
      katex.renderToString(m[1] ?? m[2], { throwOnError: true, displayMode: Boolean(m[1]), macros: { ...macros }, strict: 'ignore' })
    } catch (e) {
      problems.push(`${tag}: KaTeX «${(m[1] ?? m[2]).slice(0, 50)}» → ${e.message.split('\n')[0].slice(0, 80)}`)
    }
  }
}
const byId = new Map()
const copies = []
let files = 0, questions = 0, explained = 0, deep = 0, formulas = 0

for (const subject of readdirSync(examsDir, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  for (const file of readdirSync(join(examsDir, subject.name)).filter((f) => f.endsWith('.json'))) {
    files++
    let exam
    try {
      exam = JSON.parse(readFileSync(join(examsDir, subject.name, file), 'utf8'))
    } catch (e) {
      problems.push(`${file}: JSON inválido (${e.message})`)
      continue
    }
    for (const q of exam.questions) {
      questions++
      byId.set(q.id, q)
      if (q.origin) copies.push(q)
      if (!q.options.some((o) => o.key === q.answer)) problems.push(`${q.id}: la clave ${q.answer} no está entre las alternativas`)
      const saved = store[q.id]
      if (saved && saved.answer !== q.answer) problems.push(`${q.id}: la clave ${q.answer} no coincide con la del almacén (${saved.answer})`)
      const ex = q.explanation
      if (!ex) continue
      explained++
      if (ex.planteamiento) deep++
      const texts = [ex.summary, ex.planteamiento ?? '', ...ex.steps, ...Object.values(ex.distractors ?? {})]
      for (const t of texts) checkMath(t, q.id)
      const last = ex.steps.at(-1) ?? ''
      if (ex.planteamiento && !new RegExp(`alternativa correcta es la ${q.answer}\\b`).test(last)) {
        problems.push(`${q.id}: el último paso no confirma la clave ${q.answer}`)
      }
    }
  }
}
// Guías de ejercicios resueltos (src/data/guides.json): clave, alternativas y todas sus fórmulas en KaTeX.
const guides = JSON.parse(readFileSync(join(root, 'src', 'data', 'guides.json'), 'utf8'))
let guideExercises = 0
for (const g of guides) {
  g.exercises.forEach((e, i) => {
    guideExercises++
    const tag = `guía ${g.id}, ejercicio ${i + 1}`
    if (!e.options.some((o) => o.key === e.answer)) problems.push(`${tag}: la clave ${e.answer} no está entre las alternativas`)
    const ex = e.explanation
    for (const t of [e.stem, ...e.options.map((o) => o.text), ex.summary, ...ex.steps, ...Object.values(ex.distractors ?? {})]) checkMath(t, tag)
  })
}

// Las preguntas oficiales copiadas en ensayos curados deben conservar la clave y las alternativas de su original.
for (const q of copies) {
  const src = byId.get(q.origin)
  if (!src) problems.push(`${q.id}: la pregunta de origen ${q.origin} no existe`)
  else if (src.answer !== q.answer || src.options.length !== q.options.length) problems.push(`${q.id}: no coincide con ${q.origin}`)
}
console.log(`${files} ensayos, ${questions} preguntas, ${explained} con solución (${deep} con planteamiento), ${guides.length} guías con ${guideExercises} ejercicios, ${formulas} fórmulas KaTeX`)
if (problems.length) {
  console.error(`✗ ${problems.length} problema(s):\n  ` + problems.slice(0, 40).join('\n  '))
  process.exit(1)
}
console.log('✓ Todos los JSON parsean, las claves son coherentes y las fórmulas compilan en KaTeX')
