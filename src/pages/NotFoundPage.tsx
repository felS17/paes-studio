import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'

export function NotFoundPage() {
  return (
    <EmptyState title="Esta página no existe" action={<Button variant="primary" asChild><Link to="/">Ir a ensayos</Link></Button>}>
      Revisa la dirección o vuelve al listado de ensayos.
    </EmptyState>
  )
}
