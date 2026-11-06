import { PixelIcon } from '@/components/icons/PixelIcon'
import { THEME_BY_ID } from '@/data/themes'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import { DOCK_IDLE, DOCK_ITEM, DOCK_RAIL } from './nav'

/** `apariencia` en la bandeja de la barra de tareas: abre el selector de temas y fuentes. */
export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, resolved } = useTheme()
  const openAppearance = useWorkspaceStore((s) => s.openAppearance)
  const { label } = THEME_BY_ID[resolved]
  const title = `apariencia: ${theme === 'system' ? `automático, ${label}` : label}`
  return (
    <button
      type="button"
      onClick={() => openAppearance('tema')}
      title={title}
      aria-label={compact ? title : undefined}
      className={cn(DOCK_ITEM, DOCK_IDLE, compact ? DOCK_RAIL : 'w-full')}
    >
      <PixelIcon name="palette" />
      {!compact && 'apariencia'}
    </button>
  )
}
