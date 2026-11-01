// Verifica que todas las fórmulas $…$ / $$…$$ de un output.json compilen en KaTeX (modo estricto).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const katex = require('/home/fels/Desktop/APP_PAES/node_modules/katex/dist/katex.js')
const data = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const macros = { '\\sen': '\\operatorname{sen}', '\\R': '\\mathbb{R}' }
let bad = 0
for (const s of data) {
  const texts = [s.summary ?? '', ...(s.steps ?? []), ...Object.values(s.distractors ?? {})]
  for (const t of texts) {
    for (const m of String(t).matchAll(/(?<!\\)\$\$([\s\S]+?)(?<!\\)\$\$|(?<!\\)\$([^$]+?)(?<!\\)\$/g)) {
      try { katex.renderToString(m[1] ?? m[2], { throwOnError: true, displayMode: Boolean(m[1]), macros: { ...macros }, strict: 'ignore' }) }
      catch (e) { bad++; console.log(`KATEX ${s.id}: «${(m[1] ?? m[2]).slice(0, 60)}» → ${e.message.split('\n')[0].slice(0, 90)}`) }
    }
  }
}
process.exit(bad ? 1 : 0)
