import { cn } from '@/lib/utils'
import type { QuestionResult } from '@/types/analytics'
import { formatClock, plural } from '@/utils/format'
import { toxicIndex, type CadenceQuadrant, type CadenceSummary, type ChangeBalance } from '@/utils/telemetry'

/** Izquierda: resolver rápido. Derecha: costo de tiempo o de decisión. Arriba, aciertos; abajo, riesgo. */
const PROFILES: { key: CadenceQuadrant; title: string; rule: string; mark: string }[] = [
  {
    key: 'fluido',
    title: 'Respuestas seguras',
    rule: 'Las sacaste buenas en menos de un minuto y medio, sin dudar.',
    mark: 'bg-emerald-500 dark:bg-emerald-400',
  },
  {
    key: 'fuga',
    title: 'Preguntas que te quitaron mucho tiempo',
    rule: 'Las sacaste buenas, pero te tomaron más de 2 minutos y medio. Practicarlas te deja más tiempo para el resto de la prueba.',
    mark: 'bg-amber-500 dark:bg-amber-400',
  },
  {
    key: 'ciego',
    title: 'Errores por apuro',
    rule: 'Las fallaste en menos de 35 segundos y sin descartar alternativas. Leerlas con más calma puede darte puntos fáciles.',
    mark: 'bg-rose-500 dark:bg-rose-400',
  },
  {
    key: 'indecision',
    title: 'Dudas de último minuto',
    rule: '',
    mark: 'bg-amber-500 dark:bg-amber-400',
  },
]

const MAX_CHIPS = 14
const CORRECTIVE = 'bg-emerald-400 dark:bg-emerald-300'
const NEUTRAL = 'bg-zinc-300 dark:bg-zinc-600'
const TOXIC = 'bg-rose-700 dark:bg-rose-600'

function QuestionChips({ questions, onPick }: { questions: QuestionResult[]; onPick: (id: string) => void }) {
  if (!questions.length) return null
  const shown = questions.slice(0, MAX_CHIPS)
  return (
    <ul className="mt-3 flex flex-wrap gap-1" aria-label="Preguntas de este perfil">
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
    { n: balance.corrective, cls: CORRECTIVE },
    { n: balance.neutral, cls: NEUTRAL },
    { n: balance.toxic, cls: TOXIC },
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
    return b.neutral ? 'Tus cambios no movieron el resultado: pasaste de una alternativa mala a otra.' : 'No cambiaste ninguna respuesta. Vas con lo primero que eliges.'
  }
  if (b.toxic > b.corrective) return 'Cambiar te ha costado más de lo que te ha dado. Confía en tu primera opción y cámbiala solo si encuentras un error concreto.'
  if (b.corrective > b.toxic) return 'Revisar te está funcionando: cuando cambias, rescatas más puntos de los que pierdes.'
  return 'Tus cambios se compensan: ganas lo mismo que pierdes al revisar.'
}

export function ToxicDoubt({ balance }: { balance: ChangeBalance }) {
  const index = toxicIndex(balance)
  const legend = [
    { label: 'Te salvaron (de mala a buena)', n: balance.corrective, cls: CORRECTIVE },
    { label: 'No cambiaron nada (de mala a mala)', n: balance.neutral, cls: NEUTRAL },
    { label: 'Te costaron un acierto (de buena a mala)', n: balance.toxic, cls: TOXIC },
  ]
  return (
    <section aria-label="Cuando cambias de respuesta" className="grid gap-5 bg-white p-4 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:p-5 dark:bg-[#121215]">
      <div>
        <h3 className="text-[13px] font-medium">Cuando cambias de respuesta</h3>
        <p className="mt-1.5 font-mono text-[30px] leading-none font-semibold tracking-tight tabular-nums">
          {index === null ? '—' : `${Math.round(index * 100)} %`}
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {index === null ? 'Aún no hay cambios que movieran tu resultado.' : 'de las veces que cambiar movió tu resultado, te quitó un acierto.'}
        </p>
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
 * Los 4 perfiles de respuesta, con posición significativa: rápido a la izquierda, costoso a la derecha; aciertos
 * arriba, riesgo abajo. En «Dudas de último minuto» la cifra grande es lo que más duele: aciertos perdidos por dudar.
 */
export function CadenceMatrix({ summary, onPick }: { summary: CadenceSummary; onPick?: (questionId: string) => void }) {
  const { measured, outside, quadrants, balance } = summary
  return (
    <div>
      <div className="grid gap-px overflow-hidden rounded-lg border border-zinc-200/80 bg-zinc-200/80 sm:grid-cols-2 dark:border-zinc-800/80 dark:bg-zinc-800/80">
        {PROFILES.map(({ key, title, rule, mark }) => {
          const q = quadrants[key]
          const doubts = key === 'indecision'
          const share = measured ? q.count / measured : 0
          return (
            <section key={key} aria-label={title} className="min-w-0 bg-white p-4 sm:p-5 dark:bg-[#121215]">
              <h3 className="text-[13px] font-medium">{title}</h3>
              <p className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-[30px] leading-none font-semibold tracking-tight tabular-nums">{doubts ? balance.toxic : q.count}</span>
                {!doubts && <span className="font-mono text-xs text-zinc-500 tabular-nums dark:text-zinc-400">{Math.round(share * 100)} %</span>}
                {doubts && <span className="text-xs text-zinc-500 dark:text-zinc-400">{balance.toxic === 1 ? 'vez perdiste un acierto' : 'veces perdiste un acierto'}</span>}
                {!doubts && q.count > 0 && (
                  <span className="ml-auto font-mono text-xs text-zinc-500 tabular-nums dark:text-zinc-400" title="Tiempo promedio por pregunta">{formatClock(q.avgMs)}</span>
                )}
              </p>
              <div aria-hidden className="mt-2.5 h-1 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-zinc-800">
                <div className={cn('h-full rounded-full', mark)} style={{ width: `${share * 100}%` }} />
              </div>
              {doubts ? (
                <p className="mt-2.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                  Tenías marcada la correcta y la cambiaste por una mala. Cambiar te salvó{' '}
                  <span className="font-mono font-medium text-zinc-900 tabular-nums dark:text-zinc-100">{balance.corrective}</span>{' '}
                  {balance.corrective === 1 ? 'vez' : 'veces'}. Cambiaste de alternativa en{' '}
                  {plural(q.count, 'pregunta')}.
                </p>
              ) : (
                <p className="mt-2.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{rule}</p>
              )}
              {onPick && <QuestionChips questions={q.questions} onPick={onPick} />}
            </section>
          )
        })}
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        Miramos {plural(measured, 'pregunta respondida', 'preguntas respondidas')}
        {outside > 0 && <>; {outside === 1 ? 'una no calza' : `${outside} no calzan`} con ningún perfil (buen ritmo sin ser tan rápido, o errores donde te tomaste tu tiempo)</>}.
        {' '}Si cambiaste de alternativa, la pregunta cuenta como duda aunque también te haya tomado tiempo. En Lectora, la primera pregunta de cada texto incluye lo que tardaste en leerlo.
      </p>
    </div>
  )
}
