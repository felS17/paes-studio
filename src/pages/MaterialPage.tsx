import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Panel } from '@/components/ui/panel'
import { SUBJECTS, SUBJECT_ORDER } from '@/data/subjects'
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
/** Carga una sola vez y deja el texto listo (también al pasar el cursor, para no perder el gesto del clic). */
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

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`

/** Acciones sobre el .tex: descargar, abrir en Overleaf o ver el código. */
function useTexActions(path: string, loader: Loader | undefined, name: string, onView: (v: Viewing) => void) {
  const [busy, setBusy] = useState(false)
  const prefetch = () => void (loader && textOf(path, loader))
  const run = async (kind: 'dl' | 'ov' | 'ver') => {
    if (!loader) return
    if (kind === 'ver') {
      onView({ name, text: null })
      onView({ name, text: await textOf(path, loader) })
      return
    }
    setBusy(true)
    try {
      const text = await textOf(path, loader)
      if (kind === 'dl') await download(text, name)
      else openInOverleaf(text, name)
    } finally {
      setBusy(false)
    }
  }
  return { busy, prefetch, run, available: Boolean(loader) }
}

const LINK = 'rounded text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-100'

/** Enlaces secundarios y discretos al código fuente. */
function TexLinks({ path, loader, name, onView }: { path: string; loader: Loader | undefined; name: string; onView: (v: Viewing) => void }) {
  const { busy, prefetch, run, available } = useTexActions(path, loader, name, onView)
  if (!available) return null
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      <span className="text-zinc-400 dark:text-zinc-500">Para adaptarla:</span>
      <button type="button" className={LINK} disabled={busy} onPointerEnter={prefetch} onFocus={prefetch} onClick={() => run('dl')}>Descargar archivo editable</button>
      <button type="button" className={LINK} disabled={busy} onPointerEnter={prefetch} onFocus={prefetch} onClick={() => run('ov')}>Editar en Overleaf</button>
      <button type="button" className={LINK} onClick={() => run('ver')}>Ver archivo</button>
    </p>
  )
}

const KIND = {
  guia: { label: 'Guía de estudio', unit: 'páginas' },
  beamer: { label: 'Presentación de repaso', unit: 'diapositivas 16:9' },
} as const

/** Una fila por documento: el PDF compilado es la acción principal; el .tex queda como enlace secundario. */
function DocumentRow({ entry, onView }: { entry: ManifestEntry; onView: (v: Viewing) => void }) {
  const path = `/latex/output/${entry.file}`
  const pdf = pdfs[entry.file]
  const kind = KIND[entry.kind]
  return (
    <li className="grid gap-x-8 gap-y-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0 space-y-2">
        <div>
          <p className="text-[14px] font-medium">{kind.label}</p>
          <p className="mt-1 text-[12.5px] text-zinc-500 dark:text-zinc-400">
            {pdf ? (
              <>
                <span className="font-mono text-zinc-900 tabular-nums dark:text-zinc-100">{pdf.pages}</span> {kind.unit},{' '}
                <span className="font-mono tabular-nums">{kb(pdf.bytes)}</span>
              </>
            ) : 'Este PDF todavía no está disponible'}
            {entry.kind === 'guia' && entry.examples !== undefined && (
              <>
                ,{' '}<span className="font-mono tabular-nums">{entry.examples}</span> ejemplos resueltos
              </>
            )}
          </p>
        </div>
        <TexLinks path={path} loader={outputs[path]} name={entry.file} onView={onView} />
      </div>
      {pdf && (
        <div className="flex flex-wrap gap-2 md:justify-end">
          <Button variant="primary" asChild>
            <a href={pdf.pdf} target="_blank" rel="noopener">
              Abrir PDF
              <ArrowUpRight />
            </a>
          </Button>
          <Button variant="secondary" asChild>
            <a href={pdf.pdf} download={entry.file.replace(/\.tex$/, '.pdf')}>Descargar</a>
          </Button>
        </div>
      )}
    </li>
  )
}

function describe(name: string): string {
  return name.startsWith('guia')
    ? 'Formato de guía, con recuadros para definiciones, fórmulas, trampas y ejemplos.'
    : 'Formato de presentación, pensado para repasar en clase o en video.'
}

function TemplateRow({ path, loader, onView }: { path: string; loader: Loader; onView: (v: Viewing) => void }) {
  const name = fileName(path)
  const { busy, prefetch, run } = useTexActions(path, loader, name, onView)
  return (
    <li className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
      <div className="min-w-0 flex-1 basis-64">
        <p className="truncate text-[13px] font-medium">{name.startsWith('guia') ? 'Formato de guía' : 'Formato de presentación'}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{describe(name)}</p>
      </div>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <button type="button" className={LINK} disabled={busy} onPointerEnter={prefetch} onFocus={prefetch} onClick={() => run('dl')}>Descargar archivo editable</button>
        <button type="button" className={LINK} disabled={busy} onPointerEnter={prefetch} onFocus={prefetch} onClick={() => run('ov')}>Editar en Overleaf</button>
        <button type="button" className={LINK} onClick={() => run('ver')}>Ver archivo</button>
      </p>
    </li>
  )
}

export function MaterialPage() {
  const [viewing, setViewing] = useState<Viewing | null>(null)
  const templateEntries = Object.entries(templates).sort(([a], [b]) => a.localeCompare(b))
  const bySubject = SUBJECT_ORDER.map((subject) => ({
    subject,
    entries: manifest.filter((e) => e.subject === subject).sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'guia' ? -1 : 1)),
  })).filter((g) => g.entries.length)

  return (
    <div className="space-y-12">
      <PageHeader
        title="Guías y Resúmenes PDF"
        description="Una guía de estudio y una presentación de repaso por materia, listas para leer o descargar."
      />

      {bySubject.length ? (
        <div className="space-y-6">
          {bySubject.map(({ subject, entries }) => (
            <section key={subject} aria-labelledby={`mat-${subject}`} className="space-y-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-1">
                <h2 id={`mat-${subject}`} className="text-[15px] font-semibold tracking-tight">{SUBJECTS[subject].name}</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {entries[0].axes.length} ejes, <span className="font-mono tabular-nums">{entries[0].subtopics}</span> subtemas
                </p>
              </div>
              <Panel>
                <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {entries.map((e) => <DocumentRow key={e.file} entry={e} onView={setViewing} />)}
                </ul>
              </Panel>
            </section>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-zinc-500">Las guías todavía no están disponibles. Vuelve a mirar en un rato.</p>
      )}

      <section aria-labelledby="plantillas" className="space-y-2.5">
        <div className="px-1">
          <h2 id="plantillas" className="text-[15px] font-semibold tracking-tight">Para profes y curiosos</h2>
          <p className="mt-0.5 max-w-2xl text-[13px] text-zinc-500 dark:text-zinc-400">Si haces clases o quieres armar tu propio material, aquí están los formatos base de las guías y presentaciones.</p>
        </div>
        <Panel>
          <ul className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
            {templateEntries.map(([path, loader]) => <TemplateRow key={path} path={path} loader={loader} onView={setViewing} />)}
          </ul>
        </Panel>
      </section>

      <Dialog open={viewing !== null} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent title={viewing?.name ?? 'Archivo'} description="El archivo con el que se genera este material." className="max-w-4xl">
          <pre className="mt-4 max-h-[65vh] overflow-auto rounded-lg border border-zinc-200/80 bg-zinc-50 p-3 font-mono text-[11.5px] leading-relaxed text-zinc-700 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:text-zinc-300">
            {viewing?.text ?? 'Cargando…'}
          </pre>
          {viewing?.text && (
            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" onClick={() => download(viewing.text!, viewing.name)}>Descargar archivo editable</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
