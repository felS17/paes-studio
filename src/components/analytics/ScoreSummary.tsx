import { Link } from 'react-router-dom'
import { Panel } from '@/components/ui/panel'
import { SUBJECTS, SUBJECT_ORDER } from '@/data/subjects'
import type { AttemptRecord } from '@/types/analytics'
import { summarizeBySubject } from '@/utils/analytics'
import { scaleRatio } from '@/utils/scoring'

const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0')

/** Bloque 3: último puntaje frente al promedio y al mejor, por asignatura. */
export function ScoreSummary({ attempts }: { attempts: AttemptRecord[] }) {
  const summary = summarizeBySubject(attempts)
  const rows = SUBJECT_ORDER.flatMap((id) => {
    const s = summary.get(id)
    return s?.latest
      ? [{ id, last: s.latest.paesScore, avg: Math.round(s.average ?? 0), best: s.best ?? s.latest.paesScore, attempts: s.attempts, latestId: s.latest.id }]
      : []
  })
  const th = 'px-4 py-2.5 text-left text-[11.5px] font-medium text-zinc-500 dark:text-zinc-400'
  const num = 'px-4 py-3 text-right font-mono text-[13px] tabular-nums'
  return (
    <Panel className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse">
        <thead className="border-b border-zinc-200/80 dark:border-zinc-800/80">
          <tr>
            <th scope="col" className={th}>Asignatura</th>
            <th scope="col" className={`${th} text-right`}>Intentos</th>
            <th scope="col" className={`${th} text-right`}>Último</th>
            <th scope="col" className={`${th} text-right`}>Promedio</th>
            <th scope="col" className={`${th} text-right`}>Mejor</th>
            <th scope="col" className={`${th} text-right`} title="Último puntaje menos tu promedio">Vs. promedio</th>
            <th scope="col" className={`${th} w-[28%]`}>Escala 100–1000</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
          {rows.map((r) => (
            <tr key={r.id}>
              <th scope="row" className="px-4 py-3 text-left text-[13px] font-medium">{SUBJECTS[r.id].short}</th>
              <td className={`${num} text-zinc-500 dark:text-zinc-400`}>{r.attempts}</td>
              <td className={`${num} font-semibold`}>
                <Link to={`/resultados/${r.latestId}`} className="hover:underline" title="Ver el último resultado">{r.last}</Link>
              </td>
              <td className={num}>{r.avg}</td>
              <td className={num}>{r.best}</td>
              <td className={`${num} text-zinc-500 dark:text-zinc-400`}>{r.attempts > 1 ? signed(r.last - r.avg) : '–'}</td>
              <td className="px-4 py-3">
                <div
                  className="relative h-4"
                  role="img"
                  aria-label={`Último puntaje ${r.last} y promedio ${r.avg} en la escala de 100 a 1000`}
                >
                  <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800">
                    <div className="h-full rounded-full bg-progress" style={{ width: `${scaleRatio(r.last) * 100}%` }} />
                  </div>
                  <span
                    aria-hidden
                    className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-zinc-500 dark:bg-zinc-400"
                    style={{ left: `${scaleRatio(r.avg) * 100}%` }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-zinc-200/80 px-4 py-2.5 text-[11.5px] text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
        La barra muestra el último puntaje; la marca vertical, tu promedio.
      </p>
    </Panel>
  )
}
