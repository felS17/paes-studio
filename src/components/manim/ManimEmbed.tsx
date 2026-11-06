import { lazy, Suspense, useState } from 'react'
import { cn } from '@/lib/utils'
import { sceneForSubtopic } from './sceneMap'

// Las escenas viven en su propio chunk: quien no abre una animación no las descarga.
const ManimVisualizer = lazy(() => import('./ManimVisualizer').then((m) => ({ default: m.ManimVisualizer })))

/** Escena del primer subtema que tenga una. Sin escena, no ocupa lugar. */
export function ManimEmbed({ subtopics, defaultOpen = false, syncProgress = null, className }: {
  subtopics: readonly (string | undefined)[]
  defaultOpen?: boolean
  syncProgress?: number | null
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const entry = subtopics.map(sceneForSubtopic).find(Boolean)
  if (!entry) return null
  return (
    <div className={cn('space-y-2', className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="rounded-sm font-mono text-[12px] text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
      >
        {open ? '[ ocultar animación ]' : '[ ▸ ver animación ]'}
      </button>
      {open && (
        <Suspense fallback={<p className="text-[13px] text-zinc-500" role="status">cargando…</p>}>
          <ManimVisualizer scene={entry.scene} initial={entry.initial} syncProgress={syncProgress} />
        </Suspense>
      )}
    </div>
  )
}
