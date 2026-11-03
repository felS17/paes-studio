import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ExamFilters, type FilterState } from '@/components/dashboard/ExamFilters'
import { ExamList } from '@/components/dashboard/ExamList'
import { ProjectionChart } from '@/components/dashboard/ProjectionChart'
import { SubtopicExplorer } from '@/components/dashboard/SubtopicExplorer'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs } from '@/components/ui/tabs'
import { EXAMS } from '@/data/catalog'
import { SUBJECT_ORDER } from '@/data/subjects'
import { SUBTOPICS } from '@/data/temario'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import type { Modality, SubjectId } from '@/types/exam'
import { bestScoreByExam } from '@/utils/analytics'

const MODALITIES: Modality[] = ['regular', 'invierno', 'curado']
type View = 'ensayos' | 'subtemas'

function readFilters(params: URLSearchParams): FilterState {
  const subject = params.get('asignatura')
  const modality = params.get('modalidad')
  const year = Number(params.get('anio'))
  return {
    subject: SUBJECT_ORDER.includes(subject as SubjectId) ? (subject as SubjectId) : 'todas',
    modality: MODALITIES.includes(modality as Modality) ? (modality as Modality) : 'todas',
    year: Number.isFinite(year) && year > 2000 ? year : 'todos',
  }
}

export function DashboardPage() {
  const [params, setParams] = useSearchParams()
  const filters = readFilters(params)
  const attempts = useAnalyticsStore((s) => s.attempts)
  const best = useMemo(() => bestScoreByExam(attempts), [attempts])

  const view: View = params.get('vista') === 'subtemas' ? 'subtemas' : 'ensayos'
  const materia = params.get('materia')
  const explorerSubject: SubjectId = SUBJECT_ORDER.includes(materia as SubjectId)
    ? (materia as SubjectId)
    : filters.subject !== 'todas' ? filters.subject : 'm1'

  const setView = (next: View) => {
    const p = new URLSearchParams(params)
    if (next === 'subtemas') p.set('vista', 'subtemas')
    else p.delete('vista')
    setParams(p, { replace: true })
  }
  const setExplorerSubject = (subject: SubjectId) => {
    const p = new URLSearchParams(params)
    p.set('materia', subject)
    setParams(p, { replace: true })
  }

  const setFilters = (next: FilterState) => {
    const p = new URLSearchParams()
    if (next.subject !== 'todas') p.set('asignatura', next.subject)
    if (next.modality !== 'todas') p.set('modalidad', next.modality)
    if (next.year !== 'todos') p.set('anio', String(next.year))
    if (materia) p.set('materia', materia)
    setParams(p, { replace: true })
  }

  const visible = EXAMS.filter(
    (e) =>
      (filters.subject === 'todas' || e.subject === filters.subject) &&
      (filters.modality === 'todas' || e.modality === filters.modality) &&
      (filters.year === 'todos' || e.year === filters.year),
  )
  const totalQuestions = EXAMS.reduce((n, e) => n + e.questionCount, 0)

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ensayos"
        description={
          <>
            <span className="tabular-nums">{EXAMS.length}</span> ensayos y{' '}
            <span className="tabular-nums">{totalQuestions.toLocaleString('es-CL')}</span> preguntas: folletos
            oficiales del DEMRE corregidos con su clavijero y ensayos curados con desarrollo paso a paso, también
            ordenadas por los {SUBTOPICS.length} subtemas del temario.
          </>
        }
      />
      <ProjectionChart attempts={attempts} />
      <div id="lista-ensayos" tabIndex={-1} className="scroll-mt-20 outline-none">
        <Tabs
          label="Cómo explorar el banco de preguntas"
          value={view}
          onChange={setView}
          items={[
            { value: 'ensayos', label: 'Ensayos oficiales y curados', count: EXAMS.length },
            { value: 'subtemas', label: 'Explorar por subtemas', count: SUBTOPICS.length },
          ]}
        >
          {view === 'ensayos' ? (
            <div className="space-y-4">
              <ExamFilters value={filters} onChange={setFilters} resultCount={visible.length} />
              {visible.length ? (
                <ExamList exams={visible} bestScores={best} />
              ) : (
                <EmptyState
                  title="Ningún ensayo coincide con estos filtros"
                  action={<Button onClick={() => setFilters({ subject: 'todas', modality: 'todas', year: 'todos' })}>Quitar filtros</Button>}
                >
                  Prueba con otro año o modalidad. Los ensayos curados no tienen modalidad oficial.
                </EmptyState>
              )}
            </div>
          ) : (
            <SubtopicExplorer subject={explorerSubject} onSubjectChange={setExplorerSubject} />
          )}
        </Tabs>
      </div>
    </div>
  )
}
