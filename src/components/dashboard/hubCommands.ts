import { EXAMS } from '@/data/catalog'
import { SUBJECT_ORDER } from '@/data/subjects'
import { SUBTOPICS } from '@/data/temario'
import type { SubjectId } from '@/types/exam'
import { normalizeText } from '@/utils/topicSearch'

export type HubAction =
  | { kind: 'train'; subject?: SubjectId }
  | { kind: 'route'; to: string }
  | { kind: 'daily' | 'theme' | 'font' | 'quote' }

export interface HubCommand {
  name: string
  /** Otros nombres que también funcionan al escribirlos. */
  aliases?: string[]
  /** Cómo se muestra en el menú, si no basta con `/name`. */
  label?: string
  hint: string
  action: HubAction
  /** Funciona al escribirlo, pero no ocupa una fila del menú. */
  hidden?: boolean
}

export const HUB_COMMANDS: HubCommand[] = [
  { name: 'rapidas', label: '/rapidas o /10', aliases: ['10', '20', 'entrenar', 'run'], hint: 'lanzar 10 preguntas de tu materia más débil', action: { kind: 'train' } },
  ...SUBJECT_ORDER.map((subject): HubCommand => ({ name: subject, hint: `practicar 10 preguntas de ${subject}`, action: { kind: 'train', subject } })),
  { name: 'daily', hint: 'abrir las 3 preguntas del desafío del día', action: { kind: 'daily' } },
  { name: 'ensayos', hint: `abrir catálogo de ${EXAMS.length} ensayos`, action: { kind: 'route', to: '/ensayos' } },
  { name: 'temas', hint: `explorar los ${SUBTOPICS.length} subtemas`, action: { kind: 'route', to: '/subtemas' } },
  { name: 'flashcards', aliases: ['flash'], hint: 'repasar tarjetas de memoria', action: { kind: 'route', to: '/flashcards' } },
  { name: 'mapa', aliases: ['graph'], hint: 'abrir red de conocimiento zettelkasten', action: { kind: 'route', to: '/zettelkasten' } },
  { name: 'guias', aliases: ['pdf'], hint: 'ver resúmenes pdf y formulario express', action: { kind: 'route', to: '/material' } },
  { name: 'stats', hint: 'abrir administrador de tareas y errores', action: { kind: 'route', to: '/analitica' } },
  { name: 'tema', aliases: ['theme'], hint: 'cambiar paleta de colores y fuente', action: { kind: 'theme' } },
  { name: 'fuente', aliases: ['font'], hint: 'cambiar la tipografía', action: { kind: 'font' }, hidden: true },
  { name: 'cita', hint: 'mostrar otra cita filosófica', action: { kind: 'quote' } },
]

const HELP_WORDS = ['help', 'ayuda', '/help', '/ayuda']

/** `help` o `/help`: abre el menú completo, sin elegir nada por adelantado. */
export const isHelpText = (text: string) => HELP_WORDS.includes(normalizeText(text.trim()))

/** Qué filtra el menú según lo escrito, o `null` si el texto no lo abre. Con un espacio ya es un comando con argumento. */
export function menuQuery(text: string): string | null {
  if (isHelpText(text)) return ''
  const typed = normalizeText(text.trim())
  return typed.startsWith('/') && !typed.includes(' ') ? typed.slice(1) : null
}

const namesOf = (c: HubCommand) => [c.name, ...(c.aliases ?? [])]

/** 0: nombre exacto, 1: empieza igual, 2: lo menciona su descripción. Así `/tema` elige `tema` antes que `temas`. */
function rank(c: HubCommand, query: string): number {
  if (namesOf(c).includes(query)) return 0
  if (namesOf(c).some((n) => n.startsWith(query))) return 1
  return normalizeText(c.hint).includes(query) ? 2 : 3
}

export function filterCommands(query: string): HubCommand[] {
  const visible = HUB_COMMANDS.filter((c) => !c.hidden)
  if (!query) return visible
  return visible
    .map((c) => ({ c, score: rank(c, query) }))
    .filter(({ score }) => score < 3)
    .sort((a, b) => a.score - b.score)
    .map(({ c }) => c)
}

export const findCommand = (word: string) => HUB_COMMANDS.find((c) => namesOf(c).includes(word))
