import type { Flashcard } from '@/types/flashcards'

/** Atajo para declarar tarjetas: id, unidad, anverso, reverso y puntos clave opcionales. */
export const card = (id: string, unit: string, front: string, back: string, points?: string[]): Flashcard => ({
  id,
  unit,
  front,
  back,
  ...(points ? { points } : {}),
})
