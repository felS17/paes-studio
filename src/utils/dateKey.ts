/**
 * Claves de fecha locales. Este módulo no importa nada a propósito: `useExamStore` lo usa, y `data/catalog` importa ese
 * store, así que traerlas desde `utils/daily` (que importa el catálogo) crearía un ciclo que rompe la app al cargar.
 */
const pad = (n: number) => n.toString().padStart(2, '0')

/** Fecha local en formato `YYYY-MM-DD` (la semilla del Desafío Diario y la clave de la racha). */
export function localDateKey(date: Date | number = new Date()): string {
  const d = typeof date === 'number' ? new Date(date) : date
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Día anterior a una clave `YYYY-MM-DD` (respeta cambios de mes, año y horario de verano). */
export function previousDateKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return localDateKey(new Date(y, m - 1, d - 1, 12))
}
