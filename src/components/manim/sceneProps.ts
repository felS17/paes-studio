export interface SceneProps {
  /** Avance de la escena, de 0 a 1. */
  t: number
  v: Record<string, string | number>
}
