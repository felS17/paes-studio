import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import licenseText from '../../../LICENSE?raw'

const LINK = 'rounded underline-offset-4 transition-colors hover:text-zinc-900 hover:underline dark:hover:text-zinc-100'

/** Autoría y contacto en una sola línea; es también el pie del Inicio. */
export function ContactLine() {
  return (
    <p className="flex flex-wrap items-center gap-x-2 font-mono text-[12px] text-zinc-500 dark:text-zinc-400">
      <span className="normal-case">felS</span>
      <span aria-hidden>·</span>
      <a className={LINK} href="https://github.com/felS17" target="_blank" rel="noopener noreferrer" aria-label="GitHub de felS (abre en una pestaña nueva)">github</a>
      <span aria-hidden>·</span>
      <a className={LINK} href="https://github.com/felS17/paes-studio/issues" target="_blank" rel="noopener noreferrer" aria-label="Enviar una sugerencia o reportar un error (abre en una pestaña nueva)">sugerencias</a>
    </p>
  )
}

/** Pie de las vistas con layout (el Inicio usa solo `ContactLine`): contacto y licencia. */
export function Footer() {
  const [open, setOpen] = useState(false)
  return (
    <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <ContactLine />
        <button type="button" className={`${LINK} font-mono text-[11px] text-zinc-500 dark:text-zinc-400`} onClick={() => setOpen(true)}>mit</button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="licencia mit" className="max-w-2xl">
          <pre className="mt-4 max-h-[60vh] overflow-auto font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {licenseText}
          </pre>
        </DialogContent>
      </Dialog>
    </footer>
  )
}
