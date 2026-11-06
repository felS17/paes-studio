import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ExamFilters, type FilterState } from '@/components/dashboard/ExamFilters'
import { ExamList } from '@/components/dashboard/ExamList'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { EXAMS } from '@/data/catalog'
import { SUBJECT_ORDER } from '@/data/subjects'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import type { Modality, SubjectId } from '@/types/exam'
import { lastScoreByExam } from '@/utils/analytics'

const MODALITIES: Modality[] = ['regular', 'invierno', 'curado']

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
  const lastScores = useMemo(() => lastScoreByExam(attempts), [attempts])

  const setFilters = (next: FilterState) => {
    const p = new URLSearchParams()
    if (next.subject !== 'todas') p.set('asignatura', next.subject)
    if (next.modality !== 'todas') p.set('modalidad', next.modality)
    if (next.year !== 'todos') p.set('anio', String(next.year))
    setParams(p, { replace: true })
  }

  const visible = EXAMS.filter(
    (e) =>
      (filters.subject === 'todas' || e.subject === filters.subject) &&
      (filters.modality === 'todas' || e.modality === filters.modality) &&
      (filters.year === 'todos' || e.year === filters.year),
  )

  return (
    <div className="space-y-5">
      <PageHeader title="ensayos" />
      <ExamFilters value={filters} onChange={setFilters} />
      {visible.length ? (
        <ExamList exams={visible} lastScores={lastScores} />
      ) : (
        <EmptyState
          title="ningún ensayo con estos filtros"
          action={<Button onClick={() => setFilters({ subject: 'todas', modality: 'todas', year: 'todos' })}>quitar filtros</Button>}
        />
      )}
    </div>
  )
}
