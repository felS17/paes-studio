import { cn } from '@/lib/utils'
import type { QuestionResult } from '@/types/analytics'
import { formatClock, plural } from '@/utils/format'
import { toxicIndex, type CadenceQuadrant, type CadenceSummary, type ChangeBalance } from '@/utils/telemetry'

/** Lado izquierdo: resolver rápido. Lado derecho: costo de tiempo o de decisión. Arriba, aciertos; abajo, riesgo. */
const QUADRANTS: { key: CadenceQuadrant; title: string; rule: string; mark: string }[] = [
  {
    key: 'fluido',
    title: 'Dominio Fluido',
    rule: 'Aciertos en menos de 1:30 y sin cambiar de alternativa.',
    mark: 'bg-emerald-500 dark:bg-emerald-400',
  },
  {
    key: 'fuga',
    title: 'Fugas de Tiempo',
    rule: 'Aciertos que tomaron más de 2:30: cuello de botella de cálculo o de lectura.',
    mark: 'bg-amber-500 dark:bg-amber-400',
  },
  {
    key: 'ciego',
    title: 'Puntos Ciegos Impulsivos',
    rule: 'Errores en menos de 35 s y sin tachar distractores: lectura apresurada o exceso de confianza.',
    mark: 'bg-rose-500 dark:bg-rose-400',
  },
  {
    key: 'indecision',
    title: 'Trampas de Indecisión',
    rule: 'Dos o más cambios de alternativa en la misma pregunta: sobre-pensamiento.',
    mark: 'bg-amber-500 dark:bg-amber-400',
  },
]

const MAX_CHIPS = 14

function QuestionChips({ questions, onPick }: { questions: QuestionResult[]; onPick: (id: string) => void }) {
  if (!questions.length) return null
  const shown = questions.slice(0, MAX_CHIPS)
  return (
    <ul className="mt-3 flex flex-wrap gap-1" aria-label="Preguntas de este cuadrante">
      {shown.map((q) => (
        <li key={q.id}>
          <button
            type="button"
            onClick={() => onPick(q.id)}
            title={`Revisar la pregunta ${q.number}`}
            className="flex h-6 min-w-6 items-center justify-center rounded border border-zinc-200 bg-zinc-50 px-1 font-mono text-[11px] text-zinc-600 tabular-nums transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:text-zinc-100"
          >
            {q.number}
          </button>
        </li>
      ))}
      {questions.length > MAX_CHIPS && (
        <li className="flex h-6 items-center px-1 font-mono text-[11px] text-zinc-500 tabular-nums dark:text-zinc-400">+{questions.length - MAX_CHIPS}</li>
      )}
    </ul>
  )
}

/** Tres tramos con separación y cifra propia: emerald y rose se confunden con daltonismo, el color nunca va solo. */
function BalanceBar({ balance }: { balance: ChangeBalance }) {
  const total = balance.toxic + balance.corrective + balance.neutral
  if (!total) return <div className="h-2 rounded-sm bg-zinc-200 dark:bg-zinc-800" aria-hidden />
  const parts = [
    { n: balance.corrective, cls: 'bg-emerald-400 dark:bg-emerald-300' },
    { n: balance.neutral, cls: 'bg-zinc-300 dark:bg-zinc-600' },
    { n: balance.toxic, cls: 'bg-rose-700 dark:bg-rose-600' },
  ].filter((p) => p.n > 0)
  return (
    <div className="flex h-2 gap-0.5" aria-hidden>
      {parts.map((p, i) => (
        <span key={i} className={cn('rounded-sm', p.cls)} style={{ flexGrow: p.n, flexBasis: 0 }} />
      ))}
    </div>
  )
}

function readingOf(b: ChangeBalance): string {
  if (!b.toxic && !b.corrective) {
    return b.neutral ? 'Tus cambios no alteraron el resultado: pasaste de una alternativa incorrecta a otra.' : 'No cambiaste ninguna respuesta en estas preguntas.'
  }
  if (b.toxic > b.corrective) return 'Cambiar de alternativa te ha costado más de lo que te ha dado. Cambia solo si encuentras un error concreto en tu primera opción.'
  if (b.corrective > b.toxic) return 'Tus cambios suman: al revisar corriges más errores de los que introduces.'
  return 'Tus cambios se compensan: ganas lo mismo que pierdes al revisar.'
}

