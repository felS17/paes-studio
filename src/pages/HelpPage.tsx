import { useSearchParams } from 'react-router-dom'
import { HUB_COMMANDS } from '@/components/dashboard/hubCommands'
import { PageHeader } from '@/components/layout/AppShell'
import { SIDEBAR_SHORTCUT } from '@/components/layout/nav'
import { Kbd } from '@/components/ui/kbd'
import { Tabs } from '@/components/ui/tabs'

type View = 'comandos' | 'atajos'
const VIEWS: View[] = ['comandos', 'atajos']

const LIST = 'divide-y divide-zinc-200/80 border-y border-zinc-200/80 dark:divide-zinc-800/80 dark:border-zinc-800/80'
const HEADING = 'mb-1.5 font-mono text-[12px] text-zinc-500 dark:text-zinc-400'
const ROW = 'flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2.5 text-[13.5px]'

/** Cómo se usa el prompt del inicio. Es opcional: todo lo que hace también está a un clic. */
const PROMPT: [React.ReactNode, string][] = [
  [<Kbd key="s">/</Kbd>, 'abre el menú de comandos (también help o ayuda)'],
  [<Kbd key="e">enter</Kbd>, 'con el campo vacío, entrena 10 rápidas'],
  [<span key="m" className="flex gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd></span>, 'moverte por el menú'],
  [<Kbd key="t">tab</Kbd>, 'completar el comando'],
  [<Kbd key="x">esc</Kbd>, 'cerrar el menú'],
]

const EXAM: [string[], string][] = [
  [['A', '–', 'E'], 'marcar una alternativa'],
  [['shift', '+', 'A–E'], 'tachar o recuperar una alternativa (también clic derecho)'],
  [['←', '→'], 'pregunta anterior o siguiente'],
  [['F'], 'marcar la pregunta como duda'],
  [['enter'], 'en práctica, verificar y luego avanzar'],
  [['retroceso'], 'borrar tu respuesta'],
]

const OTHER: [string[], string][] = [
  [[SIDEBAR_SHORTCUT], 'achicar o expandir la barra lateral'],
  [['esc'], 'cerrar el resumen del tema'],
  [['espacio'], 'en flashcards, voltear la tarjeta'],
  [['1', '2', '3', '4'], 'en flashcards, calificar: otra vez, difícil, bien, fácil'],
]

function Keys({ keys }: { keys: string[] }) {
  return (
    <span className="flex w-[9.5rem] shrink-0 items-center gap-1">
      {keys.map((k, i) => (['–', '+'].includes(k) ? <span key={i} className="text-zinc-500 dark:text-zinc-400">{k}</span> : <Kbd key={i}>{k}</Kbd>))}
    </span>
  )
}

function Commands() {
  return (
    <div className="space-y-6">
      <section>
        <h2 className={HEADING}>prompt del inicio</h2>
        <ul className={LIST}>
          {PROMPT.map(([key, text]) => (
            <li key={text} className={ROW}>
              <span className="flex w-[9.5rem] shrink-0">{key}</span>
              <span className="min-w-0 flex-1">{text}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className={HEADING}>comandos</h2>
        <ul className={LIST}>
          {HUB_COMMANDS.filter((c) => !c.hidden).map((c) => (
            <li key={c.name} className={ROW}>
              <span className="w-[9.5rem] shrink-0 font-mono text-[13px]">{c.label ?? `/${c.name}`}</span>
              <span className="min-w-0 flex-1 text-zinc-600 dark:text-zinc-300">{c.hint}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function Shortcuts() {
  return (
    <div className="space-y-6">
      {([['en un ensayo o práctica', EXAM], ['en el resto de la app', OTHER]] as const).map(([title, rows]) => (
        <section key={title}>
          <h2 className={HEADING}>{title}</h2>
          <ul className={LIST}>
            {rows.map(([keys, text]) => (
              <li key={text} className={ROW}>
                <Keys keys={keys} />
                <span className="min-w-0 flex-1">{text}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/** Ayuda (`/ayuda`): los comandos del prompt y los atajos de teclado, fuera de la pantalla principal. */
export function HelpPage() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('vista') as View | null
  const view: View = requested && VIEWS.includes(requested) ? requested : 'comandos'
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="ayuda" />
      <Tabs<View>
        label="Ayuda"
        value={view}
        onChange={(v) => setParams(v === 'comandos' ? {} : { vista: v }, { replace: true })}
        items={[
          { value: 'comandos', label: 'comandos' },
          { value: 'atajos', label: 'atajos de teclado' },
        ]}
      >
        {view === 'comandos' ? <Commands /> : <Shortcuts />}
      </Tabs>
    </div>
  )
}
