import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useStartPracticeSet } from '@/hooks/usePracticeSet'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useInspectorStore } from '@/store/useInspectorStore'
import type { SubjectId } from '@/types/exam'
import type { Subtopic } from '@/types/temario'
import { latestResults } from '@/utils/analytics'
import { plural } from '@/utils/format'
import { subtopicDrillDraft, subtopicStats, type DrillSize, type SubtopicStat } from '@/utils/subtopics'
import { Accuracy } from './Accuracy'
import { TopicBrowser } from './TopicBrowser'

const SIZES: { value: DrillSize; label: (n: number) => string }[] = [
  { value: 10, label: () => '10' },
  { value: 20, label: () => '20' },
  { value: 'todas', label: (n) => `todas (${n})` },
]

/** Diálogo «Practicar»: se abre desde el resumen del tema, donde no caben los botones de la fila. */
export function DrillDialog({ subtopic, onClose }: { subtopic: Subtopic | null; onClose: () => void }) {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const startPractice = useStartPracticeSet()
  const n = subtopic?.questionCount ?? 0
  const launch = (size: DrillSize) => {
    if (!subtopic) return
    startPractice(subtopicDrillDraft(subtopic.id, size, attempts, latestResults(attempts)))
  }
  return (
    <Dialog open={Boolean(subtopic)} onOpenChange={(open) => !open && onClose()}>
      {subtopic && (
        <DialogContent
          title={`practicar ${subtopic.title}`}
        >
          <div className="mt-5 grid grid-cols-3 gap-2" role="group" aria-label="Cantidad de preguntas">
            {SIZES.map((s) => {
              const disabled = s.value !== 'todas' && s.value >= n
              return (
                <Button
                  key={String(s.value)}
                  variant={s.value === 10 && !disabled ? 'primary' : 'secondary'}
                  size="lg"
                  disabled={disabled}
                  title={disabled ? `Este tema tiene ${plural(n, 'pregunta')}: usa «Todas».` : undefined}
                  onClick={() => launch(s.value)}
                  className="px-2"
                >
                  {s.label(n)}
                </Button>
              )
            })}
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}

function SubtopicRow({ sub, stat, onPractice }: { sub: Subtopic; stat?: SubtopicStat; onPractice: () => void }) {
  const openInspector = useInspectorStore((s) => s.openInspector)
  return (
    <li className="flex min-h-10 items-center gap-2 py-1 pl-6">
      <button
        type="button"
        onClick={() => openInspector({ kind: 'subtopic', id: sub.id })}
        title={`resumen de ${sub.title}`}
        className="min-w-0 flex-1 rounded-sm text-left text-[13.5px] underline-offset-4 hover:underline sm:truncate"
      >
        {sub.title}
      </button>
      <Accuracy stat={stat} />
      <Button size="sm" className="w-[4.75rem] shrink-0" disabled={!sub.questionCount} onClick={onPractice} aria-label={`Practicar ${sub.title}`}>
        practicar
      </Button>
    </li>
  )
}

/**
 * Practicar por tema: una línea por tema. El nombre abre su resumen, donde también se puede elegir cuántas preguntas
 * hacer; `practicar` parte con 10 de inmediato.
 */
export function SubtopicExplorer({ subject, onSubjectChange }: { subject: SubjectId; onSubjectChange: (s: SubjectId) => void }) {
  const attempts = useAnalyticsStore((s) => s.attempts)
  const latest = useMemo(() => latestResults(attempts), [attempts])
  const stats = useMemo(() => subtopicStats(attempts, latest), [attempts, latest])
  const startPractice = useStartPracticeSet()

  return (
    <TopicBrowser
      subject={subject}
      onSubjectChange={onSubjectChange}
      stats={stats}
      renderRow={(sub, stat) => (
        <SubtopicRow
          key={sub.id}
          sub={sub}
          stat={stat}
          onPractice={() => startPractice(subtopicDrillDraft(sub.id, 10, attempts, latest))}
        />
      )}
    />
  )
}
