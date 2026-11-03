/** Dominio: mazos de flashcards (Matemática M1/M2, Ciencias e Historia) y su estado de repaso espaciado (SM-2). */

export type DeckId = 'm1' | 'm2' | 'biologia' | 'fisica' | 'quimica' | 'historia'
export type DeckSubject = 'm1' | 'm2' | 'ciencias' | 'historia'
export type Rating = 1 | 2 | 3 | 4 // Otra vez, Difícil, Bien, Fácil

export interface Flashcard {
  id: string
  unit: string
  /** Anverso: pregunta conceptual, fórmula o proceso (Markdown + LaTeX). */
  front: string
  /** Reverso: respuesta concisa (Markdown + LaTeX). */
  back: string
  /** Puntos clave opcionales del reverso. */
  points?: string[]
}

export interface Deck {
  id: DeckId
  title: string
  subject: DeckSubject
  mono: string
  description: string
  units: string[]
  cards: Flashcard[]
}

export type CardPhase = 'learning' | 'review' | 'relearning'

export interface CardState {
  phase: CardPhase
  /** Factor de facilidad SM-2 (≥ 1,3). */
  ease: number
  /** Intervalo actual en días (0 mientras está en aprendizaje). */
  interval: number
  reps: number
  lapses: number
  /** Próxima revisión (epoch ms). */
  due: number
  lastReview: number
}
