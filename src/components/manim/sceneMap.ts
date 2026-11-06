export type SceneId = 'homotecia' | 'cuadratica' | 'thales' | 'trigonometria' | 'vectores' | 'fisica'

export interface SceneEntry {
  scene: SceneId
  /** Valores con que parte la escena: un mismo tema puede abrir en una u otra modalidad. */
  initial?: Record<string, string>
}

const BY_SUBTOPIC: Record<string, SceneEntry> = {
  'm2-homotecia': { scene: 'homotecia' },
  'm1-cuadratica': { scene: 'cuadratica' },
  'm2-cuadraticas': { scene: 'cuadratica' },
  'm1-triangulos': { scene: 'thales', initial: { modo: 'pitagoras' } },
  'm2-trigonometria': { scene: 'trigonometria' },
  'm1-transformaciones': { scene: 'vectores' },
  'cs-cinematica': { scene: 'fisica', initial: { modo: 'cinematica' } },
  'cs-ondas': { scene: 'fisica', initial: { modo: 'ondas' } },
}

/** La escena de un subtema, o null si no tiene. Vive aparte de las escenas para no cargarlas si no se usan. */
export const sceneForSubtopic = (id: string | null | undefined): SceneEntry | null => (id ? BY_SUBTOPIC[id] ?? null : null)
