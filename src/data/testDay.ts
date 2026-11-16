import type { SubjectId } from '@/types/exam'

/**
 * Día de la prueba: PAES Regular 2026 (Admisión 2027). Todo sale de fuentes oficiales del DEMRE, revisadas el
 * 16 de noviembre de 2026; no agregues nada que no esté en ellas.
 *  - Horarios: https://demre.cl/paes/regular/rendicion/los-dias-de-la-prueba/fechas-horarios
 *  - Qué llevar: https://demre.cl/paes/regular/rendicion/los-dias-de-la-prueba/que-llevar-y-que-no
 *  - Resultados y local: https://demre.cl/mesa-de-ayuda/preguntas-frecuentes-paes-regular
 *  - Estrategia: instrucciones de la portada de los folletos oficiales (PAES de Invierno 2026, Admisión 2027).
 */
export const TEST_DAY_SOURCES = {
  horarios: { label: 'demre.cl, fechas y horarios', href: 'https://demre.cl/paes/regular/rendicion/los-dias-de-la-prueba/fechas-horarios' },
  llevar: { label: 'demre.cl, qué llevar y qué no', href: 'https://demre.cl/paes/regular/rendicion/los-dias-de-la-prueba/que-llevar-y-que-no' },
  estrategia: { label: 'instrucciones del folleto oficial del demre', href: 'https://demre.cl/publicaciones/pdf/2027-26-06-17-paes-invierno-oficial-matematica1-p2027.pdf' },
} as const

export const TEST_DAY_REVIEWED = '16 de noviembre de 2026'

export interface TestSlot {
  time: string
  name: string
  /** Prueba con preguntas y duración oficiales; sin ella, la fila es un trámite (reconocimiento de salas). */
  subject?: SubjectId
  questions?: number
  minutes?: number
  /** Preguntas que cuentan para el puntaje, según la portada del folleto. */
  scored?: number
}

export interface TestDay {
  /** Fecha en Chile continental. */
  date: string
  slots: TestSlot[]
}

export const TEST_DAYS: TestDay[] = [
  {
    date: '2026-11-30',
    slots: [
      { time: '12:00 a 13:00', name: 'reconocimiento de salas' },
      { time: '15:00', name: 'matemática 2 (m2)', subject: 'm2', questions: 55, minutes: 140, scored: 50 },
    ],
  },
  {
    date: '2026-12-01',
    slots: [
      { time: '09:00', name: 'competencia lectora', subject: 'lectora', questions: 65, minutes: 150, scored: 60 },
      { time: '15:00', name: 'ciencias', subject: 'ciencias', questions: 80, minutes: 160, scored: 75 },
    ],
  },
  {
    date: '2026-12-02',
    slots: [
      { time: '09:00', name: 'matemática 1 (m1)', subject: 'm1', questions: 65, minutes: 140, scored: 60 },
      { time: '15:00', name: 'historia y ciencias sociales', subject: 'historia', questions: 65, minutes: 120, scored: 60 },
    ],
  },
]

export const SCHEDULE_NOTES = [
  'llega a tu local al menos 30 minutos antes de cada prueba.',
  'en rapa nui todo es una hora antes, también el reconocimiento de salas.',
  'tu local y tu sala salen en la tarjeta de identificación: descarga la nueva desde el portal de inscripción.',
  'ciencias: 54 preguntas del módulo común y 26 del electivo que inscribiste.',
  'resultados: lunes 4 de enero de 2027, a las 08:00.',
]

export const BRING: { title: string; items: string[] }[] = [
  {
    title: 'obligatorio',
    items: [
      'documento de identificación: cédula de identidad chilena o pasaporte (o el dni de argentina, bolivia, brasil, colombia, ecuador, perú o uruguay, si lo cargaste al inscribirte)',
      'tarjeta de identificación impresa',
      'lápiz grafito n.º 2 o portaminas hb',
      'goma de borrar',
    ],
  },
  {
    title: 'opcional',
    items: ['destacador', 'agua en una botella plástica transparente', 'mascarilla'],
  },
  {
    title: 'no permitido',
    items: [
      'mochilas, bolsos, carteras o similares',
      'calculadoras, cámaras, relojes inteligentes, tablets y otros artículos electrónicos',
      'libros, cuadernos u otros similares',
      'cualquier otro elemento que no esté entre los permitidos',
      'celular: prohibido usarlo en la sala; se deja apagado en la bolsa autosellable que te entregan al entrar',
    ],
  },
]

export const STRATEGY: string[] = [
  'no se descuenta puntaje por respuestas erradas: no dejes ninguna en blanco.',
  'el tiempo corre después de leer las instrucciones y de llenar tus datos, no antes.',
  'solo vale lo que marques en la hoja de respuestas: puedes usar el folleto como borrador, pero traspasa todo.',
  'revisa que la forma de tu hoja de respuestas sea la misma de tu folleto y completa todos tus datos.',
  'ennegrece la celdilla completa, sin salirte, solo con lápiz grafito n.º 2 o portaminas hb.',
  'cuida la hoja: no la dobles y evita borrar; si borras, límpiale los restos de goma.',
  'la bolsa con tu celular apagado queda cerrada hasta el final: abrirla significa quedar fuera del proceso de admisión.',
  'antes de salir de la sala se devuelven el folleto completo y la hoja de respuestas.',
]
