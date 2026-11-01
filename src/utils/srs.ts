import type { CardState, Rating } from '@/types/flashcards'

/**
 * Planificador SM-2 con pasos de aprendizaje al estilo Anki.
 *
 * Tarjeta nueva o en aprendizaje:
 *   1 Otra vez → vuelve en 10 min · 2 Difícil → 1 día · 3 Bien → 3 días · 4 Fácil → 7 días.
 * Tarjeta en repaso (SM-2): el factor de facilidad se ajusta con la fórmula de SM-2,
 *   EF' = EF + (0,1 − (5 − q)(0,08 + (5 − q)·0,02)), con q = 1, 3, 4, 5 para Otra vez, Difícil, Bien, Fácil,
 *   y el intervalo crece: Difícil ×1,2 · Bien ×EF · Fácil ×EF×1,3. «Otra vez» es un olvido (lapse):
 *   vuelve a reaprendizaje en 10 min, sus repeticiones se reinician y el factor no cambia (regla de SM-2).
 */
export const MINUTE = 60_000
export const DAY = 86_400_000
const LEARN_STEP = 10 * MINUTE
const FIRST_INTERVALS: Record<Exclude<Rating, 1>, number> = { 2: 1, 3: 3, 4: 7 }
const QUALITY: Record<Rating, number> = { 1: 1, 2: 3, 3: 4, 4: 5 }
export const DEFAULT_EASE = 2.5

function nextEase(ease: number, rating: Rating): number {
  // SM-2: una respuesta con calidad < 3 reinicia las repeticiones sin modificar el factor de facilidad.
  if (rating === 1) return ease
  const q = QUALITY[rating]
  return Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
}

/** Calcula el nuevo estado de una tarjeta (nueva si `state` es undefined). */
export function schedule(state: CardState | undefined, rating: Rating, now = Date.now()): CardState {
  const base: CardState = state ?? { phase: 'learning', ease: DEFAULT_EASE, interval: 0, reps: 0, lapses: 0, due: now, lastReview: now }
  const ease = nextEase(base.ease, rating)

  if (base.phase !== 'review') {
    if (rating === 1) return { ...base, ease, phase: base.phase, interval: 0, due: now + LEARN_STEP, lastReview: now }
    // Al graduarse desde reaprendizaje se usa el menor entre el intervalo fijo y el previo.
    const fixed = FIRST_INTERVALS[rating]
    const interval = base.phase === 'relearning' ? Math.max(1, Math.min(fixed, Math.round(base.interval || fixed))) : fixed
    return { ...base, ease, phase: 'review', interval, reps: base.reps + 1, due: now + interval * DAY, lastReview: now }
  }

  if (rating === 1) {
    return { ...base, ease, phase: 'relearning', interval: Math.max(1, Math.round(base.interval * 0.5)), reps: 0, lapses: base.lapses + 1, due: now + LEARN_STEP, lastReview: now }
  }
  const factor = rating === 2 ? 1.2 : rating === 3 ? ease : ease * 1.3
  const interval = Math.max(base.interval + 1, Math.round(base.interval * factor))
  return { ...base, ease, interval, reps: base.reps + 1, due: now + interval * DAY, lastReview: now }
}

/** Texto corto del intervalo que resultaría de cada botón. */
export function previewLabel(state: CardState | undefined, rating: Rating, now = Date.now()): string {
  const next = schedule(state, rating, now)
  const ms = next.due - now
  if (ms < 60 * MINUTE) return `<${Math.max(1, Math.round(ms / MINUTE))} min`
  const days = Math.round(ms / DAY)
  if (days < 30) return `${days} d`
  if (days < 365) return `${Math.round(days / 30)} m`
  return `${(days / 365).toFixed(1).replace('.', ',')} a`
}

export const endOfToday = (now = Date.now()) => {
  const d = new Date(now)
  d.setHours(23, 59, 59, 999)
  return d.getTime()
}

export const todayKey = (now = Date.now()) => {
  const d = new Date(now)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
