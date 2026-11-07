import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { THEMES } from '@/data/themes'
import { cn } from '@/lib/utils'
import { normalizeUserName, useSettingsStore } from '@/store/useSettingsStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import type { SubjectId } from '@/types/exam'
import { normalizeText, queryTerms } from '@/utils/topicSearch'
import { filterCommands, findCommand, isHelpText, menuQuery, type HubCommand } from './hubCommands'

interface HubShellProps {
  onTrain: (size: 10 | 20, subject?: SubjectId) => void
  onDaily: () => void
  onQuote: () => void
  /** Abre la edición del nombre en la barra de la ventana. */
  onEditName: () => void
}

/**
 * Prompt del Inicio con menú `/`, como en Notion o Discord: se navega con flechas y Enter o con el mouse. Es opcional:
 * los comandos más usados ya están a un clic arriba, y con el campo vacío Enter parte a entrenar.
 */
export function HubShell({ onTrain, onDaily, onQuote, onEditName }: HubShellProps) {
  const navigate = useNavigate()
  const setTheme = useSettingsStore((s) => s.setTheme)
  const userName = useSettingsStore((s) => s.userName)
  const setUserName = useSettingsStore((s) => s.setUserName)
  const openAppearance = useWorkspaceStore((s) => s.openAppearance)
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState('')
  /** Cerrado a mano con Esc o al salir del campo, aunque el texto siga pidiendo el menú. */
  const [dismissed, setDismissed] = useState(false)
  const [active, setActive] = useState(0)

  const query = menuQuery(value)
  const matches = query === null ? [] : filterCommands(query)
  const open = !dismissed && matches.length > 0
  const activeId = open && matches[active] ? `${listId}-${matches[active].name}` : undefined

  useEffect(() => {
    if (open) listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const change = (next: string) => {
    setValue(next)
    setFeedback('')
    setDismissed(false)
    // Tras escribir `help` nada queda elegido, para que Enter no lance algo por sorpresa.
    setActive(isHelpText(next) ? -1 : 0)
  }

  const run = (command: HubCommand, arg = '', typed = '', rawArg = '') => {
    change('')
    const { action } = command
    if (action.kind === 'name') {
      const next = normalizeUserName(rawArg)
      if (!next) {
        onEditName()
        return
      }
      setUserName(next)
      setFeedback(userName ? `listo, ahora eres ${next}.` : `hola, ${next}. esta sesión ya es tuya.`)
      return
    }
    if (action.kind === 'train') onTrain(arg === '20' || typed === '20' ? 20 : 10, action.subject)
    else if (action.kind === 'route') navigate(action.to)
    else if (action.kind === 'daily') onDaily()
    else if (action.kind === 'quote') onQuote()
    else if (action.kind === 'font') openAppearance('fuente')
    else {
      const theme = arg && THEMES.find((t) => normalizeText(`${t.id} ${t.label}`).includes(arg))
      if (theme) setTheme(theme.id)
      else openAppearance('tema')
    }
  }

  const submit = () => {
    if (open) {
      const command = matches[active]
      if (command) run(command)
      else change('/')
      return
    }
    const text = value.trim()
    if (!text) {
      onTrain(10)
      return
    }
    if (text === '/' || isHelpText(text)) {
      change('/')
      return
    }
    const [word = '', arg = ''] = queryTerms(text.replace(/^\/+/, ''))
    const command = findCommand(word)
    if (command) {
      run(command, arg, word, text.split(/\s+/).slice(1).join(' '))
      return
    }
    change('')
    setFeedback(`mmm${userName ? `, ${userName}` : ''}, «${text}» no me suena. escribe /help y te muestro todo lo que sé hacer.`)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === 'ArrowDown' && !value) {
        e.preventDefault()
        change('/')
      } else if (e.key === 'Escape' && value) {
        e.preventDefault()
        e.stopPropagation()
        change('')
      }
      return
    }
    const count = matches.length
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (a + 1) % count)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (a <= 0 ? count : a) - 1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setDismissed(true)
    } else if (e.key === 'Tab' && matches[active] && value !== `/${matches[active].name}`) {
      // Autocompletar. Si ya está completo, Tab sigue su camino y el foco no queda atrapado.
      e.preventDefault()
      change(`/${matches[active].name}`)
    }
  }

  const toggleMenu = () => {
    if (open) setDismissed(true)
    else {
      change('/')
      inputRef.current?.focus()
    }
  }

  return (
    <form
      className="relative border-t border-zinc-200/80 px-3 py-2.5 font-mono dark:border-zinc-800/80"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      {open && (
        <div className="absolute inset-x-3 bottom-full z-20 mb-1 max-w-2xl overflow-hidden rounded-lg border border-zinc-200/80 bg-surface shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:border-zinc-800/80">
          <ul ref={listRef} id={listId} role="listbox" aria-label="Comandos" className="max-h-[min(55vh,21rem)] overflow-y-auto py-1">
            {matches.map((command, i) => (
              <li
                key={command.name}
                id={`${listId}-${command.name}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                // Sin esto, el clic le quita el foco al campo y cierra el menú antes de elegir.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => run(command)}
                className={cn(
                  'flex min-h-9 cursor-pointer flex-wrap items-center gap-x-3 px-3 py-1.5 text-[13px]',
                  i === active && 'bg-zinc-900/[0.05] dark:bg-zinc-100/[0.07]',
                )}
              >
                <span className={cn('w-[15ch] shrink-0', i === active ? 'text-accent' : 'text-zinc-900 dark:text-zinc-100')}>{command.label ?? `/${command.name}`}</span>
                <span className="min-w-0 flex-1 basis-40 text-[12px] text-zinc-500 dark:text-zinc-400">{command.hint}</span>
              </li>
            ))}
          </ul>
          <p aria-hidden className="hidden border-t border-zinc-200/80 px-3 py-1.5 text-[11px] text-zinc-500 @md:block dark:border-zinc-800/80 dark:text-zinc-400">
            ↑↓ moverte, enter abrir, tab completar, esc cerrar
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 text-[13.5px]">
        <label className="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-md px-2 transition-colors focus-within:bg-zinc-900/[0.04] dark:focus-within:bg-zinc-100/[0.05]">
          <span aria-hidden className="shrink-0 text-zinc-500 dark:text-zinc-400">
            <span className="hidden @md:inline">{userName ?? 'paes'}@studio </span>
            <span className="text-accent">❯</span>
          </span>
          <span className="sr-only">Escribe un comando (es opcional)</span>
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            value={value}
            onChange={(e) => change(e.target.value)}
            onKeyDown={onKeyDown}
            onFocus={() => setDismissed(false)}
            onBlur={() => setDismissed(true)}
            placeholder="escribe / para ver comandos, o presiona enter para entrenar 10 rápidas..."
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            className="h-7 min-w-0 flex-1 truncate bg-transparent text-[16px] text-zinc-900 outline-none placeholder:text-zinc-400 sm:text-[13.5px] dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </label>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggleMenu}
          className="shrink-0 rounded-sm px-1 text-[12px] whitespace-nowrap text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
        >
          [ / comandos ]
        </button>
      </div>
      <p role="status" className="px-2 text-[12.5px] leading-relaxed text-zinc-600 not-empty:mt-1 dark:text-zinc-300">{feedback}</p>
    </form>
  )
}
