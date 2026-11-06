import { useSearchParams } from 'react-router-dom'
import { SubtopicExplorer } from '@/components/dashboard/SubtopicExplorer'
import { PageHeader } from '@/components/layout/AppShell'
import { SUBJECT_TABS } from '@/data/subjects'
import type { SubjectId } from '@/types/exam'

/** Explorador del temario DEMRE como vista propia (`/subtemas?materia=m2`). */
export function SubtopicsPage() {
  const [params, setParams] = useSearchParams()
  const materia = params.get('materia')
  const subject: SubjectId = SUBJECT_TABS.includes(materia as SubjectId) ? (materia as SubjectId) : SUBJECT_TABS[0]
  return (
    <div className="space-y-5">
      <PageHeader title="temas" />
      <SubtopicExplorer subject={subject} onSubjectChange={(s) => setParams({ materia: s }, { replace: true })} />
    </div>
  )
}
