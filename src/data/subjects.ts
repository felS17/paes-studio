import type { Modality, ScienceArea, SubjectId } from '@/types/exam'

export interface SubjectInfo {
  id: SubjectId
  name: string
  short: string
  /** Monograma de dos letras usado como identificador visual. */
  mono: string
  officialMinutes: number
  officialQuestions: number
  axes: string[]
}

export const SUBJECTS: Record<SubjectId, SubjectInfo> = {
  m1: {
    id: 'm1',
    name: 'Competencia Matemática 1',
    short: 'Matemática M1',
    mono: 'M1',
    officialMinutes: 140,
    officialQuestions: 65,
    axes: ['Números', 'Álgebra y funciones', 'Geometría', 'Probabilidad y estadística'],
  },
  m2: {
    id: 'm2',
    name: 'Competencia Matemática 2',
    short: 'Matemática M2',
    mono: 'M2',
    officialMinutes: 140,
    officialQuestions: 55,
    axes: ['Números', 'Álgebra y funciones', 'Geometría', 'Probabilidad y estadística'],
  },
  lectora: {
    id: 'lectora',
    name: 'Competencia Lectora',
    short: 'Lectora',
    mono: 'CL',
    officialMinutes: 150,
    officialQuestions: 65,
    axes: ['Localizar', 'Interpretar', 'Evaluar'],
  },
  ciencias: {
    id: 'ciencias',
    name: 'Ciencias',
    short: 'Ciencias',
    mono: 'CS',
    officialMinutes: 160,
    officialQuestions: 80,
    axes: ['Biología', 'Física', 'Química'],
  },
  historia: {
    id: 'historia',
    name: 'Historia y Ciencias Sociales',
    short: 'Historia',
    mono: 'HI',
    officialMinutes: 120,
    officialQuestions: 65,
    axes: [
      'Historia: mundo, América y Chile',
      'Formación ciudadana',
      'Sistema económico',
      'Geografía y espacio',
    ],
  },
}

export const SUBJECT_ORDER: SubjectId[] = ['m1', 'm2', 'lectora', 'ciencias', 'historia']

export const AREA_LABEL: Record<ScienceArea, string> = {
  biologia: 'Biología',
  fisica: 'Física',
  quimica: 'Química',
  tp: 'Técnico Profesional',
}

export const MODALITY_LABEL: Record<Modality, string> = {
  regular: 'Regular',
  invierno: 'Invierno',
  curado: 'Curado',
  personalizado: 'Práctica personalizada',
}

export function subjectLabel(subject: SubjectId, area?: ScienceArea): string {
  const base = SUBJECTS[subject].short
  return area ? `${base}: ${AREA_LABEL[area]}` : base
}
