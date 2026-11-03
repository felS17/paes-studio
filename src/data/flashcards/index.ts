import type { Deck, DeckId, DeckSubject } from '@/types/flashcards'

/** Metadatos de los mazos (el contenido completo se carga bajo demanda). */
/** `cards`: tarjetas del mazo (se mantiene a mano para mostrar totales sin descargar los mazos). */
export const DECKS: { id: DeckId; title: string; mono: string; subject: DeckSubject; cards: number; description: string }[] = [
  { id: 'm1', title: 'Matemática M1', mono: 'M1', subject: 'm1', cards: 63, description: 'Potencias y raíces, productos notables, sistemas, funciones afín y cuadrática, Pitágoras y Thales, vectores, posición y probabilidad.' },
  { id: 'm2', title: 'Matemática M2', mono: 'M2', subject: 'm2', cards: 51, description: 'Logaritmos, interés compuesto, exponencial e inversa, trigonometría, homotecia, dispersión, combinatoria, binomial y suficiencia de datos.' },
  { id: 'biologia', title: 'Ciencias: Biología', mono: 'BI', subject: 'ciencias', cards: 35, description: 'Célula, procesos y funciones, herencia y evolución, organismo y ambiente.' },
  { id: 'fisica', title: 'Ciencias: Física', mono: 'FI', subject: 'ciencias', cards: 35, description: 'Ondas, mecánica, energía, electricidad y magnetismo.' },
  { id: 'quimica', title: 'Ciencias: Química', mono: 'QU', subject: 'ciencias', cards: 35, description: 'Estructura atómica, química orgánica, reacciones y estequiometría, soluciones.' },
  { id: 'historia', title: 'Historia y Ciencias Sociales', mono: 'HI', subject: 'historia', cards: 36, description: 'Chile y el mundo en los siglos XIX y XX, formación ciudadana y sistema económico.' },
]

const loaders: Record<DeckId, () => Promise<Deck>> = {
  m1: () => import('./m1').then((m) => m.m1),
  m2: () => import('./m2').then((m) => m.m2),
  biologia: () => import('./biologia').then((m) => m.biologia),
  fisica: () => import('./fisica').then((m) => m.fisica),
  quimica: () => import('./quimica').then((m) => m.quimica),
  historia: () => import('./historia').then((m) => m.historia),
}

export const isDeckId = (id: string | undefined): id is DeckId => Boolean(id && id in loaders)
export const loadDeck = (id: DeckId) => loaders[id]()

/** Total de tarjetas de todos los mazos. */
export const TOTAL_CARDS = DECKS.reduce((n, d) => n + d.cards, 0)
