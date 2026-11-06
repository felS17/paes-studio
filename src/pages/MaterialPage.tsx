import { lazy, Suspense, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Tabs } from '@/components/ui/tabs'
import { SUBJECT_TABS } from '@/data/subjects'
import type { ManifestEntry } from '@/types/material'
import pdfsJson from '@/data/pdfs.json'
import manifestJson from '../../latex/output/manifest.json'

const manifest = manifestJson as unknown as ManifestEntry[]
const pdfs = pdfsJson as Record<string, { pdf: string; pages: number; bytes: number } | undefined>

// Plantillas y resúmenes generados: se cargan como texto solo cuando se piden.
const templates = import.meta.glob<string>('/latex/templates/*.tex', { query: '?raw', import: 'default' })
const outputs = import.meta.glob<string>('/latex/output/*.tex', { query: '?raw', import: 'default' })

type Loader = () => Promise<string>

const cache = new Map<string, Promise<string>>()
/** Carga una sola vez y deja el texto listo. */
function textOf(path: string, loader: Loader): Promise<string> {
  let p = cache.get(path)
  if (!p) {
    p = loader()
    cache.set(path, p)
  }
  return p
}

const fileName = (path: string) => path.split('/').pop() ?? path

async function download(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/x-tex' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

/** Overleaf abre un proyecto nuevo a partir de un formulario POST con el código codificado. */
function openInOverleaf(text: string, name: string) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = 'https://www.overleaf.com/docs'
  form.target = '_blank'
  form.rel = 'noopener'
  form.style.display = 'none'
  const fields: Record<string, string> = { encoded_snip: encodeURIComponent(text), snip_name: name }
  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = value
    form.appendChild(input)
  }
  document.body.appendChild(form)
  form.submit()
  form.remove()
}

interface Viewing {
  name: string
  text: string | null
}

const ROW = 'flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 py-1.5'
const LIST = 'divide-y divide-zinc-200/80 border-y border-zinc-200/80 dark:divide-zinc-800/80 dark:border-zinc-800/80'
const TEX_LINK = 'rounded-sm font-mono text-[11.5px] text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100'

const KIND = { guia: { label: 'guía', unit: 'pág' }, beamer: { label: 'presentación', unit: 'diap' } } as const

/** Una línea por documento: el PDF es la acción principal; el archivo editable queda como enlace mínimo. */
function DocumentRow({ entry, onView }: { entry: ManifestEntry; onView: (name: string, path: string, loader: Loader) => void }) {
  const path = `/latex/output/${entry.file}`
  const pdf = pdfs[entry.file]
  const kind = KIND[entry.kind]
  const loader = outputs[path]
  return (
    <li className={ROW}>
      <span className="min-w-0 flex-1 basis-40 truncate text-[13.5px]">{entry.subject} {kind.label}</span>
      <span className="font-mono text-[12px] text-zinc-500 tabular-nums dark:text-zinc-400">{pdf ? `${pdf.pages} ${kind.unit}` : 'no disponible'}</span>
      {pdf && (
        <span className="flex gap-1">
          <Button size="sm" asChild><a href={pdf.pdf} target="_blank" rel="noopener">abrir</a></Button>
          <Button size="sm" variant="ghost" asChild><a href={pdf.pdf} download={entry.file.replace(/\.tex$/, '.pdf')}>descargar</a></Button>
        </span>
      )}
      {loader && <button type="button" className={TEX_LINK} onClick={() => onView(entry.file, path, loader)} aria-label={`Ver el archivo editable de ${entry.subject} ${kind.label}`}>tex</button>}
    </li>
  )
}

// El formulario (KaTeX y sus tarjetas) se descarga solo si se abre su pestaña.
const CheatSheets = lazy(() => import('@/components/cheatsheets/CheatSheets').then((m) => ({ default: m.CheatSheets })))

type View = 'resumenes' | 'formulario'

export function MaterialPage() {
  const [viewing, setViewing] = useState<Viewing | null>(null)
  const [params, setParams] = useSearchParams()
  const view: View = params.get('vista') === 'formulario' ? 'formulario' : 'resumenes'
  const setView = (v: View) => setParams(v === 'resumenes' ? {} : { vista: v }, { replace: true })
  const templateEntries = Object.entries(templates).sort(([a], [b]) => a.localeCompare(b))
  const documents = SUBJECT_TABS.flatMap((subject) =>
    manifest.filter((e) => e.subject === subject).sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'guia' ? -1 : 1)),
  )
  const openFile = async (name: string, path: string, loader: Loader) => {
    setViewing({ name, text: null })
    const text = await textOf(path, loader)
    setViewing({ name, text })
  }

  return (
    <div className="space-y-5">
      <PageHeader title="guías" />
      <Tabs<View>
        label="Secciones de guías"
        value={view}
        onChange={setView}
        panelClassName="pt-4"
        items={[
          { value: 'resumenes', label: 'resúmenes pdf' },
          { value: 'formulario', label: 'formulario express' },
        ]}
      >
        {view === 'formulario' ? (
          <Suspense fallback={<p className="text-[13px] text-zinc-500" role="status">cargando…</p>}>
            <CheatSheets />
          </Suspense>
        ) : (
          <div className="space-y-4">
            {documents.length ? (
              <ul className={LIST}>
                {documents.map((e) => <DocumentRow key={e.file} entry={e} onView={openFile} />)}
              </ul>
            ) : (
              <p className="text-[13px] text-zinc-500">las guías todavía no están disponibles.</p>
            )}
            <details>
              <summary className="cursor-pointer rounded-sm py-1 font-mono text-[12.5px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">formatos base</summary>
              <ul className={`mt-2 ${LIST}`}>
                {templateEntries.map(([path, loader]) => {
                  const name = fileName(path)
                  return (
                    <li key={path} className={ROW}>
                      <span className="min-w-0 flex-1 truncate text-[13.5px]">{name.startsWith('guia') ? 'formato de guía' : 'formato de presentación'}</span>
                      <button type="button" className={TEX_LINK} onClick={() => openFile(name, path, loader)}>tex</button>
                    </li>
                  )
                })}
              </ul>
            </details>
          </div>
        )}
      </Tabs>

      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent title={viewing?.name ?? 'archivo'} className="max-w-4xl">
          <pre className="mt-4 max-h-[65vh] overflow-auto rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 font-mono text-[11.5px] leading-relaxed text-zinc-700 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:text-zinc-300">
            {viewing?.text ?? 'cargando…'}
          </pre>
          {viewing?.text && (
            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => openInOverleaf(viewing.text!, viewing.name)}>editar en overleaf</Button>
              <Button size="sm" onClick={() => download(viewing.text!, viewing.name)}>descargar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
