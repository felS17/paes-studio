import { PanelRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useInspectorStore, type InspectorTarget } from '@/store/useInspectorStore'

/** Abre un subtema, un eje o una asignatura en el Inspector sin salir de la vista actual. */
export function InspectButton({ target, name, text, className }: {
  target: InspectorTarget
  /** Qué se abre, para el lector de pantalla y el texto de ayuda. */
  name: string
  /** Texto visible; sin él, el botón es solo un ícono. */
  text?: string
  className?: string
}) {
  const open = useInspectorStore((s) => s.openInspector)
  const label = `Ver el resumen de «${name}»`
  return (
    <Button
      variant="ghost"
      size={text ? 'sm' : 'icon-sm'}
      className={className}
      title={label}
      aria-label={label}
      onClick={() => open(target)}
    >
      <PanelRight />
      {text}
    </Button>
  )
}
