import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SUBJECT_ORDER } from '@/data/subjects'
import { THEMES } from '@/data/themes'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import type { SubjectId } from '@/types/exam'
import { normalizeText, queryTerms } from '@/utils/topicSearch'

const CHIPS = ['run 10', 'daily', 'm1', 'm2', 'lectora', 'graph', 'theme']

const ROUTES: Record<string, string> = {
  ensayos: '/ensayos',
  temas: '/subtemas',
  flash: '/flashcards',
  flashcards: '/flashcards',
  graph: '/zettelkasten',
  mapa: '/zettelkasten',
  pdf: '/material',
  guias: '/material',
  stats: '/analitica',
}

const HELP = 'Puedes escribir: run 10, run 20, daily, m1, m2, lectora, ciencias, historia, ensayos, temas, flash, graph, pdf, stats, theme nord o font.'

/**
 * Atajo opcional para quien prefiere tipear. Todo lo que hace ya está en los botones de arriba y en las tarjetas de
 * abajo, y los chips corren el comando con un solo clic: nunca hace falta saber usar una terminal.
 */
export function HubShell({ onTrain, onDaily }: { onTrain: (size: 10 | 20) => void; onDaily: () => void }) {
  const navigate = useNavigate()
  const setTheme = useSettingsStore((s) => s.setTheme)
  const openAppearance = useWorkspaceStore((s) => s.openAppearance)
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState('')

  const run = (raw: string) => {
    const [command = '', arg = ''] = queryTerms(raw)
    setValue('')
    setFeedback('')
    if (!command) return
    if (command === 'run') onTrain(arg === '20' ? 20 : 10)
    else if (command === 'daily') onDaily()
    else if (SUBJECT_ORDER.includes(command as SubjectId)) navigate(`/ensayos?asignatura=${command}`)
    else if (Object.hasOwn(ROUTES, command)) navigate(ROUTES[command])
    else if (command === 'font') openAppearance('fuente')
    else if (command === 'theme') {
      const match = arg && THEMES.find((t) => normalizeText(`${t.id} ${t.label}`).includes(arg))
      if (match) setTheme(match.id)
      else openAppearance('tema')
    } else if (command === 'help' || command === 'ayuda') setFeedback(HELP)
    else setFeedback(`No conozco «${raw.trim()}». Usa los botones de arriba o escribe help para ver los comandos.`)
  }

  return (
    <div className="font-mono">
      <div className="flex flex-col gap-2 @3xl:flex-row @3xl:items-center">
        <form
          className="min-w-0 @3xl:w-80 @3xl:shrink-0"
          onSubmit={(e) => {
            e.preventDefault()
            run(value)
          }}
        >
          <label className="flex h-8 items-center gap-2 rounded-lg border border-zinc-200/80 bg-canvas px-2.5 transition-colors focus-within:border-accent focus-within:ring-1 focus-within:ring-accent hover:border-zinc-300 dark:border-zinc-800/80 dark:hover:border-zinc-700">
            <span aria-hidden className="text-[13px] text-accent">❯</span>
            <span className="sr-only">Escribe un comando (es opcional)</span>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="escribe un comando o haz clic arriba..."
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent text-[16px] text-zinc-900 outline-none placeholder:text-zinc-400 sm:text-[12.5px] dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
          </label>
        </form>
        <ul className="flex flex-wrap gap-1" aria-label="Comandos sugeridos">
          {CHIPS.map((chip) => (
            <li key={chip}>
              <button
                type="button"
                onClick={() => run(chip)}
                className="h-7 rounded-md border border-zinc-200/80 px-2 text-[12px] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800/80 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-100"
              >
                {chip}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p role="status" className="text-[12px] leading-relaxed text-zinc-500 not-empty:mt-2 dark:text-zinc-400">{feedback}</p>
    </div>
  )
}
