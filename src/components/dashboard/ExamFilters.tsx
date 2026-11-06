import { Segmented } from '@/components/ui/segmented'
import { Select } from '@/components/ui/select'
import { YEARS } from '@/data/catalog'
import { SUBJECT_TABS } from '@/data/subjects'
import type { Modality, SubjectId } from '@/types/exam'

export interface FilterState {
  subject: SubjectId | 'todas'
  modality: Modality | 'todas'
  year: number | 'todos'
}

export function ExamFilters({ value, onChange }: { value: FilterState; onChange: (next: FilterState) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented<FilterState['subject']>
        label="Materia"
        value={value.subject}
        onChange={(subject) => onChange({ ...value, subject })}
        className="max-w-full overflow-x-auto"
        options={[{ value: 'todas', label: 'todas' }, ...SUBJECT_TABS.map((id) => ({ value: id, label: id }))]}
      />
      <Select
        aria-label="Modalidad"
        value={value.modality}
        onChange={(e) => onChange({ ...value, modality: e.target.value as FilterState['modality'] })}
      >
        <option value="todas">todas</option>
        <option value="curado">curados</option>
        <option value="regular">regular</option>
        <option value="invierno">invierno</option>
      </Select>
      <Select
        aria-label="Año en que se rindió"
        value={String(value.year)}
        onChange={(e) => onChange({ ...value, year: e.target.value === 'todos' ? 'todos' : Number(e.target.value) })}
      >
        <option value="todos">todos los años</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </Select>
    </div>
  )
}
