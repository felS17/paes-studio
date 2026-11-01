import { Segmented } from '@/components/ui/segmented'
import { Select } from '@/components/ui/select'
import { YEARS } from '@/data/catalog'
import { SUBJECTS, SUBJECT_ORDER } from '@/data/subjects'
import type { Modality, SubjectId } from '@/types/exam'

export interface FilterState {
  subject: SubjectId | 'todas'
  modality: Modality | 'todas'
  year: number | 'todos'
}

export function ExamFilters({ value, onChange, resultCount }: {
  value: FilterState
  onChange: (next: FilterState) => void
  resultCount: number
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented<FilterState['subject']>
        label="Asignatura"
        value={value.subject}
        onChange={(subject) => onChange({ ...value, subject })}
        className="max-w-full overflow-x-auto"
        options={[
          { value: 'todas', label: 'Todas' },
          ...SUBJECT_ORDER.map((id) => ({ value: id, label: <span className="whitespace-nowrap">{SUBJECTS[id].short}</span> })),
        ]}
      />
      <Select
        aria-label="Modalidad"
        value={value.modality}
        onChange={(e) => onChange({ ...value, modality: e.target.value as FilterState['modality'] })}
      >
        <option value="todas">Todas las modalidades</option>
        <option value="curado">Curados, con explicaciones</option>
        <option value="regular">PAES Regular</option>
        <option value="invierno">PAES de Invierno</option>
      </Select>
      <Select
        aria-label="Año de admisión"
        value={String(value.year)}
        onChange={(e) => onChange({ ...value, year: e.target.value === 'todos' ? 'todos' : Number(e.target.value) })}
      >
        <option value="todos">Todos los años</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>Admisión {y}</option>
        ))}
      </Select>
      <p className="ml-auto text-xs text-zinc-500 dark:text-zinc-400" aria-live="polite">
        <span className="tabular-nums">{resultCount}</span> {resultCount === 1 ? 'ensayo' : 'ensayos'}
      </p>
    </div>
  )
}
