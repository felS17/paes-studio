import type { SubjectId } from '@/types/exam'
import type { Subtopic, SubtopicNote, TemarioIndex, TemarioSubjectEntry } from '@/types/temario'
import { EXAMS } from './catalog'
import { SUBJECT_ORDER } from './subjects'
import temarioIndex from './temario/index.json'

/** Temario DEMRE completo: 5 asignaturas, sus ejes y sus subtemas, incluidos los que ya no están vigentes. */
export const TEMARIO = temarioIndex as unknown as TemarioIndex

/** Año de admisión del temario vigente (lo dicen la interfaz y la etiqueta de los temas que ya no entran). */
export const TEMARIO_YEAR = 2027

/**
 * Temario vigente por asignatura: solo ejes y subtemas del temario DEMRE de la Admisión 2027. Es lo que recorren
 * los temas, el mapa y las estadísticas, así que los subtemas no vigentes no cuentan en el dominio ni en las sugerencias.
 */
export const TEMARIO_BY_SUBJECT: ReadonlyMap<SubjectId, TemarioSubjectEntry> = new Map(
  SUBJECT_ORDER.flatMap((id) => {
    const entry = TEMARIO.subjects.find((s) => s.subject === id)
    if (!entry) return []
    const axes = entry.axes
      .map((axis) => ({ ...axis, subtopics: axis.subtopics.filter((sub) => !sub.retired) }))
      .filter((axis) => axis.subtopics.length > 0)
    return [[id, { ...entry, axes }] as const]
  }),
)

/** Todos los subtemas, vigentes o no (para ubicar cualquier pregunta del banco). */
export const ALL_SUBTOPICS: Subtopic[] = TEMARIO.subjects.flatMap((s) =>
  s.axes.flatMap((axis) => axis.subtopics.map((sub) => ({ ...sub, subject: s.subject, axis: axis.name, pdf: s.pdf }))),
)

/** Subtemas del temario vigente. */
export const SUBTOPICS: Subtopic[] = ALL_SUBTOPICS.filter((s) => !s.retired)

/** Subtemas fuera del temario vigente que todavía tienen preguntas de pruebas anteriores, por asignatura. */
export const RETIRED_BY_SUBJECT: ReadonlyMap<SubjectId, Subtopic[]> = new Map(
  SUBJECT_ORDER.map((id) => [id, ALL_SUBTOPICS.filter((s) => s.subject === id && s.retired && s.questionCount > 0)] as const),
)

