import { useEffect, useRef, useState } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'

const FAINT = 'text-zinc-500 dark:text-zinc-400'
const ACTION = `rounded-sm transition-colors hover:text-accent ${FAINT}`

function greetingFor(hour: number) {
  if (hour >= 6 && hour < 12) return 'buenos días'
  if (hour >= 12 && hour < 20) return 'buenas tardes'
  return 'buenas noches'
}

/**
 * Barra de la ventana del Inicio: `<nombre>@studio`, que se edita ahí mismo con un clic o con `/nombre` en el prompt.
 * Enter o salir del campo guarda; Esc cancela; dejarlo vacío vuelve a `paes@studio`.
 */
export function SessionName({ editing, onEditingChange }: { editing: boolean; onEditingChange: (editing: boolean) => void }) {
  const userName = useSettingsStore((s) => s.userName)
  const setUserName = useSettingsStore((s) => s.setUserName)
  const [greeting] = useState(() => greetingFor(new Date().getHours()))
  const input = useRef<HTMLInputElement>(null)
  /** Esc también saca el foco del campo: sin esto, ese blur guardaría lo que se quiso cancelar. */
  const canceled = useRef(false)

  useEffect(() => {
    if (editing) input.current?.select()
  }, [editing])

  const save = () => {
    if (canceled.current) canceled.current = false
    else setUserName(input.current?.value ?? '')
    onEditingChange(false)
  }

  return (
    <div className={`flex min-h-[33px] flex-wrap items-center justify-between gap-x-4 border-b border-zinc-200/80 px-5 py-1.5 font-mono text-[12px] dark:border-zinc-800/80 ${FAINT}`}>
      {editing ? (
        <form
          className="flex items-center"
          onSubmit={(e) => {
            e.preventDefault()
            input.current?.blur()
          }}
        >
          <label className="sr-only" htmlFor="session-name">Tu nombre en esta sesión</label>
          <input
            ref={input}
            id="session-name"
            autoFocus
            type="text"
            defaultValue={userName ?? ''}
            placeholder="tu-nombre"
            maxLength={16}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key !== 'Escape') return
              e.preventDefault()
              e.stopPropagation()
              canceled.current = true
              input.current?.blur()
            }}
            className="w-[16ch] bg-transparent text-[16px] text-zinc-900 outline-none placeholder:text-zinc-400 sm:text-[12px] dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <span aria-hidden>@studio</span>
        </form>
      ) : (
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => onEditingChange(true)} title="Cambiar tu nombre" className={ACTION}>
            {userName ?? 'paes'}@studio
          </button>
          {!userName && <button type="button" onClick={() => onEditingChange(true)} className={ACTION}>[ + tu nombre ]</button>}
        </div>
      )}
      {userName && !editing && <span>{greeting}, {userName}</span>}
    </div>
  )
}
