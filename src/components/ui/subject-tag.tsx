import { SUBJECTS, subjectLabel } from '@/data/subjects'
import { cn } from '@/lib/utils'
import type { ScienceArea, SubjectId } from '@/types/exam'

/** Etiqueta neutra (zinc) para asignaturas, ejes y metadatos: sin color ni ícono por asignatura. */
export const TAG_CLASS =
  'inline-flex items-center rounded-md border border-zinc-200/80 bg-zinc-100 px-1.5 py-0.5 text-[11.5px] font-medium leading-4 whitespace-nowrap text-zinc-800 dark:border-zinc-700/80 dark:bg-zinc-800/80 dark:text-zinc-200'

export function Tag({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn(TAG_CLASS, className)} {...props} />
}

/** Nombre de la asignatura (o del área de Ciencias) como etiqueta tipográfica. */
export function SubjectTag({ subject, area, label, className }: {
  subject: SubjectId
  area?: ScienceArea | null
  label?: string
  className?: string
}) {
  return <Tag className={className}>{label ?? (area ? subjectLabel(subject, area) : SUBJECTS[subject].short)}</Tag>
}