export function ToxicDoubt({ balance }: { balance: ChangeBalance }) {
  const index = toxicIndex(balance)
  const legend = [
    { label: 'Corrigieron un error', n: balance.corrective, cls: 'bg-emerald-400 dark:bg-emerald-300' },
    { label: 'Entre incorrectas', n: balance.neutral, cls: 'bg-zinc-300 dark:bg-zinc-600' },
    { label: 'Dejaron la correcta por una incorrecta', n: balance.toxic, cls: 'bg-rose-700 dark:bg-rose-600' },
  ]
  return (
    <section aria-label="Índice de Duda Tóxica" className="grid gap-5 bg-white p-4 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:p-5 dark:bg-[#121215]">
      <div>
        <h3 className="text-[13px] font-medium">Índice de Duda Tóxica</h3>
        <p className="mt-1.5 font-mono text-[30px] leading-none font-semibold tracking-tight tabular-nums">
          {index === null ? '—' : `${Math.round(index * 100)} %`}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">De los cambios que alteraron el resultado, los que te quitaron un acierto.</p>
      </div>
      <div className="min-w-0">
        <BalanceBar balance={balance} />
        <dl className="mt-3 space-y-1.5 text-[12.5px]">
          {legend.map((l) => (
            <div key={l.label} className="flex items-center gap-2">
              <span aria-hidden className={cn('size-2 shrink-0 rounded-[2px]', l.cls)} />
              <dt className="min-w-0 flex-1 text-zinc-600 dark:text-zinc-400">{l.label}</dt>
              <dd className="font-mono font-medium tabular-nums">{l.n}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[12.5px] leading-relaxed text-zinc-700 dark:text-zinc-300">{readingOf(balance)}</p>
      </div>
    </section>
  )
}

/**
 * Matriz de Ritmo y Decisión: posición con significado (rápido a la izquierda, costoso a la derecha; aciertos
 * arriba, riesgo abajo) y una sola cifra grande por cuadrante.
 */
export function CadenceMatrix({ summary, onPick }: { summary: CadenceSummary; onPick?: (questionId: string) => void }) {
  const { measured, outside, quadrants } = summary
  return (
    <div>
      <div className="grid gap-px overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-200/80 sm:grid-cols-2 dark:border-zinc-800/80 dark:bg-zinc-800/80">
        {QUADRANTS.map(({ key, title, rule, mark }) => {
          const q = quadrants[key]
          const share = measured ? q.count / measured : 0
          return (
            <section key={key} aria-label={title} className="min-w-0 bg-white p-4 sm:p-5 dark:bg-[#121215]">
              <h3 className="text-[13px] font-medium">{title}</h3>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-[30px] leading-none font-semibold tracking-tight tabular-nums">{q.count}</span>
                <span className="font-mono text-xs text-zinc-500 tabular-nums dark:text-zinc-400">{Math.round(share * 100)} %</span>
                {q.count > 0 && (
                  <span className="ml-auto font-mono text-xs text-zinc-500 tabular-nums dark:text-zinc-400" title="Tiempo promedio por pregunta">{formatClock(q.avgMs)}</span>
                )}
              </p>
              <div aria-hidden className="mt-2.5 h-1 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800">
                <div className={cn('h-full rounded-full', mark)} style={{ width: `${share * 100}%` }} />
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{rule}</p>
              {onPick && <QuestionChips questions={q.questions} onPick={onPick} />}
            </section>
          )
        })}
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        <span className="font-mono tabular-nums">{plural(measured, 'pregunta respondida', 'preguntas respondidas')}</span> con tiempo medido
        {outside > 0 && <>; <span className="font-mono tabular-nums">{outside}</span> no {outside === 1 ? 'calza' : 'calzan'} con ningún cuadrante (ritmo intermedio o un solo cambio)</>}.
        {' '}Si una pregunta cumple dos reglas, cuenta como indecisión. En Lectora, la primera pregunta de cada texto incluye el tiempo de leerlo.
      </p>
    </div>
  )
}
