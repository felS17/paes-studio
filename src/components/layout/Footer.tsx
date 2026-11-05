import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import licenseText from '../../../LICENSE?raw'

const LINK =
  'rounded underline-offset-4 transition-colors hover:text-zinc-900 hover:underline dark:hover:text-zinc-100'

/** Pie de página: autoría, licencia y contacto. */
export function Footer() {
  const [open, setOpen] = useState(false)
  return (
    <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-3 px-4 py-6 text-[12.5px] text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10 dark:text-zinc-400">
        <p>© 2026 · Desarrollado por felS</p>
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <li>
            <button type="button" className={`${LINK} text-[11px]`} onClick={() => setOpen(true)}>Código abierto (MIT)</button>
          </li>
          <li>
            <a className={LINK} href="mailto:felipe.schneeberger@estudiante.uc.cl">felipe.schneeberger@estudiante.uc.cl</a>
          </li>
          <li>
            <a className={LINK} href="https://github.com/felS17" target="_blank" rel="noopener noreferrer" aria-label="GitHub de felS (@felS17)">
              <span className="font-mono">@felS17</span>
            </a>
          </li>
        </ul>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="MIT License" description="Licencia del código de PAES Studio." className="max-w-2xl">
          <pre className="mt-4 max-h-[60vh] overflow-auto font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {licenseText}
          </pre>
        </DialogContent>
      </Dialog>
    </footer>
  )
}
