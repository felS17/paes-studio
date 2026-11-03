import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Panel } from '@/components/ui/panel'
import { EXAMS_BY_ID } from '@/data/catalog'
import { SUBTOPIC_OF_QUESTION, SUBTOPICS_BY_ID } from '@/data/temario'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { sessionKey, useExamStore } from '@/store/useExamStore'
import { useStreakStore } from '@/store/useStreakStore'
import { dailyDraft, dailyPicks, dailySetId, localDateKey } from '@/utils/daily'
import { isActiveDay, lastDays, streakSummary } from '@/utils/streak'

const longDate = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDate = new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })
const parseKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** Últimos 14 días: cada celda es un día; llena si completaste el desafío o repasaste flashcards. */
function ActivityStrip({ today, days }: { today: string; days: ReturnType<typeof useStreakStore.getState>['days'] }) {
  const keys = lastDays(today, 14)
  return (
    <ol className="flex items-center gap-1" aria-label="Actividad de los últimos 14 días">
      {keys.map((key) => {
        const day = days[key]
        const active = isActiveDay(day)
        const parts = [day?.challenge && 'desafío completado', (day?.flashcards ?? 0) > 0 && `${day!.flashcards} flashcards`].filter(Boolean)
        const label = `${shortDate.format(parseKey(key))}: ${active ? parts.join(' y ') : 'sin actividad'}`
        return (
          <li
            key={key}
            title={label}
            aria-label={label}
            className={cn(
              'size-2.5 rounded-[3px]',
              active ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-200 dark:bg-zinc-800',
              key === today && 'ring-1 ring-zinc-900 ring-offset-2 ring-offset-white dark:ring-zinc-100 dark:ring-offset-[#121215]',
            )}
          />
        )
      })}
    </ol>
  )
}

/**
 * Desafío Diario: 3 preguntas elegidas con un hash de la fecha local (las mismas para todos, todo el día) y la
 * racha de días seguidos con desafío completado o flashcards repasadas.
 */
export function DailyChallenge() {
  const navigate = useNavigate()
  const [today] = useState(() => localDateKey())
  const setId = dailySetId(today)
  const picks = useMemo(() => dailyPicks(today), [today])
  const ensureSet = useExamStore((s) => s.ensureSet)
  const session = useExamStore((s) => s.sessions[sessionKey(setId, 'practica')])
  const attempts = useAnalyticsStore((s) => s.attempts)
  const days = useStreakStore((s) => s.days)
  const streak = streakSummary(days, today)
  const done = Boolean(days[today]?.challenge)
  const attempt = [...attempts].reverse().find((a) => a.examId === setId)
  const results = new Map(attempt?.questions.map((q) => [q.id, q]))

  const start = () => {
    ensureSet(setId, dailyDraft(today))
    navigate(`/ensayo/${setId}?modo=practica`)
  }
  const answeredNow = session ? Object.keys(session.answers).length : 0

  return (
    <Panel aria-labelledby="desafio-diario">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 px-5 pt-4 sm:px-6">
        <div className="min-w-0">
          <h2 id="desafio-diario" className="text-[15px] leading-tight font-semibold tracking-tight">Desafío Diario</h2>
          <p className="mt-1 text-[13px] text-zinc-500 first-letter:uppercase dark:text-zinc-400">
            {longDate.format(parseKey(today))}. Tres preguntas con solución paso a paso; cambian a medianoche.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Racha actual</p>
          <p className="font-mono text-[22px] leading-tight font-semibold tabular-nums" aria-live="polite">
            {streak.current}
            <span className="ml-1 font-sans text-[13px] font-normal text-zinc-500 dark:text-zinc-400">
              {streak.current === 1 ? 'día' : 'días'}
            </span>
          </p>
        </div>
      </div>

      <ol className="mt-3 grid grid-cols-1 border-t border-zinc-200/80 sm:grid-cols-3 sm:divide-x dark:border-zinc-800/80 sm:divide-zinc-200/80 sm:dark:divide-zinc-800/80">
        {picks.map((pick, i) => {
          const meta = EXAMS_BY_ID.get(pick.examId)
          const sub = SUBTOPICS_BY_ID.get(SUBTOPIC_OF_QUESTION.get(pick.questionId) ?? '')
          const r = results.get(pick.questionId)
          return (
            <li key={pick.questionId} className="flex min-w-0 items-start gap-3 border-b border-zinc-200/80 px-5 py-3 last:border-b-0 sm:border-b-0 sm:px-6 dark:border-zinc-800/80">
              <span className="mt-px font-mono text-[11px] text-zinc-400 tabular-nums dark:text-zinc-500">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">{pick.slot.label}</p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400" title={sub?.title}>
                  {sub?.title ?? meta?.title}
                </p>
              </div>
              {r && r.selected !== null && (
                <span
                  className={cn(
                    'mt-px flex items-center gap-1 text-xs font-medium',
                    r.isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400',
                  )}
                >
                  {r.isCorrect ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                  {r.isCorrect ? 'Correcta' : 'Incorrecta'}
                </span>
              )}
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200/80 px-5 py-3 sm:px-6 dark:border-zinc-800/80">
        <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <ActivityStrip today={today} days={days} />
          <span className="hidden sm:inline">
            {streak.activeToday ? 'Hoy ya cuenta para tu racha.' : 'Completa el desafío o repasa flashcards para sumar hoy.'}
            {streak.best > streak.current && (
              <> Mejor racha: <span className="font-mono tabular-nums">{streak.best}</span>.</>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {attempt && (
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/resultados/${attempt.id}`}>Ver resultado</Link>
            </Button>
          )}
          {session ? (
            <Button variant="primary" size="sm" onClick={start}>
              Continuar <span className="font-mono tabular-nums">{answeredNow}/{picks.length}</span>
            </Button>
          ) : done ? (
            <span className="text-[13px] font-medium">Desafío completado</span>
          ) : (
            <Button variant="primary" size="sm" onClick={start} disabled={!picks.length}>
              {attempt ? 'Completar desafío' : 'Empezar desafío'}
            </Button>
          )}
        </div>
      </div>
    </Panel>
  )
}
