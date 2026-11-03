import type { SubjectId } from '@/types/exam'
import type { Subtopic, SubtopicNote, TemarioIndex, TemarioSubjectEntry } from '@/types/temario'
import { EXAMS } from './catalog'
import { SUBJECT_ORDER } from './subjects'
import temarioIndex from './temario/index.json'

/** Temario DEMRE: 5 asignaturas, sus ejes y los 67 subtemas (liviano; las notas se cargan aparte). */
export const TEMARIO = temarioIndex as unknown as TemarioIndex

export const TEMARIO_BY_SUBJECT: ReadonlyMap<SubjectId, TemarioSubjectEntry> = new Map(
  SUBJECT_ORDER.flatMap((id) => {
    const entry = TEMARIO.subjects.find((s) => s.subject === id)
    return entry ? [[id, entry] as const] : []
  }),
)

export const SUBTOPICS: Subtopic[] = TEMARIO.subjects.flatMap((s) =>
  s.axes.flatMap((axis) => axis.subtopics.map((sub) => ({ ...sub, subject: s.subject, axis: axis.name, pdf: s.pdf }))),
)

export const SUBTOPICS_BY_ID: ReadonlyMap<string, Subtopic> = new Map(SUBTOPICS.map((s) => [s.id, s]))

const pad = (n: number) => n.toString().padStart(2, '0')

/** Subtema de cada pregunta del banco (id global → id de subtema), a partir del índice del catálogo. */
export const SUBTOPIC_OF_QUESTION: ReadonlyMap<string, string> = new Map(
  EXAMS.flatMap((meta) =>
    Object.entries(meta.subtopicQuestions ?? {}).flatMap(([sub, numbers]) =>
      numbers.map((n) => [`${meta.id}-q${pad(n)}`, sub] as const),
    ),
  ),
)

/** Preguntas del banco por subtema (ids globales), en el orden del catálogo. */
export const QUESTIONS_BY_SUBTOPIC: ReadonlyMap<string, string[]> = (() => {
  const map = new Map<string, string[]>()
  for (const [qid, sub] of SUBTOPIC_OF_QUESTION) {
    const list = map.get(sub)
    if (list) list.push(qid)
    else map.set(sub, [qid])
  }
  return map
})()

/** Preguntas con solución paso a paso (ids globales). */
export const EXPLAINED_QUESTIONS: ReadonlySet<string> = new Set(
  EXAMS.flatMap((meta) => (meta.explainedQuestions ?? []).map((n) => `${meta.id}-q${pad(n)}`)),
)

/** Enlace al compendio PDF abierto en la página del subtema (los visores del navegador respetan `#page=`). */
export const subtopicPdfHref = (sub: Subtopic) => (sub.pdfPage ? `${sub.pdf}#page=${sub.pdfPage}` : sub.pdf)

let notes: Promise<Record<string, SubtopicNote>> | null = null

/** Teoría, recuadro, ideas clave, método y trampas de cada subtema (chunk JSON aparte, ~90 kB). */
export function loadSubtopicNotes(): Promise<Record<string, SubtopicNote>> {
  notes ??= import('./temario/notes.json').then((m) => m.default as unknown as Record<string, SubtopicNote>)
  notes.catch(() => {
    notes = null
  })
  return notes
}

/**
 * Enlaces cruzados del Zettelkasten: subtemas que comparten una herramienta o idea aunque estén en otra
 * asignatura. Cada par lleva el concepto que los une (se muestra en el panel del nodo).
 */