export const SUBTOPICS_BY_ID: ReadonlyMap<string, Subtopic> = new Map(ALL_SUBTOPICS.map((s) => [s.id, s]))

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
  { a: 'm1-proporcionalidad', b: 'm1-triangulos', why: 'La semejanza es proporcionalidad entre lados.' },
  { a: 'm1-funcion-afin', b: 'cs-cinematica', why: 'La posición en un MRU es una función afín del tiempo.' },
  { a: 'm1-funcion-afin', b: 'm2-analitica', why: 'Pendiente y coeficiente de posición de una recta.' },
  { a: 'm1-sistemas', b: 'm2-sistemas', why: 'Resolver un sistema y decidir cuántas soluciones tiene.' },
  { a: 'm2-sistemas', b: 'm2-analitica', why: 'Cada ecuación es una recta: paralelas, secantes o coincidentes.' },
  { a: 'm1-porcentajes', b: 'm2-financiera', why: 'Variaciones porcentuales sucesivas e interés.' },
  { a: 'm2-financiera', b: 'hi-macro', why: 'Interés, crédito, ahorro e inflación.' },
  { a: 'm1-porcentajes', b: 'hi-macro', why: 'Inflación y variaciones porcentuales de precios.' },
  { a: 'm2-logaritmos', b: 'm2-exponencial', why: 'El logaritmo es la inversa de la exponencial.' },
  { a: 'm1-cuadratica', b: 'm2-cuadraticas', why: 'Raíces, vértice y discriminante.' },
  { a: 'm1-potencias', b: 'm2-reales', why: 'Propiedades de potencias y raíces.' },
  { a: 'm1-potencias', b: 'cs-atomo', why: 'Notación científica para masas y tamaños atómicos.' },
  { a: 'm1-potencias', b: 'cs-luz', why: 'Frecuencias y longitudes de onda en notación científica.' },
  { a: 'm1-areas', b: 'm2-trigonometria', why: 'Teorema de Pitágoras y razones en el triángulo rectángulo.' },
  { a: 'm1-triangulos', b: 'm2-homotecia', why: 'Semejanza de figuras.' },
  { a: 'm1-transformaciones', b: 'm2-homotecia', why: 'Transformaciones en el plano cartesiano.' },
  { a: 'm1-transformaciones', b: 'cs-dinamica', why: 'Suma de vectores: fuerza neta.' },
  { a: 'm1-areas', b: 'm2-circunferencia', why: 'Círculo, arcos y ángulos en la circunferencia.' },
  { a: 'm1-cuerpos', b: 'm2-esfera', why: 'Áreas y volúmenes de cuerpos geométricos.' },
  { a: 'm2-trigonometria', b: 'm2-funciones-trig', why: 'Seno y coseno: del triángulo a la función periódica.' },
  { a: 'm2-funciones-trig', b: 'cs-luz', why: 'Las ondas se describen con funciones periódicas.' },
  { a: 'm1-tendencia', b: 'cs-habilidades', why: 'Leer tablas y gráficos de un experimento.' },
  { a: 'm1-posicion', b: 'm2-dispersion', why: 'Cuartiles, rango intercuartílico y dispersión.' },
  { a: 'm2-dispersion', b: 'm2-modelos', why: 'Media y desviación estándar en la distribución normal.' },
  { a: 'm1-probabilidad', b: 'm2-condicional', why: 'Probabilidad clásica y condicional.' },
  { a: 'm2-combinatoria', b: 'm2-modelos', why: 'El coeficiente binomial cuenta las ubicaciones de los éxitos.' },
  { a: 'm2-combinatoria', b: 'm1-probabilidad', why: 'Contar casos favorables y posibles.' },
  { a: 'cs-genetica', b: 'cs-reproduccion', why: 'La meiosis forma los gametos que se unen en la fecundación.' },
  { a: 'cs-genetica', b: 'cs-evolucion', why: 'La variabilidad de la meiosis es la materia prima de la selección natural.' },
  { a: 'cs-celula', b: 'cs-nervioso', why: 'La neurona: estructura celular y función.' },
  { a: 'cs-celula', b: 'cs-ecologia', why: 'Cloroplastos y mitocondrias: fotosíntesis y respiración.' },
  { a: 'cs-ecologia', b: 'cs-reacciones', why: 'Fotosíntesis y respiración como reacciones químicas balanceadas.' },
  { a: 'cs-organica', b: 'cs-ecologia', why: 'La glucosa es una molécula orgánica.' },
  { a: 'cs-tierra', b: 'cs-dinamica', why: 'Fuerzas entre placas tectónicas.' },
  { a: 'cs-universo', b: 'cs-dinamica', why: 'La gravedad mantiene a los planetas en órbita.' },
  { a: 'cs-universo', b: 'cs-luz', why: 'Telescopios y corrimiento al rojo de la luz de las galaxias.' },
  { a: 'cs-electricidad', b: 'cs-atomo', why: 'La carga eléctrica viene de protones y electrones.' },
  { a: 'cs-electricidad', b: 'm1-proporcionalidad', why: 'Ley de Ohm: con resistencia fija, voltaje y corriente son proporcionales.' },
  { a: 'cs-habilidades', b: 'hi-fuentes', why: 'Distinguir datos, inferencias y conclusiones.' },
  { a: 'cl-argumentos', b: 'hi-fuentes', why: 'Evaluar la información y la credibilidad de una fuente.' },
  { a: 'cl-postura', b: 'hi-fuentes', why: 'Reconocer la postura del autor de un documento.' },
  { a: 'cl-multimodal', b: 'm1-tendencia', why: 'Leer información en tablas, gráficos e infografías.' },
  { a: 'cl-inferencia', b: 'cs-habilidades', why: 'Inferir a partir de datos y no más allá de ellos.' },
  { a: 'cl-idea-central', b: 'hi-fuentes', why: 'Sintetizar la idea central de un documento.' },
  { a: 'cl-intencion', b: 'hi-informacion', why: 'Reconocer qué busca un mensaje antes de creerlo o compartirlo.' },
  { a: 'hi-cuestion-social', b: 'hi-laborales', why: 'Los derechos laborales nacen de la cuestión social.' },
  { a: 'hi-cuestion-social', b: 'hi-democracia', why: 'Ampliación de derechos sociales y políticos.' },
  { a: 'hi-guerra-fria', b: 'hi-dictadura', why: 'Polarización, Guerra Fría y golpe de 1973.' },
  { a: 'hi-chile-xx', b: 'hi-dictadura', why: 'Del Estado de compromiso al quiebre de la democracia.' },
  { a: 'hi-dictadura', b: 'hi-macro', why: 'El modelo económico neoliberal.' },
  { a: 'hi-dictadura', b: 'hi-justicia', why: 'Derechos humanos y Estado de derecho.' },
  { a: 'hi-guerras', b: 'hi-macro', why: 'La crisis de 1929 y el rol económico del Estado.' },
  { a: 'hi-estado', b: 'hi-democracia', why: 'Instituciones y participación ciudadana.' },
  { a: 'hi-estado', b: 'hi-justicia', why: 'El Poder Judicial en la institucionalidad democrática.' },
  { a: 'hi-democracia', b: 'hi-informacion', why: 'Libertad de expresión y ciudadanía informada.' },
  { a: 'hi-mercado', b: 'hi-macro', why: 'Del mercado a la economía nacional.' },
  { a: 'hi-mercado', b: 'hi-laborales', why: 'El mercado del trabajo y sus reglas.' },
  { a: 'hi-chile-xix', b: 'hi-revoluciones', why: 'Ideas liberales y formación de la República.' },
]
