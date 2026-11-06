import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UI_FONTS, UI_FONT_BY_ID } from '@/data/fonts'
import { THEME_BY_ID } from '@/data/themes'
import { useTheme } from '@/hooks/useTheme'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useStreakStore } from '@/store/useStreakStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { localDateKey } from '@/utils/daily'
import { streakSummary } from '@/utils/streak'
import { ThemeSwatch } from './ThemeToggle'

const ITEM =
  'inline-flex h-6 min-w-0 items-center gap-1.5 px-2 whitespace-nowrap transition-colors hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:hover:bg-zinc-100/[0.06] dark:hover:text-zinc-100'

/** Barra de estado del layout: tu racha y, a un clic, el tema y la fuente. El AppShell la oculta durante un ExamRunner. */
export function StatusBar() {
  const { resolved } = useTheme()
  const uiFont = useSettingsStore((s) => s.uiFont)
  const openAppearance = useWorkspaceStore((s) => s.openAppearance)
  const days = useStreakStore((s) => s.days)
  const [today] = useState(() => localDateKey())
  const { current } = streakSummary(days, today)
  const font = UI_FONT_BY_ID[uiFont] ?? UI_FONTS[0]
  const theme = THEME_BY_ID[resolved]

  return (
    <div
      role="group"
      aria-label="Tu racha y apariencia"
      className="flex h-6 shrink-0 items-center justify-between gap-2 border-t border-zinc-200/80 bg-canvas font-mono text-[11px] text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400"
    >
      <Link to="/" className={ITEM} title="Ver tu racha de estudio en el Inicio">
        Racha
        <span className="text-zinc-900 tabular-nums dark:text-zinc-100">{current} {current === 1 ? 'día' : 'días'}</span>
      </Link>
      <div className="flex min-w-0">
        <button type="button" className={ITEM} onClick={() => openAppearance('tema')} aria-label={`Cambiar tema. Ahora usas ${theme.label}`}>
          <ThemeSwatch id={resolved} />
          <span className="max-sm:hidden">Tema</span>
          <span className="truncate text-zinc-900 dark:text-zinc-100">{theme.label}</span>
        </button>
        <button type="button" className={ITEM} onClick={() => openAppearance('fuente')} aria-label={`Cambiar fuente. Ahora usas ${font.label}`}>
          <span className="max-sm:hidden">Fuente</span>
          <span className="truncate text-zinc-900 dark:text-zinc-100">{font.label}</span>
        </button>
      </div>
    </div>
  )
}
