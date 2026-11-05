import { BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SUBTOPIC_OF_QUESTION, SUBTOPICS_BY_ID } from '@/data/temario'
import { useInspectorStore } from '@/store/useInspectorStore'
import type { Question, SubjectId } from '@/types/exam'
import { subjectOfQuestion } from '@/utils/analytics'

/** «Ver resumen de este tema»: abre el Inspector junto a la pregunta, sin salir del ensayo. */
export function TheoryButton({ question, fallbackSubject = 'm1' }: { question: Question; fallbackSubject?: SubjectId }) {
  const open = useInspectorStore((s) => s.openInspector)
  const id = question.subtopic ?? SUBTOPIC_OF_QUESTION.get(question.id)
  const sub = id ? SUBTOPICS_BY_ID.get(id) : undefined
  return (
    <Button
      variant="ghost"
      size="sm"
      title={sub ? `Abrir el resumen de «${sub.title}» junto a la pregunta` : 'Abrir el resumen de la materia junto a la pregunta'}
      onClick={() => open(sub ? { kind: 'subtopic', id: sub.id } : { kind: 'subject', subject: subjectOfQuestion(question.id, fallbackSubject), axis: question.axis })}
    >
      <BookOpen className="size-3.5" />
      {sub ? 'Ver resumen de este tema' : 'Ver resumen de esta materia'}
    </Button>
  )
}
