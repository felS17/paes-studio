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
  surface: string
  text: string
  accent: string
  /** Segundo color de la paleta: junto a `accent` y `text` forma la gradiente de la nebulosa. Siempre en #rrggbb. */
  accent2: string
  graph: GraphPalette
}

/** Los 10 temas, en el orden del selector. Sus tokens de interfaz viven en src/styles/index.css, bajo `[data-theme]`. */
export const THEMES: readonly ThemeInfo[] = [
  {
    id: 'github-dark',
    label: 'GitHub Dark',
    hint: 'azul para lo activo, verde para tus aciertos',
    dark: true,
    canvas: '#0D1117',
    surface: '#161B22',
    text: '#E6EDF3',
    accent: '#58A6FF',
    accent2: '#3FB950',
    graph: {
      bg: '#0D1117', surface: '#161B22', strong: '#E6EDF3', mid: '#7D8590', muted: '#484F58', faint: '#30363D', accent: '#58A6FF',
      tree: 'rgba(125,133,144,0.6)', leaf: 'rgba(72,79,88,0.65)', cross: 'rgba(88,166,255,0.32)', dim: 'rgba(48,54,61,0.3)',
      correct: '#3FB950', incorrect: '#F85149',
    },
  },
  {
    id: 'catppuccin-mocha',
    label: 'Catppuccin Mocha',
    hint: 'lavanda y malva sobre azul profundo',
    dark: true,
    canvas: '#1E1E2E',
    surface: '#181825',
    text: '#CDD6F4',
    accent: '#B4BEFE',
    accent2: '#CBA6F7',
    graph: {
      bg: '#1E1E2E', surface: '#181825', strong: '#CDD6F4', mid: '#9399B2', muted: '#6C7086', faint: '#45475A', accent: '#B4BEFE',
      tree: 'rgba(147,153,178,0.6)', leaf: 'rgba(108,112,134,0.6)', cross: 'rgba(180,190,254,0.32)', dim: 'rgba(69,71,90,0.35)',
      correct: '#A6E3A1', incorrect: '#F38BA8',
    },
  },
  {
    id: 'tokyo-night',
    label: 'Tokyo Night',
    hint: 'azul y cian de ciudad de noche',
    dark: true,
    canvas: '#1A1B26',
    surface: '#16161E',
    text: '#C0CAF5',
    accent: '#7AA2F7',
    accent2: '#7DCFFF',
    graph: {
      bg: '#1A1B26', surface: '#16161E', strong: '#C0CAF5', mid: '#8B94BD', muted: '#565F89', faint: '#414868', accent: '#7AA2F7',
      tree: 'rgba(139,148,189,0.6)', leaf: 'rgba(86,95,137,0.6)', cross: 'rgba(122,162,247,0.32)', dim: 'rgba(65,72,104,0.35)',
      correct: '#9ECE6A', incorrect: '#F7768E',
    },
  },
  {
    id: 'gruvbox-dark',
    label: 'Gruvbox Dark',
    hint: 'ámbar y naranja, cálido y retro',
    dark: true,
    canvas: '#282828',
    surface: '#1D2021',
    text: '#EBDBB2',
    accent: '#FABD2F',
    accent2: '#FE8019',
    graph: {
      bg: '#282828', surface: '#1D2021', strong: '#EBDBB2', mid: '#A89984', muted: '#7C6F64', faint: '#504945', accent: '#FABD2F',
      tree: 'rgba(168,153,132,0.6)', leaf: 'rgba(124,111,100,0.6)', cross: 'rgba(250,189,47,0.3)', dim: 'rgba(80,73,69,0.4)',
      correct: '#B8BB26', incorrect: '#FB6A56',
    },
  },
  {
    id: 'nord',
    label: 'Nord',
    hint: 'hielo y azul ártico, muy tranquilo',
    dark: true,
    canvas: '#2E3440',
    surface: '#3B4252',
    text: '#ECEFF4',
    accent: '#88C0D0',
    accent2: '#81A1C1',
    graph: {
      bg: '#2E3440', surface: '#3B4252', strong: '#ECEFF4', mid: '#C0C8D6', muted: '#76819A', faint: '#4C566A', accent: '#88C0D0',
      tree: 'rgba(192,200,214,0.55)', leaf: 'rgba(118,129,154,0.6)', cross: 'rgba(136,192,208,0.32)', dim: 'rgba(76,86,106,0.4)',
      correct: '#B4CF9C', incorrect: '#E39EA5',
    },
  },
  {
    id: 'rose-pine',
    label: 'Rosé Pine',
    hint: 'rosa y espuma, suave de noche',
    dark: true,
    canvas: '#191724',
    surface: '#1F1D2E',
    text: '#E0DEF4',
    accent: '#EBBCBA',
    accent2: '#9CCFD8',
    graph: {
      bg: '#191724', surface: '#1F1D2E', strong: '#E0DEF4', mid: '#A5A1BF', muted: '#6E6A86', faint: '#403D52', accent: '#EBBCBA',
      tree: 'rgba(165,161,191,0.6)', leaf: 'rgba(110,106,134,0.6)', cross: 'rgba(235,188,186,0.3)', dim: 'rgba(64,61,82,0.4)',
      correct: '#9CCFD8', incorrect: '#EB6F92',
    },
  },
  {
    id: 'dracula',
    label: 'Dracula',
    hint: 'púrpura y rosa de alto contraste',
    dark: true,
    canvas: '#282A36',
    surface: '#1E1F29',
    text: '#F8F8F2',
    accent: '#BD93F9',
    accent2: '#FF79C6',
    graph: {
      bg: '#282A36', surface: '#1E1F29', strong: '#F8F8F2', mid: '#A6ACC8', muted: '#6272A4', faint: '#44475A', accent: '#BD93F9',
      tree: 'rgba(166,172,200,0.55)', leaf: 'rgba(98,114,164,0.6)', cross: 'rgba(189,147,249,0.32)', dim: 'rgba(68,71,90,0.4)',
      correct: '#50FA7B', incorrect: '#FF6E6E',
    },
  },
  {
    id: 'geist-dark',
    label: 'Geist Dark',
    hint: 'negro carbón monocromático',
    dark: true,
    canvas: '#09090B',
    surface: '#121215',
    text: '#F4F4F5',
    accent: '#F4F4F5',
    accent2: '#A1A1AA',
    graph: {
      bg: '#09090B', surface: '#121215', strong: '#F4F4F5', mid: '#A1A1AA', muted: '#52525B', faint: '#3F3F46', accent: '#F4F4F5',
      tree: 'rgba(113,113,122,0.7)', leaf: 'rgba(82,82,91,0.6)', cross: 'rgba(161,161,170,0.28)', dim: 'rgba(63,63,70,0.25)',
      correct: 'rgba(52,211,153,0.9)', incorrect: 'rgba(251,113,133,0.9)',
    },
  },
  {
    id: 'geist-light',
    label: 'Geist Light',
    hint: 'blanco y negro editorial',
    dark: false,
    canvas: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#18181B',
    accent: '#18181B',
    accent2: '#71717A',
    graph: {
      bg: '#FAFAFA', surface: '#FFFFFF', strong: '#18181B', mid: '#71717A', muted: '#A1A1AA', faint: '#D4D4D8', accent: '#18181B',
      tree: 'rgba(113,113,122,0.55)', leaf: 'rgba(161,161,170,0.45)', cross: 'rgba(113,113,122,0.3)', dim: 'rgba(212,212,216,0.35)',
      correct: 'rgba(16,185,129,0.9)', incorrect: 'rgba(225,29,72,0.9)',
    },
  },
  {
    id: 'paper',
    label: 'Papel Cálido',
    hint: 'crema suave para leer durante horas',
    dark: false,
    canvas: '#F6F1E7',
    surface: '#EFE8D8',
    text: '#2C2621',
    accent: '#2C2621',
    accent2: '#8F826C',
    graph: {
      bg: '#F6F1E7', surface: '#EFE8D8', strong: '#2C2621', mid: '#6F6454', muted: '#8F826C', faint: '#CDC2A9', accent: '#2C2621',
      tree: 'rgba(111,100,84,0.55)', leaf: 'rgba(143,130,108,0.45)', cross: 'rgba(111,100,84,0.32)', dim: 'rgba(205,194,169,0.4)',
      correct: 'rgba(5,150,105,0.9)', incorrect: 'rgba(190,18,60,0.9)',
    },
  },
]

export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<ThemeId, ThemeInfo>

export const isThemeId = (value: unknown): value is ThemeId => typeof value === 'string' && value in THEME_BY_ID
