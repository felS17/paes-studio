const pad = (n: number) => n.toString().padStart(2, '0')

/** 5400000 → "1:30:00"; 75000 → "01:15". */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** 95 → "1 h 35 min". */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

export function formatDuration(ms: number): string {
  return formatMinutes(Math.max(1, Math.round(ms / 60000)))
}

const dateFmt = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })
const shortFmt = new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat('es-CL', { hour: '2-digit', minute: '2-digit' })

export const formatDate = (ts: number) => dateFmt.format(ts)
export const formatShortDate = (ts: number) => shortFmt.format(ts)
export const formatTime = (ts: number) => timeFmt.format(ts)

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)} %`
}

export function relativeDays(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86_400_000)
  if (days <= 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 7) return `hace ${days} días`
  return formatDate(ts)
}

export function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}
