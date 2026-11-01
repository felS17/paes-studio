import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/** Marca: una regla de medición con un punto en la escala (la escala PAES 100–1000). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('size-6', className)}>
      <rect width="32" height="32" rx="7" className="fill-zinc-900 dark:fill-zinc-100" />
      <g className="stroke-white dark:stroke-zinc-900" strokeWidth="1.6" strokeLinecap="round">
        <path d="M7 22.5h18" />
        <path d="M9 22.5v-4M13 22.5v-2.5M17 22.5v-6M21 22.5v-2.5M25 22.5v-4" />
      </g>
      <circle cx="17" cy="11" r="2.6" className="fill-white dark:fill-zinc-900" />
    </svg>
  )
}

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 rounded-md text-[14px] font-semibold tracking-tight">
      <LogoMark />
      PAES Studio
    </Link>
  )
}
