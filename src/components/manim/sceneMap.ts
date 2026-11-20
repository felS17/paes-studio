import type { Question } from '@/types/exam'
import { EXTRACTORS, questionText } from './sceneExtract'

export type SceneId =
  | 'figuras' | 'thales' | 'vectores' | 'boxplot' | 'probabilidad' | 'recta' | 'homotecia' | 'trigonometria' | 'dispersion' | 'condicional'
  | 'funciones' | 'ondas' | 'reaccion' | 'tectonica' | 'movimiento'
export type SceneValues = Record<string, string | number>

export interface SceneEntry {
  scene: SceneId
  /** Valores con que parte la escena: un mismo tema puede abrir en una u otra modalidad. */
  initial?: SceneValues
  /** En una pregunta: si las cifras salieron de su enunciado o de su solución. Si no, son valores de ejemplo. */
  fromQuestion?: boolean
}

/**
 * Solo los temas donde ver la figura ayuda de verdad: geometría, plano, funciones, posición y probabilidad de M1 y M2, y
 * en Ciencias los procesos que se entienden mejor en movimiento (ondas y luz, movimiento, reacciones, placas). El álgebra
 * mecánica, la aritmética, Lectora e Historia no llevan animación a propósito.
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
  'm1-funcion-afin': { scene: 'funciones' },
  'm1-cuadratica': { scene: 'funciones', initial: { modo: 'cuadratica' } },
  'm2-cuadraticas': { scene: 'funciones', initial: { modo: 'cuadratica' } },
  'm2-exponencial': { scene: 'funciones', initial: { modo: 'exponencial' } },
  'm2-inversa': { scene: 'funciones', initial: { modo: 'inversa' } },
  'cs-luz': { scene: 'ondas' },
  'cs-cinematica': { scene: 'movimiento' },
  'cs-reacciones': { scene: 'reaccion' },
  'cs-tierra': { scene: 'tectonica' },
}

/**
 * Escenas que solo van en el resumen del tema y el formulario: no tienen extractor de cifras, así que dentro de la
 * solución de una pregunta mostrarían valores que no son los suyos.
 */
const SUMMARY_ONLY = new Set<SceneId>(['funciones', 'ondas', 'reaccion', 'tectonica', 'movimiento'])

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
export function sceneForQuestion(question: Pick<Question, 'id' | 'subtopic' | 'stem' | 'explanation' | 'origin'>): SceneEntry | null {
  const base = sceneForSubtopic(question.subtopic)
  // Una pregunta oficial copiada en un ensayo curado se trata como la original.
  const year = realYear(question.origin ?? question.id)
  if (!base || SUMMARY_ONLY.has(base.scene) || !question.explanation || year === null || year < FIRST_YEAR || year > LAST_YEAR) return null
  const found = EXTRACTORS[question.subtopic as string]?.(questionText(question))
  return { scene: found?.scene ?? base.scene, initial: { ...base.initial, ...found?.values }, fromQuestion: found?.complete ?? false }
}
