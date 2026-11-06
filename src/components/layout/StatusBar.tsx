import { Link } from 'react-router-dom'
import { PixelIcon } from '@/components/icons/PixelIcon'
import { UI_FONTS, UI_FONT_BY_ID } from '@/data/fonts'
import { THEME_BY_ID } from '@/data/themes'
import { usePaesCountdown } from '@/hooks/usePaesCountdown'
import { useStreak } from '@/hooks/useStreak'
import { useTheme } from '@/hooks/useTheme'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'

const ITEM =
  'inline-flex h-6 min-w-0 items-center gap-1.5 px-2 whitespace-nowrap transition-colors hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:hover:bg-zinc-100/[0.06] dark:hover:text-zinc-100'

/** Barra de estado del layout: tu racha y, a un clic, el tema y la fuente. El AppShell la oculta durante un ExamRunner. */
export function StatusBar() {
  const { resolved } = useTheme()
  const uiFont = useSettingsStore((s) => s.uiFont)
  const openAppearance = useWorkspaceStore((s) => s.openAppearance)
  const { current } = useStreak()
  const countdown = usePaesCountdown()
  const font = UI_FONT_BY_ID[uiFont] ?? UI_FONTS[0]
  const theme = THEME_BY_ID[resolved]

  return (
    <div
      role="group"
      aria-label="Tu racha y apariencia"
      className="flex h-6 shrink-0 items-center justify-between gap-2 border-t border-zinc-200/80 bg-canvas font-mono text-[11px] text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400"
    >
      <div className="flex min-w-0">
        <Link to="/" className={ITEM} title="racha de estudio">
          <PixelIcon name="flame" />
          <span className="text-zinc-900 tabular-nums dark:text-zinc-100">{current} {current === 1 ? 'día' : 'días'}</span>
        </Link>
        <Link to="/" className={`${ITEM} max-md:hidden`} title={`faltan ${countdown.days} días y ${countdown.hours} horas para la ${countdown.date.name}`}>
          <PixelIcon name="hourglass" />
          <span className="text-zinc-900 tabular-nums dark:text-zinc-100">{countdown.days}d {String(countdown.hours).padStart(2, '0')}h</span>
        </Link>
      </div>
      <div className="flex min-w-0">
        <button type="button" className={ITEM} onClick={() => openAppearance('tema')} aria-label={`Cambiar tema. Ahora usas ${theme.label}`}>
          <PixelIcon name="palette" />
          <span className="truncate text-zinc-900 dark:text-zinc-100">{theme.label}</span>
        </button>
        <button type="button" className={ITEM} onClick={() => openAppearance('fuente')} aria-label={`Cambiar fuente. Ahora usas ${font.label}`}>
          <PixelIcon name="type" />
          <span className="truncate text-zinc-900 dark:text-zinc-100">{font.label}</span>
        </button>
      </div>
    </div>
  )
}
