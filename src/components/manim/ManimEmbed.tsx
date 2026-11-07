import { lazy, Suspense, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { Question } from '@/types/exam'
import type { VoiceSync } from './ManimVisualizer'
import { sceneForQuestion, sceneForSubtopic } from './sceneMap'

// Las escenas viven en su propio chunk: quien no abre una animación no las descarga.
const ManimVisualizer = lazy(() => import('./ManimVisualizer').then((m) => ({ default: m.ManimVisualizer })))

/**
 * Escena de una pregunta (`question`, solo oficiales de 2024 a 2026 con solución) o del primer subtema que tenga una
 * (`subtopics`, en el resumen y el formulario). Sin escena, no ocupa lugar.
 */
export function ManimEmbed({ question, subtopics, defaultOpen = false, sync, className }: {
  question?: Question
  subtopics?: readonly (string | undefined)[]
  defaultOpen?: boolean
  sync?: VoiceSync
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const entry = useMemo(
    () => (question ? sceneForQuestion(question) : subtopics?.map(sceneForSubtopic).find(Boolean) ?? null),
    [question, subtopics],
  )
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
          <ManimVisualizer scene={entry.scene} initial={entry.initial} fromQuestion={question ? entry.fromQuestion : undefined} sync={sync} />
        </Suspense>
      )}
    </div>
  )
}
