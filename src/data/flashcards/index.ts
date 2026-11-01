import type { Deck, DeckId } from '@/types/flashcards'

/** Metadatos de los mazos (el contenido completo se carga bajo demanda). */
export const DECKS: { id: DeckId; title: string; mono: string; subject: 'ciencias' | 'historia'; description: string }[] = [
  { id: 'biologia', title: 'Ciencias: Biología', mono: 'BI', subject: 'ciencias', description: 'Célula, procesos y funciones, herencia y evolución, organismo y ambiente.' },
  { id: 'fisica', title: 'Ciencias: Física', mono: 'FI', subject: 'ciencias', description: 'Ondas, mecánica, energía, electricidad y magnetismo.' },
  { id: 'quimica', title: 'Ciencias: Química', mono: 'QU', subject: 'ciencias', description: 'Estructura atómica, química orgánica, reacciones y estequiometría, soluciones.' },
  { id: 'historia', title: 'Historia y Ciencias Sociales', mono: 'HI', subject: 'historia', description: 'Chile y el mundo en los siglos XIX y XX, formación ciudadana y sistema económico.' },
]

const loaders: Record<DeckId, () => Promise<Deck>> = {
  biologia: () => import('./biologia').then((m) => m.biologia),
  fisica: () => import('./fisica').then((m) => m.fisica),
  quimica: () => import('./quimica').then((m) => m.quimica),
  historia: () => import('./historia').then((m) => m.historia),
}

export const isDeckId = (id: string | undefined): id is DeckId => Boolean(id && id in loaders)
export const loadDeck = (id: DeckId) => loaders[id]()
