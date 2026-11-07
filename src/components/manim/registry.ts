import type { SceneId, SceneValues } from './sceneMap'
import type { SceneProps } from './sceneProps'
import { ConditionalScene, BoxplotScene, DispersionScene, ProbabilityScene } from './scenesData'
import { FigurasScene, ThalesScene } from './scenesGeometry'
import { HomotheticScene, LineScene, TrigonometryScene, VectorsScene } from './scenesPlane'
import { fmt } from './manimMath'

export interface ChoiceParam {
  kind: 'choice'
  key: string
  label: string
  options: { value: string; label: string }[]
  /** Cómo rotular un valor que no está en `options`, por ejemplo uno que vino del enunciado. */
  custom?: (value: string) => string
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

const modeIs = (...modes: string[]) => (values: SceneValues) => modes.includes(String(values.modo))
const shown = (value: string) => `(${value.replace(',', ', ').replace(/-/g, '−')})`

const ALPHA_RANGE: RangeParam = {
  kind: 'range', key: 'alfa', label: 'ángulo α', min: 5, max: 355, step: 5, format: (value) => `${value}°`, when: modeIs('unitaria', 'cuerda'),
}

export const SCENES: Record<SceneId, SceneMeta> = {
  figuras: {
    title: 'figuras y cuerpos',
    description: 'Figuras planas y cuerpos geométricos: lados, alturas, áreas por descomposición, sector circular y volumen.',
    durationMs: 6000,
    defaults: { forma: 'rectangulo', a: 8, b: 5, h: 6, c: 3, d: 2, r: 4, angulo: 90 },
    Component: FigurasScene,
    params: [{
      kind: 'choice', key: 'forma', label: 'figura',
      options: [
        { value: 'rectangulo', label: 'rectángulo' },
        { value: 'triangulo', label: 'triángulo' },
        { value: 'compuesta', label: 'compuesta' },
        { value: 'circulo', label: 'círculo' },
        { value: 'prisma', label: 'prisma' },
        { value: 'cilindro', label: 'cilindro' },
        { value: 'cono', label: 'cono' },
        { value: 'esfera', label: 'esfera' },
      ],
    }],
  },
  thales: {
    title: 'thales y pitágoras',
    description: 'Paralelas que cortan dos rectas y dejan segmentos proporcionales, o cuadrados sobre los lados de un triángulo rectángulo.',
    durationMs: 5500,
    defaults: { modo: 'pitagoras', a: 4, b: 2, c: 6, d: 3, catetos: '3-4' },
    Component: ThalesScene,
    params: [
      { kind: 'choice', key: 'modo', label: 'teorema', options: [{ value: 'thales', label: 'thales' }, { value: 'pitagoras', label: 'pitágoras' }] },
      { kind: 'choice', key: 'catetos', label: 'catetos', when: modeIs('pitagoras'), custom: (value) => value.replace('-', ' y '), options: [{ value: '3-4', label: '3 y 4' }, { value: '6-8', label: '6 y 8' }, { value: '5-12', label: '5 y 12' }] },
    ],
  },
  vectores: {
    title: 'plano, vectores e isometrías',
    description: 'Coordenadas, suma y resta de vectores, traslación, rotación y reflexión en el plano cartesiano.',
    durationMs: 5500,
    defaults: { modo: 'suma', p: '3,2', u: '4,1', w: '1,3', t: '2,-3', giro: '90', eje: 'y' },
    Component: VectorsScene,
    params: [
      {
        kind: 'choice', key: 'modo', label: 'qué ver',
        options: [
          { value: 'plano', label: 'punto' },
          { value: 'suma', label: 'suma' },
          { value: 'resta', label: 'resta' },
          { value: 'traslacion', label: 'traslación' },
          { value: 'rotacion', label: 'rotación' },
          { value: 'reflexion', label: 'reflexión' },
        ],
      },
      { kind: 'choice', key: 'w', label: 'vector v', when: modeIs('suma', 'resta'), custom: shown, options: [{ value: '1,3', label: '(1, 3)' }, { value: '-2,3', label: '(−2, 3)' }, { value: '3,-1', label: '(3, −1)' }] },
      { kind: 'choice', key: 'giro', label: 'giro', when: modeIs('rotacion'), options: [{ value: '90', label: '90°' }, { value: '180', label: '180°' }, { value: '270', label: '270°' }] },
      { kind: 'choice', key: 'eje', label: 'respecto de', when: modeIs('reflexion'), options: [{ value: 'x', label: 'eje x' }, { value: 'y', label: 'eje y' }, { value: 'origen', label: 'origen' }] },
    ],
  },
  boxplot: {
    title: 'diagrama de cajón',
    description: 'Construcción del diagrama de cajón con sus cuartiles y el rango intercuartílico.',
    durationMs: 6000,
    defaults: { datos: '2,3,5,6,7,8,9,11,12,14,16', q1: '', q2: '', q3: '', min: '', max: '' },
    Component: BoxplotScene,
    params: [],
  },
  probabilidad: {
    title: 'probabilidad',
    description: 'Regla de Laplace con casos favorables, diagrama de árbol e intersección de conjuntos.',
    durationMs: 6000,
    defaults: { modo: 'laplace', favorables: 6, casos: 15, pa: '3/5', pba: '1/2', pbna: '1/4', a: 60, b: 40, ambos: 20, total: 100 },
    Component: ProbabilityScene,
    params: [{ kind: 'choice', key: 'modo', label: 'qué ver', options: [{ value: 'laplace', label: 'laplace' }, { value: 'arbol', label: 'árbol' }, { value: 'venn', label: 'conjuntos' }] }],
  },
  recta: {
    title: 'pendiente de una recta',
    description: 'Recta por dos puntos con su pendiente, y rectas paralelas o perpendiculares.',
    durationMs: 5500,
    defaults: { modo: 'pendiente', a: '-3,-1', b: '3,2' },
    Component: LineScene,
    params: [{ kind: 'choice', key: 'modo', label: 'qué ver', options: [{ value: 'pendiente', label: 'pendiente' }, { value: 'paralelas', label: 'paralelas' }, { value: 'perpendiculares', label: 'perpendiculares' }] }],
  },
  homotecia: {
    title: 'homotecia',
    description: 'Una figura y su homotética desde el centro O, con rayos que pasan por cada vértice.',
    durationMs: 5000,
    defaults: { k: '2' },
    Component: HomotheticScene,
    params: [{
      kind: 'choice', key: 'k', label: 'razón',
      custom: (value) => `k = ${fmt(Number(value))}`,
      options: [{ value: '2', label: 'k > 1' }, { value: '0.5', label: '0 < k < 1' }, { value: '-1.5', label: 'k < 0' }],
    }],
  },
  trigonometria: {
    title: 'razones trigonométricas',
    description: 'Triángulo rectángulo y circunferencia unitaria con el seno, el coseno y la tangente; arcos y cuerdas.',
    durationMs: 5500,
    defaults: { modo: 'triangulo', alfa: 40, op: 3, ady: 4 },
    Component: TrigonometryScene,
    params: [
      { kind: 'choice', key: 'modo', label: 'qué ver', options: [{ value: 'triangulo', label: 'triángulo' }, { value: 'unitaria', label: 'unitaria' }, { value: 'cuerda', label: 'arco y cuerda' }] },
      ALPHA_RANGE,
    ],
  },
  dispersion: {
    title: 'varianza y desviación estándar',
    description: 'Dos grupos con la misma media: se comparan sus distancias a la media, su varianza y su desviación estándar.',
    durationMs: 6000,
    defaults: { datos: '4,6,8,10,12' },
    Component: DispersionScene,
    params: [],
  },
  condicional: {
    title: 'condicional, binomial y conteo',
    description: 'Árbol de probabilidad condicional, barras de la distribución binomial y principio multiplicativo.',
    durationMs: 6000,
    defaults: { modo: 'arbol', pa: '3/5', pba: '1/2', pbna: '1/4', n: '6', p: '1/2', k: '', a: 3, b: 2 },
    Component: ConditionalScene,
    params: [
      { kind: 'choice', key: 'modo', label: 'qué ver', options: [{ value: 'arbol', label: 'árbol' }, { value: 'binomial', label: 'binomial' }, { value: 'conteo', label: 'conteo' }] },
      { kind: 'choice', key: 'n', label: 'n', when: modeIs('binomial'), custom: String, options: [{ value: '4', label: '4' }, { value: '6', label: '6' }, { value: '10', label: '10' }] },
      { kind: 'choice', key: 'p', label: 'p', when: modeIs('binomial'), custom: String, options: [{ value: '1/4', label: '1/4' }, { value: '1/2', label: '1/2' }, { value: '3/4', label: '3/4' }] },
    ],
  },
}
