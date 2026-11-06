import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap'
import { AnimfetchHero } from '@/components/dashboard/AnimfetchHero'
import { ContactLine } from '@/components/layout/Footer'

/** Inicio: una ventana de terminal sobre el escritorio, tu actividad del mismo ancho y una línea de contacto. Nada más. */
export function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-5">
      <h1 className="sr-only">PAES Studio</h1>
      <AnimfetchHero />
      <ActivityHeatmap />
      <ContactLine />
    </div>
  )
}
