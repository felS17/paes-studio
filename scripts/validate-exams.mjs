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
      if (!q.options.some((o) => o.key === q.answer)) problems.push(`${q.id}: la clave ${q.answer} no está entre las alternativas`)
      const saved = store[q.id]
      if (saved && saved.answer !== q.answer) problems.push(`${q.id}: la clave ${q.answer} no coincide con la del almacén (${saved.answer})`)
      const ex = q.explanation
      if (!ex) continue
      explained++
      if (ex.planteamiento) deep++
      const texts = [ex.summary, ex.planteamiento ?? '', ...ex.steps, ...Object.values(ex.distractors ?? {})]
      for (const t of texts) {
        if ((t.match(DOLLAR) ?? []).length % 2) problems.push(`${q.id}: signos $ desbalanceados en «${t.slice(0, 50)}»`)
        for (const m of t.matchAll(MATH)) {
          formulas++
          try {
            katex.renderToString(m[1] ?? m[2], { throwOnError: true, displayMode: Boolean(m[1]), macros: { ...macros }, strict: 'ignore' })
          } catch (e) {
            problems.push(`${q.id}: KaTeX «${(m[1] ?? m[2]).slice(0, 50)}» → ${e.message.split('\n')[0].slice(0, 80)}`)
          }
        }
      }
      const last = ex.steps.at(-1) ?? ''
      if (ex.planteamiento && !new RegExp(`alternativa correcta es la ${q.answer}\\b`).test(last)) {
        problems.push(`${q.id}: el último paso no confirma la clave ${q.answer}`)
      }
    }
  }
}
console.log(`${files} ensayos, ${questions} preguntas, ${explained} con solución (${deep} con planteamiento), ${formulas} fórmulas KaTeX`)
if (problems.length) {
  console.error(`✗ ${problems.length} problema(s):\n  ` + problems.slice(0, 40).join('\n  '))
  process.exit(1)
}
console.log('✓ Todos los JSON parsean, las claves son coherentes y las fórmulas compilan en KaTeX')
