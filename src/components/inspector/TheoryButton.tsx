import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SUBTOPIC_OF_QUESTION, SUBTOPICS_BY_ID } from '@/data/temario'
import { useInspectorStore } from '@/store/useInspectorStore'
import type { Question, SubjectId } from '@/types/exam'
import { subjectOfQuestion } from '@/utils/analytics'

/** «Consultar teoría del subtema»: abre el Inspector junto a la pregunta, sin salir del ensayo. */
export function TheoryButton({ question, fallbackSubject = 'm1' }: { question: Question; fallbackSubject?: SubjectId }) {
  const open = useInspectorStore((s) => s.openInspector)
  const id = question.subtopic ?? SUBTOPIC_OF_QUESTION.get(question.id)
  const sub = id ? SUBTOPICS_BY_ID.get(id) : undefined
  return (
    <Button
      variant="ghost"
      size="sm"
      title={sub ? `Abrir «${sub.title}» en el Inspector` : 'Abrir la asignatura en el Inspector'}
      onClick={() => open(sub ? { kind: 'subtopic', id: sub.id } : { kind: 'subject', subject: subjectOfQuestion(question.id, fallbackSubject), axis: question.axis })}
    >
      <BookOpen className="size-3.5" />
      {sub ? 'Consultar teoría del subtema' : 'Consultar teoría de la asignatura'}
    </Button>
  )
}
