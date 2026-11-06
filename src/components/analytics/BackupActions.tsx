import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Segmented } from '@/components/ui/segmented'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import type { AttemptRecord } from '@/types/analytics'
import { plural } from '@/utils/format'
import { buildBackup, parseBackup } from '@/utils/validators'

type Pending = { attempts: AttemptRecord[]; skipped: number; fileName: string }

/** Pestaña `sistema`: exportar e importar el progreso (JSON) con dos botones directos. */
export function BackupActions() {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const importAttempts = useAnalyticsStore((s) => s.importAttempts)
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Pending | null>(null)
  const [strategy, setStrategy] = useState<'merge' | 'replace'>('merge')
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(buildBackup(attempts), null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `paes-studio-respaldo-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage({ tone: 'ok', text: `listo: exportaste ${plural(attempts.length, 'intento')}.` })
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    const result = parseBackup(await file.text())
    if (fileRef.current) fileRef.current.value = ''
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.error })
      return
    }
    setStrategy('merge')
    setPending({ attempts: result.attempts, skipped: result.skipped, fileName: file.name })
  }

  const confirmImport = () => {
    if (!pending) return
    const added = importAttempts(pending.attempts, strategy)
    setMessage({
      tone: 'ok',
      text: strategy === 'replace' ? `Listo: ahora tienes ${plural(added, 'intento')}.` : `Listo: sumamos ${plural(added, 'intento nuevo', 'intentos nuevos')}.`,
    })
    setPending(null)
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        <Button onClick={exportBackup} disabled={!attempts.length}>exportar datos</Button>
        <Button onClick={() => fileRef.current?.click()}>importar datos</Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label="Archivo de respaldo" />
      </div>
      {message && (
        <p role="status" className={message.tone === 'ok' ? 'text-xs text-zinc-600 dark:text-zinc-400' : 'text-xs font-medium text-zinc-900 dark:text-zinc-100'}>
          {message.text}
        </p>
      )}
      <Dialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent
          title="importar datos"
          description={pending ? `${pending.fileName} contiene ${plural(pending.attempts.length, 'intento válido', 'intentos válidos')}${pending.skipped ? ` (${pending.skipped} no se pudieron leer)` : ''}.` : undefined}
        >
          <div className="mt-4 space-y-2">
            <Segmented
              label="Cómo importar"
              value={strategy}
              onChange={setStrategy}
              options={[
                { value: 'merge', label: 'sumar' },
                { value: 'replace', label: 'reemplazar' },
              ]}
            />
            <p className="text-[12.5px] text-zinc-500 dark:text-zinc-400">
              {strategy === 'merge'
                ? 'Se agregan los intentos que no tengas; los repetidos se ignoran.'
                : `Se borran tus ${plural(attempts.length, 'intento')} actuales y se dejan solo los del archivo.`}
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button onClick={() => setPending(null)}>cancelar</Button>
            <Button variant="primary" onClick={confirmImport}>importar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
