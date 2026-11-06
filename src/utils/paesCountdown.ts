export interface PaesDate {
  name: string
  at: number
  /** Fecha calculada con el patrón de años anteriores, hasta que el DEMRE publique la oficial. */
  estimated: boolean
}

/** Agrega aquí cada fecha oficial apenas se publique: reemplaza a la estimada del mismo nombre. */
const CONFIRMED: PaesDate[] = [{ name: 'paes regular 2026', at: Date.parse('2026-11-30T09:00:00-03:00'), estimated: false }]

/** La «recta final»: la barra parte a llenarse 90 días antes de la prueba. */
const FINAL_STRETCH_MS = 90 * 86_400_000

const mondayOnOrAfter = (year: number, month: number, day: number) => day + (8 - new Date(Date.UTC(year, month, day)).getUTCDay()) % 7

/**
 * Estimación según el calendario de años anteriores: Invierno, el tercer lunes de junio (09:00 en Chile, UTC−4), y
 * Regular, el lunes desde el 28 de noviembre (09:00 en Chile, UTC−3).
 */
const estimatedDates = (year: number): PaesDate[] => [
  { name: `paes invierno ${year}`, at: Date.UTC(year, 5, mondayOnOrAfter(year, 5, 15), 13), estimated: true },
  { name: `paes regular ${year}`, at: Date.UTC(year, 10, mondayOnOrAfter(year, 10, 28), 12), estimated: true },
]

/** La próxima convocatoria que aún no empieza. Si ya pasó la fecha conocida, sigue sola con la siguiente. */
export function nextPaesDate(now: number): PaesDate {
  const year = new Date(now).getUTCFullYear()
  const known = new Set(CONFIRMED.map((d) => d.name))
  return [...CONFIRMED, ...[year, year + 1].flatMap(estimatedDates).filter((d) => !known.has(d.name))]
    .filter((d) => d.at > now)
    .sort((a, b) => a.at - b.at)[0]
}

export interface PaesCountdownState {
  date: PaesDate
  days: number
  hours: number
  minutes: number
  /** Avance de la recta final, de 0 a 1. */
  progress: number
}

export function paesCountdown(now: number): PaesCountdownState {
  const date = nextPaesDate(now)
  const left = date.at - now
  return {
    date,
    days: Math.floor(left / 86_400_000),
    hours: Math.floor(left / 3_600_000) % 24,
    minutes: Math.floor(left / 60_000) % 60,
    progress: Math.max(0, Math.min(1, 1 - left / FINAL_STRETCH_MS)),
  }
}
