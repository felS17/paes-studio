import { useSearchParams } from 'react-router-dom'
import { SubtopicExplorer } from '@/components/dashboard/SubtopicExplorer'
import { PageHeader } from '@/components/layout/AppShell'
import { SUBJECT_ORDER } from '@/data/subjects'
import { SUBTOPICS } from '@/data/temario'
import type { SubjectId } from '@/types/exam'

/** Explorador del temario DEMRE como vista propia (`/subtemas?materia=m2`). */
export function SubtopicsPage() {
  const [params, setParams] = useSearchParams()
  const materia = params.get('materia')
  const subject: SubjectId = SUBJECT_ORDER.includes(materia as SubjectId) ? (materia as SubjectId) : 'm1'
  return (
    <div className="space-y-8">
      <PageHeader
        title="Subtemas"
        description={
          <>
            Los <span className="tabular-nums">{SUBTOPICS.length}</span> subtemas del temario DEMRE, ordenados por asignatura y eje.
            Practica cualquiera con 10, 20 o todas sus preguntas, reunidas de todos los ensayos, o ábrelo en su compendio PDF.
          </>
        }
      />
      <SubtopicExplorer subject={subject} onSubjectChange={(s) => setParams({ materia: s }, { replace: true })} />
    </div>
  )
}
