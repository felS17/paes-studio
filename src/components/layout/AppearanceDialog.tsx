import { useState } from 'react'
import { Check, Monitor } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { SearchInput } from '@/components/ui/search-input'
import { Segmented } from '@/components/ui/segmented'
import { UI_FONTS } from '@/data/fonts'
import { THEMES, THEME_BY_ID, type ThemeInfo } from '@/data/themes'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useWorkspaceStore, type AppearanceTab } from '@/store/useWorkspaceStore'
import { matchesTerms, normalizeText, queryTerms } from '@/utils/topicSearch'

const OPTION = 'rounded-lg border bg-surface text-left transition-colors duration-150'
const OPTION_IDLE = 'border-zinc-200/90 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700'
const OPTION_ACTIVE = 'border-accent ring-1 ring-accent'

/** Miniatura con los colores reales del tema: fondo, superficie con texto y sus dos acentos. */
function ThemePreview({ theme }: { theme: ThemeInfo }) {
  return (
    <span aria-hidden className="flex h-14 gap-1.5 rounded-md border border-zinc-400/25 p-1.5" style={{ background: theme.canvas }}>
      <span className="flex flex-1 flex-col justify-center gap-1.5 rounded-sm px-2" style={{ background: theme.surface }}>
        <span className="h-1 w-3/4 rounded-full" style={{ background: theme.text }} />
        <span className="h-1 w-1/2 rounded-full opacity-50" style={{ background: theme.text }} />
      </span>
      <span className="flex w-7 flex-col gap-1">
        <span className="flex-1 rounded-sm" style={{ background: theme.accent }} />
        <span className="flex-1 rounded-sm" style={{ background: theme.accent2 }} />
      </span>
    </span>
  )
}

function ThemePanel() {
  const { theme, resolved, setTheme } = useTheme()
  const [query, setQuery] = useState('')
  const terms = queryTerms(query)
  const list = THEMES.filter((t) => matchesTerms(normalizeText(`${t.label} ${t.hint} ${t.dark ? 'oscuro' : 'claro'}`), terms))

  return (
    <>
      <form
        className="mt-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (list[0]) setTheme(list[0].id)
        }}
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Busca por nombre o color: nord, azul, claro…" label="Buscar tema" />
      </form>
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
        {list.length > 0 ? (
          <ul className="grid gap-2 p-px sm:grid-cols-2">
            {list.map((t) => {
              const active = theme === t.id
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTheme(t.id)}
                    className={cn(OPTION, 'block w-full p-1.5', active ? OPTION_ACTIVE : OPTION_IDLE)}
                  >
                    <ThemePreview theme={t} />
                    <span className="mt-1.5 flex items-center justify-between gap-2 px-1 text-[13px] font-medium">
                      {t.label}
                      {active && <Check aria-hidden className="size-3.5 shrink-0" />}
                    </span>
                    <span className="block truncate px-1 pb-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">{t.hint}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="py-6 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
            No hay temas con «{query.trim()}». Prueba con un color, como azul o rosa.
          </p>
        )}
      </div>
      <button
        type="button"
        aria-pressed={theme === 'system'}
        onClick={() => setTheme('system')}
        className={cn(OPTION, 'mt-2 flex w-full items-center gap-2 px-3 py-2 text-[13px]', theme === 'system' ? OPTION_ACTIVE : OPTION_IDLE)}
      >
        <Monitor aria-hidden className="size-3.5 shrink-0" />
        Igual que tu dispositivo
        {theme === 'system' && <span className="ml-auto truncate text-[12px] text-zinc-500 dark:text-zinc-400">Ahora: {THEME_BY_ID[resolved].label}</span>}
      </button>
    </>
  )
}

function FontPanel() {
  const uiFont = useSettingsStore((s) => s.uiFont)
  const setUiFont = useSettingsStore((s) => s.setUiFont)
  return (
    <>
      <ul className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto p-px">
        {UI_FONTS.map((f) => {
          const active = uiFont === f.id
          return (
            <li key={f.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setUiFont(f.id)}
                className={cn(OPTION, 'flex w-full items-center justify-between gap-3 px-3 py-2.5', active ? OPTION_ACTIVE : OPTION_IDLE)}
              >
                <span className="min-w-0" style={{ fontFamily: f.stack }}>
                  <span className="block text-[15px] font-medium">{f.label}</span>
                  <span className="block truncate text-[12.5px] text-zinc-500 dark:text-zinc-400">{f.hint}. Resuelve x² + 2x = 15.</span>
                </span>
                {active && <Check aria-hidden className="size-3.5 shrink-0" />}
              </button>
            </li>
          )
        })}
      </ul>
      <p className="mt-3 text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        Cambia el Inicio y los menús. Cuando rindes un ensayo o practicas, las preguntas usan siempre una letra normal de examen.
      </p>
    </>
  )
}

/** Selector de Apariencia, único para toda la app: lo abren la barra lateral, el Hero y la barra de estado. */
export function AppearanceDialog() {
  const tab = useWorkspaceStore((s) => s.appearance)
  const openAppearance = useWorkspaceStore((s) => s.openAppearance)
  const closeAppearance = useWorkspaceStore((s) => s.closeAppearance)
  return (
    <Dialog
      open={tab !== null}
      onOpenChange={(open) => {
        if (!open) closeAppearance()
      }}
    >
      <DialogContent
        title="Apariencia"
        className="flex max-h-[min(88dvh,44rem)] max-w-2xl flex-col"
        // Con mouse se puede buscar de inmediato; en el celular no abrimos el teclado sin que lo pidas.
        onOpenAutoFocus={(e) => {
          const input = (e.currentTarget as HTMLElement).querySelector('input')
          if (input && matchMedia('(pointer: fine)').matches) {
            e.preventDefault()
            input.focus()
          }
        }}
      >
        <Segmented<AppearanceTab>
          label="Qué quieres cambiar"
          className="mt-3 self-start"
          value={tab ?? 'tema'}
          onChange={openAppearance}
          options={[
            { value: 'tema', label: 'Tema de colores' },
            { value: 'fuente', label: 'Tipografía de Interfaz' },
          ]}
        />
        {tab === 'fuente' ? <FontPanel /> : <ThemePanel />}
      </DialogContent>
    </Dialog>
  )
}
