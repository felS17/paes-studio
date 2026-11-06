import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SUBJECT_ORDER } from '@/data/subjects'
import { THEMES } from '@/data/themes'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import type { SubjectId } from '@/types/exam'
import { normalizeText, queryTerms } from '@/utils/topicSearch'

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

const HELP = 'entrenar, entrenar 20, ensayos, temas, flashcards, mapa, guías, stats, daily, m1, m2, lectora, ciencias, historia, theme nord, font'

/** Prompt opcional para quien prefiere tipear. Todo lo que hace ya está a un clic en la lista de comandos y en la barra de tareas. */
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
    if (command === 'entrenar' || command === 'run') onTrain(arg === '20' ? 20 : 10)
    else if (command === 'daily') onDaily()
    else if (SUBJECT_ORDER.includes(command as SubjectId)) navigate(`/ensayos?asignatura=${command}`)
    else if (Object.hasOwn(ROUTES, command)) navigate(ROUTES[command])
    else if (command === 'font') openAppearance('fuente')
    else if (command === 'theme') {
      const match = arg && THEMES.find((t) => normalizeText(`${t.id} ${t.label}`).includes(arg))
      if (match) setTheme(match.id)
      else openAppearance('tema')
    } else if (command === 'help' || command === 'ayuda') setFeedback(HELP)
    else setFeedback(`no conozco «${raw.trim()}». escribe help o haz clic en un comando.`)
  }

  return (
    <form
      className="border-t border-zinc-200/80 px-4 py-2 font-mono dark:border-zinc-800/80"
      onSubmit={(e) => {
        e.preventDefault()
        run(value)
      }}
    >
      <label className="flex items-center gap-2 text-[13px]">
        <span aria-hidden className="shrink-0 text-zinc-500 dark:text-zinc-400">~/paes-studio <span className="text-accent">❯</span></span>
        <span className="sr-only">Escribe un comando (es opcional)</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="_"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          className="h-7 min-w-0 flex-1 rounded-sm bg-transparent text-[16px] text-zinc-900 placeholder:text-zinc-400 sm:text-[13px] dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </label>
      <p role="status" className="text-[12px] leading-relaxed text-zinc-500 not-empty:mt-1 dark:text-zinc-400">{feedback}</p>
    </form>
  )
}
