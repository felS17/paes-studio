import { Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { THEMES, THEME_BY_ID } from '@/data/themes'
import { useTheme } from '@/hooks/useTheme'
import type { ThemeId, ThemePreference } from '@/types/user'

const AUTO_LABEL = 'Igual que tu dispositivo'

/** Muestra del tema con sus colores reales: fondo y acento. */
function ThemeSwatch({ id }: { id: ThemeId }) {
  const theme = THEME_BY_ID[id]
  return (
    <span
      role="img"
      aria-label={theme.label}
      className="flex size-3.5 items-center justify-center rounded-[4px] border border-zinc-400/50"
      style={{ background: theme.canvas }}
    >
      <span className="size-1.5 rounded-full" style={{ background: theme.accent }} />
    </span>
  )
}

/** Selector de los 4 temas; `compact` lo reduce a un botón que los recorre (barra de íconos). */
export function ThemeToggle({ className, compact }: { className?: string; compact?: boolean }) {
  const { theme, resolved, setTheme } = useTheme()
  const current = THEME_BY_ID[resolved]

  if (compact) {
    const next = THEMES[(THEMES.findIndex((t) => t.id === resolved) + 1) % THEMES.length]
    const label = `Tema: ${current.label}. Cambiar a ${next.label}`
    return (
      <Button variant="ghost" size="icon" className={className} onClick={() => setTheme(next.id)} title={label} aria-label={label}>
        <ThemeSwatch id={resolved} />
      </Button>
    )
  }

  return (
    <div className={className}>
      <p className="mb-1.5 flex items-baseline justify-between gap-2 text-[11.5px] text-zinc-500 dark:text-zinc-400">
        Tema
        <span className="truncate font-medium text-zinc-900 dark:text-zinc-100" title={theme === 'system' ? AUTO_LABEL : current.hint}>
          {theme === 'system' ? `Automático, ${current.label}` : current.label}
        </span>
      </p>
      <Segmented<ThemePreference>
        label="Tema"
        size="sm"
        value={theme}
        onChange={setTheme}
        options={[
          ...THEMES.map((t) => ({ value: t.id, label: <ThemeSwatch id={t.id} />, title: `${t.label}: ${t.hint}` })),
          { value: 'system' as const, label: <Monitor className="size-3.5" aria-label={AUTO_LABEL} />, title: AUTO_LABEL },
        ]}
      />
    </div>
  )
}
