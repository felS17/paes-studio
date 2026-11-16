import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Tabs } from '@/components/ui/tabs'
import { BRING, SCHEDULE_NOTES, STRATEGY, TEST_DAY_REVIEWED, TEST_DAY_SOURCES, TEST_DAYS, type TestSlot } from '@/data/testDay'
import { formatMinutes } from '@/utils/format'

type View = 'horarios' | 'llevar' | 'estrategia'
const VIEWS: View[] = ['horarios', 'llevar', 'estrategia']

const dayFmt = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const LIST = 'divide-y divide-zinc-200/80 border-y border-zinc-200/80 dark:divide-zinc-800/80 dark:border-zinc-800/80'
const HEADING = 'mb-1.5 font-mono text-[12px] text-zinc-500 dark:text-zinc-400'

/** 140 min en 65 preguntas → «2:09». */
function pace(slot: TestSlot): string {
  const seconds = Math.round(((slot.minutes ?? 0) * 60) / (slot.questions ?? 1))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function Source({ view }: { view: View }) {
  const source = TEST_DAY_SOURCES[view]
  return (
    <p className="mt-4 text-[12px] text-zinc-500 dark:text-zinc-400">
      fuente:{' '}
      <a href={source.href} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
        {source.label}
      </a>
      , revisada el {TEST_DAY_REVIEWED}.
    </p>
  )
}

function Lines({ items, label }: { items: string[]; label: string }) {
  return (
    <ul className={LIST} aria-label={label}>
      {items.map((item) => (
        <li key={item} className="py-2.5 text-[13.5px] leading-snug">{item}</li>
      ))}
    </ul>
  )
}

function Schedule() {
  return (
    <div className="space-y-6">
      {TEST_DAYS.map((day) => (
        <section key={day.date}>
          <h2 className={HEADING}>{dayFmt.format(new Date(`${day.date}T12:00:00Z`))}</h2>
          <ul className={LIST}>
            {day.slots.map((slot) => (
              <li key={slot.time} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2.5 text-[13.5px]">
                <span className="w-[6.5rem] shrink-0 font-mono text-[13px] tabular-nums">{slot.time}</span>
                <span className="min-w-0 flex-1 font-medium">{slot.name}</span>
                {slot.questions && slot.minutes && (
                  <span
                    className="w-full font-mono text-[12px] text-zinc-500 tabular-nums sm:w-auto dark:text-zinc-400"
                    title={`${slot.scored} de las ${slot.questions} preguntas cuentan para el puntaje`}
                  >
                    {slot.questions} preguntas en {formatMinutes(slot.minutes)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Lines items={SCHEDULE_NOTES} label="A tener en cuenta" />
    </div>
  )
}

function Bring() {
  return (
    <div className="space-y-6">
      {BRING.map((group) => (
        <section key={group.title}>
          <h2 className={HEADING}>{group.title}</h2>
          <Lines items={group.items} label={group.title} />
        </section>
      ))}
    </div>
  )
}

function Strategy() {
  const tests = TEST_DAYS.flatMap((d) => d.slots).filter((s) => s.subject)
  return (
    <div className="space-y-6">
      <Lines items={STRATEGY} label="Estrategia" />
      <section>
        <h2 className={HEADING} title="El tiempo oficial de cada prueba repartido entre sus preguntas">tiempo por pregunta</h2>
        <ul className={LIST}>
          {tests.map((slot) => (
            <li key={slot.subject} className="flex items-baseline gap-3 py-2.5 text-[13.5px]">
              <span className="min-w-0 flex-1">{slot.name}</span>
              <span className="font-mono text-[13px] tabular-nums" title={`${slot.questions} preguntas en ${formatMinutes(slot.minutes ?? 0)}`}>{pace(slot)} min</span>
              <span className="hidden w-40 text-right font-mono text-[12px] text-zinc-500 tabular-nums sm:inline dark:text-zinc-400">{slot.scored} de {slot.questions} dan puntaje</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/** Día de la prueba (`/dia-prueba`): horarios, qué llevar y estrategia, solo con lo que publica el DEMRE. */
export function TestDayPage() {
  const [params, setParams] = useSearchParams()
  const requested = params.get('vista') as View | null
  const view: View = requested && VIEWS.includes(requested) ? requested : 'horarios'
  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="día de la prueba"
        actions={<Button asChild size="sm"><Link to="/ensayos" title="Practica con el mismo tiempo de la prueba real">ensayo con reloj</Link></Button>}
      />
      <Tabs<View>
        label="Día de la prueba"
        value={view}
        onChange={(v) => setParams(v === 'horarios' ? {} : { vista: v }, { replace: true })}
        items={[
          { value: 'horarios', label: 'horarios' },
          { value: 'llevar', label: 'qué llevar' },
          { value: 'estrategia', label: 'estrategia' },
        ]}
      >
        {view === 'horarios' && <Schedule />}
        {view === 'llevar' && <Bring />}
        {view === 'estrategia' && <Strategy />}
        <Source view={view} />
      </Tabs>
    </div>
  )
}
