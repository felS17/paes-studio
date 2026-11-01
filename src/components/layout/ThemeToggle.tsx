import { Monitor, Moon, Sun } from 'lucide-react'
import { Segmented } from '@/components/ui/segmented'
import { useTheme } from '@/hooks/useTheme'
import type { ThemePreference } from '@/types/user'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  return (
    <Segmented<ThemePreference>
      label="Tema"
      size="sm"
      className={className}
      value={theme}
      onChange={setTheme}
      options={[
        { value: 'light', label: <Sun className="size-3.5" aria-label="Claro" />, title: 'Tema claro' },
        { value: 'dark', label: <Moon className="size-3.5" aria-label="Oscuro" />, title: 'Tema oscuro' },
        { value: 'system', label: <Monitor className="size-3.5" aria-label="Sistema" />, title: 'Según el sistema' },
      ]}
    />
  )
}
