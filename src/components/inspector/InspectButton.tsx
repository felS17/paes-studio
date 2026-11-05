import { PanelRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInspectorStore, type InspectorTarget } from '@/store/useInspectorStore'

/** Abre un subtema, un eje o una asignatura en el Inspector sin salir de la vista actual. */
export function InspectButton({ target, name, withLabel, className }: {
  target: InspectorTarget
  /** Qué se abre, para el lector de pantalla y el texto de ayuda. */
  name: string
  withLabel?: boolean
  className?: string
}) {
  const open = useInspectorStore((s) => s.openInspector)
  const label = `Abrir «${name}» en el Inspector`
  return (
    <Button
      variant="ghost"
      size={withLabel ? 'sm' : 'icon-sm'}
      className={className}
      title={label}
      aria-label={label}
      onClick={() => open(target)}
    >
      <PanelRight />
      {withLabel && 'Abrir en Inspector'}
    </Button>
  )
}