export const CROSS_LINKS: { a: string; b: string; why: string }[] = [
  { a: 'm1-proporcionalidad', b: 'cs-reacciones', why: 'La estequiometría es proporcionalidad directa entre moles.' },
  { a: 'm1-proporcionalidad', b: 'cs-disoluciones', why: 'Concentración y dilución: razones y regla de tres.' },
  { a: 'm1-proporcionalidad', b: 'cs-cinematica', why: 'A rapidez constante, distancia y tiempo son proporcionales.' },
  { a: 'm1-funcion-afin', b: 'cs-cinematica', why: 'La posición en un MRU es una función afín del tiempo.' },
  { a: 'm1-funcion-afin', b: 'm2-analitica', why: 'Pendiente y coeficiente de posición de una recta.' },
  { a: 'm1-porcentajes', b: 'm2-financiera', why: 'Variaciones porcentuales sucesivas e interés.' },
  { a: 'm2-financiera', b: 'hi-macro', why: 'Interés, crédito, ahorro e inflación.' },
  { a: 'm1-porcentajes', b: 'hi-macro', why: 'Inflación y variaciones porcentuales de precios.' },
  { a: 'm2-exponencial', b: 'cs-ecologia', why: 'Crecimiento exponencial de poblaciones.' },
  { a: 'm2-logaritmos', b: 'cs-disoluciones', why: 'El pH es un logaritmo: pH = −log[H⁺].' },
  { a: 'm2-logaritmos', b: 'cs-ondas', why: 'El nivel de intensidad sonora en decibeles es logarítmico.' },
  { a: 'm2-logaritmos', b: 'm2-exponencial', why: 'El logaritmo es la inversa de la exponencial.' },
  { a: 'm2-inversa', b: 'm2-exponencial', why: 'Función inversa y composición.' },
  { a: 'm1-cuadratica', b: 'm2-cuadraticas', why: 'Raíces, vértice y discriminante.' },
  { a: 'm1-potencias', b: 'm2-reales', why: 'Propiedades de potencias y raíces.' },
  { a: 'm1-potencias', b: 'cs-atomo', why: 'Notación científica para masas y tamaños atómicos.' },
  { a: 'm1-triangulos', b: 'm2-trigonometria', why: 'Teorema de Pitágoras y razones en el triángulo rectángulo.' },
  { a: 'm1-triangulos', b: 'm2-homotecia', why: 'Semejanza de triángulos.' },
  { a: 'm1-transformaciones', b: 'm2-homotecia', why: 'Transformaciones en el plano cartesiano.' },
  { a: 'm1-transformaciones', b: 'cs-dinamica', why: 'Suma de vectores: fuerza neta.' },
  { a: 'm1-tendencia', b: 'cs-habilidades', why: 'Leer tablas y gráficos de un experimento.' },
  { a: 'm1-tendencia', b: 'm2-dispersion', why: 'Media, mediana y dispersión de datos.' },
  { a: 'm1-probabilidad', b: 'm2-condicional', why: 'Probabilidad clásica y condicional.' },
  { a: 'm1-probabilidad', b: 'cs-genetica', why: 'Probabilidades en cruzamientos mendelianos.' },
  { a: 'm2-combinatoria', b: 'm1-probabilidad', why: 'Contar casos favorables y posibles.' },
  { a: 'm1-areas', b: 'cs-dinamica', why: 'Presión = fuerza / área; densidad = masa / volumen.' },
  { a: 'cs-energia', b: 'cs-biomoleculas', why: 'Transformaciones de energía en el metabolismo.' },
  { a: 'cs-biomoleculas', b: 'cs-organica', why: 'Grupos funcionales de las biomoléculas.' },
  { a: 'cs-enlace', b: 'cs-biomoleculas', why: 'Puentes de hidrógeno en proteínas y ADN.' },
  { a: 'cs-ondas', b: 'cs-luz', why: 'La luz es una onda electromagnética.' },
  { a: 'cs-electricidad', b: 'cs-atomo', why: 'La carga eléctrica viene de protones y electrones.' },
  { a: 'cs-ecologia', b: 'hi-geografia', why: 'Recursos naturales, ambiente y sustentabilidad.' },
  { a: 'cs-habilidades', b: 'hi-fuentes', why: 'Distinguir datos, inferencias y conclusiones.' },
  { a: 'cl-argumentos', b: 'hi-fuentes', why: 'Evaluar la postura y el propósito de un emisor.' },
  { a: 'cl-multimodal', b: 'm1-tendencia', why: 'Leer información en tablas, gráficos e infografías.' },
  { a: 'cl-inferencia', b: 'cs-habilidades', why: 'Inferir a partir de datos y no más allá de ellos.' },
  { a: 'cl-idea-central', b: 'hi-fuentes', why: 'Sintetizar la idea central de un documento.' },
  { a: 'hi-cuestion-social', b: 'hi-democracia', why: 'Ampliación de derechos sociales y políticos.' },
  { a: 'hi-guerra-fria', b: 'hi-chile-xx', why: 'Polarización, Unidad Popular y golpe de 1973.' },
  { a: 'hi-guerras', b: 'hi-macro', why: 'La crisis de 1929 y el rol económico del Estado.' },
  { a: 'hi-estado', b: 'hi-democracia', why: 'Instituciones y participación ciudadana.' },
  { a: 'hi-mercado', b: 'hi-macro', why: 'Del mercado a la economía nacional.' },
  { a: 'hi-chile-xix', b: 'hi-revoluciones', why: 'Ideas liberales e independencias americanas.' },
]
