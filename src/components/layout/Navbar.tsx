import { NavLink } from 'react-router-dom'
import { Logo } from './Logo'
import { NAV_ITEMS, navLinkClass } from './nav'
import { ThemeToggle } from './ThemeToggle'

/** Barra superior para pantallas angostas (la barra lateral se oculta bajo `lg`). */
export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-[#FAFAFA]/90 backdrop-blur lg:hidden dark:border-zinc-800/80 dark:bg-[#09090B]/90">
      <div className="flex h-12 items-center justify-between px-4">
        <Logo />
        <ThemeToggle />
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Principal">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
