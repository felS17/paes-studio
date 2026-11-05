import type { ThemeId } from '@/types/user'

/** Colores del grafo en Canvas, que no puede leer las clases de Tailwind. */
export interface GraphPalette {
  bg: string
  surface: string
  strong: string
  mid: string
  muted: string
  faint: string
  accent: string
  tree: string
  leaf: string
  cross: string
  dim: string
  correct: string
  incorrect: string
}

export interface ThemeInfo {
  id: ThemeId
  label: string
  hint: string
  dark: boolean
  /** Fondo principal: también pinta la barra del navegador móvil y la muestra del selector. */
  canvas: string
  accent: string
  graph: GraphPalette
}

/** Los 4 temas. Sus tokens de interfaz viven en src/styles/index.css, bajo `[data-theme]`. */
export const THEMES: readonly ThemeInfo[] = [
  {
    id: 'geist-light',
    label: 'Geist Light',
    hint: 'blanco y negro editorial',
    dark: false,
    canvas: '#FAFAFA',
    accent: '#18181B',
    graph: {
      bg: '#FAFAFA', surface: '#FFFFFF', strong: '#18181B', mid: '#71717A', muted: '#A1A1AA', faint: '#D4D4D8', accent: '#18181B',
      tree: 'rgba(113,113,122,0.55)', leaf: 'rgba(161,161,170,0.45)', cross: 'rgba(113,113,122,0.3)', dim: 'rgba(212,212,216,0.35)',
      correct: 'rgba(16,185,129,0.9)', incorrect: 'rgba(225,29,72,0.9)',
    },
  },
  {
    id: 'geist-dark',
    label: 'Geist Dark',
    hint: 'negro carbón monocromático',
    dark: true,
    canvas: '#09090B',
    accent: '#F4F4F5',
    graph: {
      bg: '#09090B', surface: '#121215', strong: '#F4F4F5', mid: '#A1A1AA', muted: '#52525B', faint: '#3F3F46', accent: '#F4F4F5',
      tree: 'rgba(113,113,122,0.7)', leaf: 'rgba(82,82,91,0.6)', cross: 'rgba(161,161,170,0.28)', dim: 'rgba(63,63,70,0.25)',
      correct: 'rgba(52,211,153,0.9)', incorrect: 'rgba(251,113,133,0.9)',
    },
  },
  {
    id: 'github-dark',
    label: 'GitHub Dark',
    hint: 'azul para lo activo, verde para tus aciertos',
    dark: true,
    canvas: '#0D1117',
    accent: '#58A6FF',
    graph: {
      bg: '#0D1117', surface: '#161B22', strong: '#E6EDF3', mid: '#7D8590', muted: '#484F58', faint: '#30363D', accent: '#58A6FF',
      tree: 'rgba(125,133,144,0.6)', leaf: 'rgba(72,79,88,0.65)', cross: 'rgba(88,166,255,0.32)', dim: 'rgba(48,54,61,0.3)',
      correct: '#3FB950', incorrect: '#F85149',
    },
  },
  {
    id: 'paper',
    label: 'Papel Cálido',
    hint: 'crema suave para leer durante horas',
    dark: false,
    canvas: '#F6F1E7',
    accent: '#2C2621',
    graph: {
      bg: '#F6F1E7', surface: '#EFE8D8', strong: '#2C2621', mid: '#6F6454', muted: '#8F826C', faint: '#CDC2A9', accent: '#2C2621',
      tree: 'rgba(111,100,84,0.55)', leaf: 'rgba(143,130,108,0.45)', cross: 'rgba(111,100,84,0.32)', dim: 'rgba(205,194,169,0.4)',
      correct: 'rgba(5,150,105,0.9)', incorrect: 'rgba(190,18,60,0.9)',
    },
  },
]

export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<ThemeId, ThemeInfo>

export const isThemeId = (value: unknown): value is ThemeId => typeof value === 'string' && value in THEME_BY_ID
