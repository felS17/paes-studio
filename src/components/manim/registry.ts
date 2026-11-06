import type { SceneId } from './sceneMap'
import { HomotheticScene, PhysicsScene, QuadraticScene, ThalesScene, TrigonometryScene, VectorsScene, type SceneProps } from './scenes'
import { fmt } from './manimMath'

export type SceneValues = Record<string, string | number>

export interface ChoiceParam {
  kind: 'choice'
  key: string
  label: string
  options: { value: string; label: string }[]
  /** Solo se muestra si se cumple: cada modalidad de una escena tiene sus propios parámetros. */
  when?: (values: SceneValues) => boolean
}

export interface RangeParam {
  kind: 'range'
  key: string
  label: string
  min: number
  max: number
  step: number
  format: (value: number) => string
  when?: (values: SceneValues) => boolean
}

export interface SceneMeta {
  title: string
  description: string
  durationMs: number
  defaults: SceneValues
  params: (ChoiceParam | RangeParam)[]
  Component: (props: SceneProps) => React.ReactNode
}

const modeIs = (mode: string) => (values: SceneValues) => values.modo === mode

export const SCENES: Record<SceneId, SceneMeta> = {
  homotecia: {
    title: 'homotecia',
    description: 'Una figura y su homotética desde el centro O, con rayos que pasan por cada vértice.',
    durationMs: 5000,
    defaults: { k: '2' },
    Component: HomotheticScene,
    params: [{
      kind: 'choice', key: 'k', label: 'razón',
      options: [{ value: '2', label: 'k > 1' }, { value: '0.5', label: '0 < k < 1' }, { value: '-1.5', label: 'k < 0' }],
    }],
  },
  cuadratica: {
    title: 'función cuadrática',
    description: 'Parábola con su vértice, su eje de simetría y sus raíces, según el signo de a y del discriminante.',
    durationMs: 5500,
    defaults: { a: '1', delta: 'positivo' },
    Component: QuadraticScene,
    params: [
      { kind: 'choice', key: 'a', label: 'a', options: ['-2', '-1', '-0.5', '0.5', '1', '2'].map((value) => ({ value, label: fmt(Number(value), 1) })) },
      { kind: 'choice', key: 'delta', label: 'discriminante', options: [{ value: 'positivo', label: 'Δ > 0' }, { value: 'cero', label: 'Δ = 0' }, { value: 'negativo', label: 'Δ < 0' }] },
    ],
  },
  thales: {
    title: 'thales y pitágoras',
    description: 'Paralelas que cortan dos rectas y dejan segmentos proporcionales, o cuadrados sobre los lados de un triángulo rectángulo.',
    durationMs: 5500,
    defaults: { modo: 'thales', paralela: 0.75, catetos: '3-4' },
    Component: ThalesScene,
    params: [
      { kind: 'choice', key: 'modo', label: 'teorema', options: [{ value: 'thales', label: 'thales' }, { value: 'pitagoras', label: 'pitágoras' }] },
      { kind: 'range', key: 'paralela', label: 'segunda paralela', min: 0.55, max: 0.95, step: 0.05, format: (value) => fmt(value), when: modeIs('thales') },
      { kind: 'choice', key: 'catetos', label: 'catetos', when: modeIs('pitagoras'), options: [{ value: '3-4', label: '3 y 4' }, { value: '6-8', label: '6 y 8' }, { value: '5-12', label: '5 y 12' }] },
    ],
  },
  trigonometria: {
    title: 'trigonometría',
    description: 'Circunferencia unitaria donde el seno, el coseno y la tangente de un ángulo aparecen como trazos.',
    durationMs: 5000,
    defaults: { alfa: 40 },
    Component: TrigonometryScene,
    params: [{ kind: 'range', key: 'alfa', label: 'ángulo α', min: 0, max: 360, step: 5, format: (value) => `${value}°` }],
  },
  vectores: {
    title: 'vectores y rotaciones',
    description: 'Suma de dos vectores por la ley del paralelogramo, o rotación de un punto en torno al origen.',
    durationMs: 5000,
    defaults: { modo: 'suma', vector: '1,3', giro: '90' },
    Component: VectorsScene,
    params: [
      { kind: 'choice', key: 'modo', label: 'qué ver', options: [{ value: 'suma', label: 'suma' }, { value: 'rotacion', label: 'rotación' }] },
      { kind: 'choice', key: 'vector', label: 'vector v', when: modeIs('suma'), options: [{ value: '1,3', label: '(1, 3)' }, { value: '-2,3', label: '(−2, 3)' }, { value: '3,-1', label: '(3, −1)' }] },
      { kind: 'choice', key: 'giro', label: 'giro', when: modeIs('rotacion'), options: [{ value: '90', label: '90°' }, { value: '180', label: '180°' }, { value: '270', label: '270°' }] },
    ],
  },
  fisica: {
    title: 'cinemática y ondas',
    description: 'Partícula con sus vectores velocidad y aceleración, o una onda sinusoidal con su amplitud y su longitud de onda.',
    durationMs: 6000,
    defaults: { modo: 'cinematica', movimiento: 'acelera', amplitud: 1.25, longitud: 5 },
    Component: PhysicsScene,
    params: [
      { kind: 'choice', key: 'modo', label: 'qué ver', options: [{ value: 'cinematica', label: 'cinemática' }, { value: 'ondas', label: 'ondas' }] },
      { kind: 'choice', key: 'movimiento', label: 'movimiento', when: modeIs('cinematica'), options: [{ value: 'mru', label: 'constante' }, { value: 'acelera', label: 'acelera' }, { value: 'frena', label: 'frena' }] },
      { kind: 'range', key: 'amplitud', label: 'amplitud A', when: modeIs('ondas'), min: 0.5, max: 2, step: 0.25, format: (value) => `${fmt(value)} m` },
      { kind: 'range', key: 'longitud', label: 'longitud λ', when: modeIs('ondas'), min: 3, max: 8, step: 0.5, format: (value) => `${fmt(value)} m` },
    ],
  },
}
