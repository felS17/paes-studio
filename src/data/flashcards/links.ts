import { ALL_SUBTOPICS } from '@/data/temario'
import type { DeckId } from '@/types/flashcards'
import type { Subtopic } from '@/types/temario'

export interface CardLink {
  deck: DeckId
  units: string[]
}

const biologia = (unit: string) => ({ deck: 'biologia', unit }) as const
const fisica = (unit: string) => ({ deck: 'fisica', unit }) as const
const quimica = (unit: string) => ({ deck: 'quimica', unit }) as const
const historia = (unit: string) => ({ deck: 'historia', unit }) as const
const lectora = (unit: string) => ({ deck: 'lectora', unit }) as const
const HISTORY = historia('Chile y el mundo (siglos XIX y XX)')

/** Unidad de mazo de cada subtema de Lectora, Ciencias e Historia (también los no vigentes, por sus preguntas antiguas). */
const BY_SUBTOPIC: Record<string, { deck: DeckId; unit: string }> = {
  'cl-localizar': lectora('Localizar'),
  'cl-vocabulario': lectora('Interpretar'),
  'cl-idea-central': lectora('Interpretar'),
  'cl-proposito': lectora('Interpretar'),
  'cl-intencion': lectora('Evaluar'),
  'cl-postura': lectora('Tesis, argumentos y tono'),
  'cl-contextos': lectora('Evaluar'),
  'cl-inferencia': lectora('Inferencias y distractores'),
  'cl-literario': lectora('Tesis, argumentos y tono'),
  'cl-multimodal': lectora('Textos discontinuos'),
  'cl-argumentos': lectora('Tesis, argumentos y tono'),
  'cl-forma': lectora('Evaluar'),
  'cs-celula': biologia('Organización celular'),
  'cs-biomoleculas': biologia('Organización celular'),
  'cs-sistemas': biologia('Procesos y funciones biológicas'),
  'cs-nervioso': biologia('Procesos y funciones biológicas'),
  'cs-reproduccion': biologia('Procesos y funciones biológicas'),
  'cs-poblaciones': biologia('Organismo y ambiente'),
  'cs-genetica': biologia('Herencia y evolución'),
  'cs-evolucion': biologia('Herencia y evolución'),
  'cs-ecologia': biologia('Organismo y ambiente'),
  'cs-ondas': fisica('Ondas'),
  'cs-luz': fisica('Ondas'),
  'cs-cinematica': fisica('Mecánica'),
  'cs-dinamica': fisica('Mecánica'),
  'cs-energia': fisica('Energía'),
  'cs-electricidad': fisica('Electricidad y magnetismo'),
  'cs-tierra': fisica('Tierra y universo'),
  'cs-universo': fisica('Tierra y universo'),
  'cs-atomo': quimica('Estructura atómica'),
  'cs-enlace': quimica('Estructura atómica'),
  'cs-organica': quimica('Química orgánica'),
  'cs-reacciones': quimica('Reacciones químicas y estequiometría'),
  'cs-disoluciones': quimica('Soluciones'),
  'hi-revoluciones': HISTORY,
  'hi-chile-xix': HISTORY,
  'hi-cuestion-social': HISTORY,
  'hi-guerras': HISTORY,
  'hi-guerra-fria': HISTORY,
  'hi-chile-xx': HISTORY,
  'hi-dictadura': HISTORY,
  'hi-estado': historia('Formación ciudadana'),
  'hi-democracia': historia('Formación ciudadana'),
  'hi-informacion': historia('Formación ciudadana'),
  'hi-justicia': historia('Formación ciudadana'),
  'hi-mercado': historia('Sistema económico'),
  'hi-macro': historia('Sistema económico'),
  'hi-laborales': historia('Sistema económico'),
}

function linkOf(sub: Subtopic): { deck: DeckId; unit: string } | undefined {
  // En Matemática, las unidades de los mazos se llaman igual que los ejes del temario.
  if (sub.subject === 'm1' || sub.subject === 'm2') {
    return { deck: sub.subject, unit: sub.axis === 'Habilidades transversales' ? 'Suficiencia de datos' : sub.axis }
  }
  return BY_SUBTOPIC[sub.id]
}

/** Mazos y unidades con las tarjetas de un conjunto de subtemas (un subtema, un eje o una asignatura). */
export function cardLinksFor(subtopicIds: string[]): CardLink[] {
  const wanted = new Set(subtopicIds)
  const decks = new Map<DeckId, Set<string>>()
  for (const sub of ALL_SUBTOPICS) {
    if (!wanted.has(sub.id)) continue
    const link = linkOf(sub)
    if (!link) continue
    const units = decks.get(link.deck) ?? new Set<string>()
    units.add(link.unit)
    decks.set(link.deck, units)
  }
  return [...decks].map(([deck, units]) => ({ deck, units: [...units] }))
}
