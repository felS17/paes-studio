import { Button } from '@/components/ui/button'
import { THEME_BY_ID } from '@/data/themes'
import { useTheme } from '@/hooks/useTheme'
import { useWorkspaceStore } from '@/store/useWorkspaceStore'
import type { ThemeId } from '@/types/user'

/** Muestra del tema con sus colores reales: fondo y acento. */
export function ThemeSwatch({ id }: { id: ThemeId }) {
  const theme = THEME_BY_ID[id]
  return (
    <span
      aria-hidden
      className="flex size-3.5 shrink-0 items-center justify-center rounded-[4px] border border-zinc-400/50"
      style={{ background: theme.canvas }}
    >
      <span className="size-1.5 rounded-full" style={{ background: theme.accent }} />
    </span>
  )
}

/** Abre el selector de Apariencia desde la barra lateral; `compact` lo reduce a un ícono (barra de íconos). */
export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, resolved } = useTheme()
  const openAppearance = useWorkspaceStore((s) => s.openAppearance)
  const { label } = THEME_BY_ID[resolved]
  const name = theme === 'system' ? `Automático, ${label}` : label

  if (compact) {
    const title = `Cambiar tema y tipografía. Ahora usas ${name}`
    return (
      <Button variant="ghost" size="icon" onClick={() => openAppearance('tema')} title={title} aria-label={title}>
        <ThemeSwatch id={resolved} />
      </Button>
    )
  }
  return (
    <button
      type="button"
      onClick={() => openAppearance('tema')}
      title={name}
      className="flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-[12px] text-zinc-500 transition-colors hover:bg-zinc-900/[0.03] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-100/[0.04] dark:hover:text-zinc-100"
    >
      <ThemeSwatch id={resolved} />
      Apariencia
      <span className="ml-auto truncate font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
    </button>
  )
}
