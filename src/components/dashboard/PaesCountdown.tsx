import { LoadBar } from '@/components/ui/load-bar'
import { usePaesCountdown } from '@/hooks/usePaesCountdown'

const dateFmt = new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const two = (n: number) => String(n).padStart(2, '0')

function Unit({ value, label }: { value: string | number; label: string }) {
  return (
    <span className="flex flex-col">
      <span className="text-[38px] leading-none font-semibold tracking-[-0.03em] text-accent">{value}</span>
      <span className="mt-1.5 text-[11.5px] text-zinc-500 dark:text-zinc-400">{label}</span>
    </span>
  )
}

/** Cuenta regresiva de la ventana del Inicio: días, horas y minutos a la próxima PAES y cuánto llevas de la recta final. */
export function PaesCountdown() {
  const { date, days, hours, minutes, progress } = usePaesCountdown()
  const percent = Math.round(progress * 100)
  return (
    <div
      role="timer"
      aria-label={`Faltan ${days} días, ${hours} horas y ${minutes} minutos para la ${date.name}`}
      className="min-w-0 border-b border-zinc-200/80 pb-5 font-mono tabular-nums @[1300px]:max-w-[22rem] @[1300px]:flex-1 @[1300px]:border-b-0 @[1300px]:pb-0 dark:border-zinc-800/80"
    >
      <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-[12.5px]">
        <span className="text-zinc-900 dark:text-zinc-100">{date.name}</span>
        <span className="text-zinc-500 dark:text-zinc-400">
          {date.estimated ? `fecha estimada, ${dateFmt.format(date.at)}` : dateFmt.format(date.at)}
        </span>
      </p>
      <div aria-hidden className="mt-3 flex items-start gap-2">
        <Unit value={days} label="días" />
        <span className="text-[30px] leading-[38px] text-zinc-400 dark:text-zinc-600">:</span>
        <Unit value={two(hours)} label="horas" />
        <span className="text-[30px] leading-[38px] text-zinc-400 dark:text-zinc-600">:</span>
        <Unit value={two(minutes)} label="min" />
      </div>
      <div className="mt-3 flex items-center gap-2.5 text-[11.5px] text-zinc-500 dark:text-zinc-400">
        <LoadBar value={progress} segments={20} className="min-w-0 flex-1" />
        <span className="whitespace-nowrap">recta final {percent} %</span>
      </div>
    </div>
  )
}
