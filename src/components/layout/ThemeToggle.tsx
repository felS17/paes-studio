import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { useTheme } from '@/hooks/useTheme'
import type { ThemePreference } from '@/types/user'

const NEXT: Record<ThemePreference, ThemePreference> = { light: 'dark', dark: 'system', system: 'light' }
const LABEL: Record<ThemePreference, string> = { light: 'Tema claro', dark: 'Tema oscuro', system: 'Según el sistema' }
const ICON = { light: Sun, dark: Moon, system: Monitor }

/** Selector de tema; `compact` lo reduce a un botón que rota entre las tres opciones (barra de íconos). */
export function ThemeToggle({ className, compact }: { className?: string; compact?: boolean }) {
  const { theme, setTheme } = useTheme()
  if (compact) {
    const Icon = ICON[theme]
    return (
      <Button
        variant="ghost"
        size="icon"
        className={className}
        onClick={() => setTheme(NEXT[theme])}
        title={`${LABEL[theme]}. Cambiar a: ${LABEL[NEXT[theme]].toLowerCase()}`}
        aria-label={`${LABEL[theme]}. Cambiar a: ${LABEL[NEXT[theme]].toLowerCase()}`}
      >
        <Icon />
      </Button>
    )
  }
  return (
    <Segmented<ThemePreference>
      label="Tema"
      size="sm"
      className={className}
      value={theme}
      onChange={setTheme}
      options={[
        { value: 'light', label: <Sun className="size-3.5" aria-label="Claro" />, title: LABEL.light },
        { value: 'dark', label: <Moon className="size-3.5" aria-label="Oscuro" />, title: LABEL.dark },
        { value: 'system', label: <Monitor className="size-3.5" aria-label="Sistema" />, title: LABEL.system },
      ]}
    />
  )
}
