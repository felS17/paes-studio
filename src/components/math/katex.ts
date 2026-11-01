import katex from 'katex'
import 'katex/dist/katex.min.css'

const MACROS = {
  '\\sen': '\\operatorname{sen}',
  '\\tg': '\\operatorname{tg}',
  '\\R': '\\mathbb{R}',
  '\\N': '\\mathbb{N}',
  '\\Z': '\\mathbb{Z}',
  '\\Q': '\\mathbb{Q}',
}

const cache = new Map<string, string>()

/** Renderiza LaTeX a HTML con caché; nunca lanza (muestra el error en línea). */
export function renderTex(tex: string, display: boolean): string {
  const key = `${display ? 'D' : 'I'}${tex}`
  let html = cache.get(key)
  if (html === undefined) {
    html = katex.renderToString(tex, {
      displayMode: display,
      throwOnError: false,
      strict: 'ignore',
      trust: false,
      macros: { ...MACROS },
      output: 'htmlAndMathml',
    })
    if (cache.size > 4000) cache.clear()
    cache.set(key, html)
  }
  return html
}
