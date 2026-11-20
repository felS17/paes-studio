import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { DrillDialog } from '@/components/dashboard/SubtopicExplorer'
import { QuestionCard } from '@/components/exam/QuestionCard'
import { Button } from '@/components/ui/button'
import guidesJson from '@/data/guides.json'
import { SUBJECT_TABS } from '@/data/subjects'
import { SUBTOPICS_BY_ID } from '@/data/temario'
import { cn } from '@/lib/utils'
import { useInspectorStore } from '@/store/useInspectorStore'
import type { OptionKey, Question } from '@/types/exam'
import type { SolvedGuide } from '@/types/material'
import type { Subtopic } from '@/types/temario'
import { plural } from '@/utils/format'

const guides = guidesJson as unknown as SolvedGuide[]
const LIST = 'divide-y divide-zinc-200/80 border-y border-zinc-200/80 dark:divide-zinc-800/80 dark:border-zinc-800/80'

/** Cada ejercicio se presenta como una pregunta en modo práctica: se elige, se verifica y aparece la explicación. */
const asQuestion = (g: SolvedGuide, i: number): Question => ({
  id: `guia-${g.id}-e${i + 1}`,
  number: i + 1,
  axis: g.axis,
  topic: g.title,
  subtopic: g.subtopic,
  presentation: 'text',
  textQuality: 'clean',
  ...g.exercises[i],
})

function Exercise({ guide, index }: { guide: SolvedGuide; index: number }) {
  const [selected, setSelected] = useState<OptionKey | undefined>()
  const [revealed, setRevealed] = useState(false)
  return (
    <QuestionCard
      question={asQuestion(guide, index)}
      mode="practica"
      position={index + 1}
      total={guide.exercises.length}
      selected={selected}
      revealed={revealed}
      flagged={false}
      onSelect={(k) => !revealed && setSelected(k)}
      onCheck={() => selected && setRevealed(true)}
      wide
    />
  )
}

function GuideRow({ guide, open, onToggle, onPractice }: { guide: SolvedGuide; open: boolean; onToggle: () => void; onPractice: () => void }) {
  const openInspector = useInspectorStore((s) => s.openInspector)
  return (
    <li id={`guia-${guide.id}`} className="scroll-mt-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-h-11 w-full items-center gap-3 py-1.5 text-left transition-colors hover:bg-zinc-900/[0.02] dark:hover:bg-zinc-100/[0.03]"
      >
        <span className="min-w-0 flex-1 text-[15px] font-medium tracking-tight sm:truncate">{guide.title}</span>
        <span className="shrink-0 font-mono text-[12px] text-zinc-500 tabular-nums dark:text-zinc-400">{plural(guide.exercises.length, 'ejercicio')}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-zinc-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="border-t border-zinc-200/80 bg-canvas px-1 pt-5 pb-8 sm:px-6 dark:border-zinc-800/80">
          <p className="mx-auto max-w-[1040px] text-[13px] text-zinc-500 dark:text-zinc-400" title="Lo que se repite en las pruebas oficiales sobre este tema">
            en las pruebas: {guide.pattern}
          </p>
          <div className="mt-6 space-y-12">
            {guide.exercises.map((_, i) => <Exercise key={i} guide={guide} index={i} />)}
          </div>
          <div className="mx-auto mt-8 flex max-w-[1040px] flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => openInspector({ kind: 'subtopic', id: guide.subtopic })}>resumen</Button>
            {guide.officialCount > 0 && (
              <Button size="sm" onClick={onPractice}>practicar oficiales ({guide.officialCount})</Button>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

/** `guías` → `ejercicios resueltos`: una guía por subtema, agrupadas por materia; cada una se abre en su fila. */
export function SolvedGuides() {
  const [open, setOpen] = useState<string | null>(null)
  const [drill, setDrill] = useState<Subtopic | null>(null)
  const groups = SUBJECT_TABS.map((subject) => [subject, guides.filter((g) => g.subject === subject)] as const).filter(([, list]) => list.length)
  return (
    <div className="space-y-8">
      {groups.map(([subject, list]) => (
        <section key={subject} aria-labelledby={`guias-${subject}`}>
          <h2 id={`guias-${subject}`} className="mb-1.5 text-[19px] font-semibold tracking-tight">{subject}</h2>
          <ul className={LIST}>
            {list.map((g) => (
              <GuideRow
                key={g.id}
                guide={g}
                open={open === g.id}
                onToggle={() => setOpen(open === g.id ? null : g.id)}
                onPractice={() => setDrill(SUBTOPICS_BY_ID.get(g.subtopic) ?? null)}
              />
            ))}
          </ul>
        </section>
      ))}
      <DrillDialog subtopic={drill} onClose={() => setDrill(null)} />
    </div>
  )
}
