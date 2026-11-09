import type { Question } from '@/types/exam'
import { EXTRACTORS, questionText } from './sceneExtract'

export type SceneId = 'figuras' | 'thales' | 'vectores' | 'boxplot' | 'probabilidad' | 'recta' | 'homotecia' | 'trigonometria' | 'dispersion' | 'condicional'
export type SceneValues = Record<string, string | number>

export interface SceneEntry {
  scene: SceneId
  /** Valores con que parte la escena: un mismo tema puede abrir en una u otra modalidad. */
  initial?: SceneValues
  /** En una pregunta: si las cifras salieron de su enunciado o de su solución. Si no, son valores de ejemplo. */
  fromQuestion?: boolean
}

/**
 * Solo los temas donde ver la figura ayuda de verdad: geometría, plano, posición y probabilidad de M1 y M2. El álgebra
 * mecánica, la aritmética y las demás materias no llevan animación a propósito.
 */
const BY_SUBTOPIC: Record<string, SceneEntry> = {
  'm1-areas': { scene: 'figuras' },
  'm1-cuerpos': { scene: 'figuras', initial: { forma: 'cilindro' } },
  'm1-triangulos': { scene: 'thales', initial: { modo: 'thales' } },
  'm1-transformaciones': { scene: 'vectores' },
  'm1-posicion': { scene: 'boxplot' },
  'm1-probabilidad': { scene: 'probabilidad' },
  'm2-analitica': { scene: 'recta' },
  'm2-homotecia': { scene: 'homotecia' },
  'm2-trigonometria': { scene: 'trigonometria' },
  'm2-dispersion': { scene: 'dispersion' },
  'm2-condicional': { scene: 'condicional' },
  'm2-combinatoria': { scene: 'condicional', initial: { modo: 'conteo' } },
  'm2-modelos': { scene: 'condicional', initial: { modo: 'binomial' } },
  'm2-funciones-trig': { scene: 'trigonometria', initial: { modo: 'unitaria' } },
  'm2-circunferencia': { scene: 'trigonometria', initial: { modo: 'cuerda' } },
  'm2-esfera': { scene: 'figuras', initial: { forma: 'esfera' } },
}

/** La escena de un subtema, o null si no tiene. Vive aparte de las escenas para no cargarlas si no se usan. */
export const sceneForSubtopic = (id: string | null | undefined): SceneEntry | null => (id ? BY_SUBTOPIC[id] ?? null : null)

/**
 * El `id` guarda el año de admisión, uno más que el de rendición: `m1-2025-regular` es la PAES Regular 2024. Los ensayos
 * curados no tienen año y quedan fuera.
 */
const FIRST_YEAR = 2024
const LAST_YEAR = 2026
const realYear = (questionId: string) => {
  const admission = questionId.match(/^m[12]-(\d{4})-(?:regular|invierno)/)?.[1]
  return admission ? Number(admission) - 1 : null
}

/** Escena de una pregunta: solo en las oficiales de 2024 a 2026 con solución, y con sus propias cifras cuando se pueden leer. */
export function sceneForQuestion(question: Pick<Question, 'id' | 'subtopic' | 'stem' | 'explanation'>): SceneEntry | null {
  const base = sceneForSubtopic(question.subtopic)
  const year = realYear(question.id)
  if (!base || !question.explanation || year === null || year < FIRST_YEAR || year > LAST_YEAR) return null
  const found = EXTRACTORS[question.subtopic as string]?.(questionText(question))
  return { scene: found?.scene ?? base.scene, initial: { ...base.initial, ...found?.values }, fromQuestion: found?.complete ?? false }
}
