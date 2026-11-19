import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ManimEmbed } from '@/components/manim/ManimEmbed'
import { MathText } from '@/components/math/MathText'
import { Button } from '@/components/ui/button'
import { SearchInput } from '@/components/ui/search-input'
import { Segmented } from '@/components/ui/segmented'
import { CHEAT_CARDS, cheatCardsFor, SHEETS } from '@/data/cheatsheets'
import { cn } from '@/lib/utils'
import type { CheatCard, SheetId } from '@/types/cheatsheets'
import { matchesTerms, normalizeText, queryTerms } from '@/utils/topicSearch'

type SheetFilter = SheetId | 'todas'

/** Si el título de la tarjeta coincide se muestra entera; si no, solo las filas que coinciden. */
function searchCards(cards: CheatCard[], terms: string[]): CheatCard[] {
  if (!terms.length) return cards
  return cards.flatMap((card) => {
    if (matchesTerms(normalizeText(`${card.title} ${card.axis}`), terms)) return [card]
    const rows = card.rows.filter(([label, value]) => matchesTerms(normalizeText(`${label} ${value} ${card.title}`), terms))
    return rows.length ? [{ ...card, rows }] : []
  })
}

function CheatCardView({ card, showAxis }: { card: CheatCard; showAxis: boolean }) {
  return (
    <article className="@container rounded-lg border border-zinc-200/80 bg-surface dark:border-zinc-800/80">
      <header className="flex items-baseline justify-between gap-3 border-b border-zinc-200/80 px-3 py-2 dark:border-zinc-800/80">
        <h4 className="text-[13px] font-semibold tracking-tight">{card.title}</h4>
        {showAxis && <span className="shrink-0 truncate text-[11px] text-zinc-500 dark:text-zinc-400">{card.axis}</span>}
      </header>
      <dl className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
        {card.rows.map(([label, value]) => (
          <div key={label} className="grid gap-x-3 gap-y-0.5 px-3 py-1.5 @sm:grid-cols-[7.5rem_minmax(0,1fr)] @sm:items-baseline">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400"><MathText text={label} inline /></dt>
            <dd className="min-w-0 overflow-x-auto text-[13.5px] leading-relaxed"><MathText text={value} inline /></dd>
          </div>
        ))}
      </dl>
      <ManimEmbed subtopics={card.subtopics} className="border-t border-zinc-200/60 px-3 py-2 dark:border-zinc-800/60" />
    </article>
  )
}

/** Columnas según el ancho del contenedor (no de la ventana: el resumen lateral es angosto). */
function columnsFor(width: number): number {
  if (width >= 1040) return 3
  if (width >= 620) return 2
  return 1
}

/** Altura aproximada de una tarjeta antes de medirla: título más filas, que crecen con el largo del texto. */
function estimate(card: CheatCard): number {
  return 40 + card.rows.reduce((h, [label, value]) => h + 30 + Math.floor((label.length + value.length) / 70) * 20, 0)
}

/**
 * Reparte por altura: de la tarjeta más alta a la más baja, cada una va a la columna más corta, y dentro de cada
 * columna se recupera el orden original. Así las columnas terminan casi parejas y se siguen leyendo de arriba abajo.
 */
function distribute(heights: number[], cols: number): number[][] {
  const columns: number[][] = Array.from({ length: cols }, () => [])
  const filled = new Array<number>(cols).fill(0)
  const byHeight = heights.map((h, i) => [h, i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1])
  for (const [h, i] of byHeight) {
    const col = filled.indexOf(Math.min(...filled))
    columns[col].push(i)
    filled[col] += h + 12
  }
  return columns.map((c) => c.sort((a, b) => a - b))
}

/**
 * Masonry: las tarjetas se reparten por altura en columnas independientes. Se mide antes de pintar
 * (`useLayoutEffect`) y solo al cambiar las tarjetas o el número de columnas, así que no salta al cargar
 * las fórmulas ni al abrir una animación dentro de una tarjeta.
 */
function CardMasonry({ cards }: { cards: CheatCard[] }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef(new Map<string, HTMLElement>())
  const [cols, setCols] = useState(1)
  const [order, setOrder] = useState<{ key: string; columns: number[][] } | null>(null)
  const key = `${cols}:${cards.map((c) => `${c.id}.${c.rows.length}`).join(',')}`

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const update = () => setCols(columnsFor(el.getBoundingClientRect().width))
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Con la estimación ya pintada en columnas del ancho real, se mide cada tarjeta y se reparte de nuevo.
  useLayoutEffect(() => {
    if (cols === 1 || order?.key === key) return
    const heights = cards.map((c) => itemRefs.current.get(c.id)?.offsetHeight ?? estimate(c))
    setOrder({ key, columns: distribute(heights, cols) })
  }, [cards, cols, key, order?.key])

  const columns = cols === 1
    ? [cards.map((_, i) => i)]
    : order?.key === key ? order.columns : distribute(cards.map(estimate), cols)
  const showAxis = new Set(cards.map((c) => c.axis)).size > 1

  return (
    <div ref={rootRef} className="grid items-start gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {columns.map((idx, c) => (
        <div key={c} className="flex min-w-0 flex-col gap-3">
          {idx.map((i) => {
            const card = cards[i]
            return (
              <div
                key={card.id}
                ref={(node) => {
                  if (node) itemRefs.current.set(card.id, node)
                  else itemRefs.current.delete(card.id)
                }}
              >
                <CheatCardView card={card} showAxis={showAxis} />
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/** Formulario Express: fórmulas, leyes y propiedades de cada materia, con filtro y buscador. */
export function CheatSheets() {
  const [sheet, setSheet] = useState<SheetFilter>('m1')
  const [query, setQuery] = useState('')
  const terms = useMemo(() => queryTerms(query), [query])
  const found = useMemo(
    () => searchCards(sheet === 'todas' ? CHEAT_CARDS : CHEAT_CARDS.filter((c) => c.sheet === sheet), terms),
    [sheet, terms],
  )
  const groups = SHEETS.map((s) => ({ ...s, cards: found.filter((c) => c.sheet === s.id) })).filter((g) => g.cards.length)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Segmented<SheetFilter>
          label="Filtrar por materia"
          className="max-w-full overflow-x-auto"
          value={sheet}
          onChange={setSheet}
          options={[...SHEETS.map((s) => ({ value: s.id as SheetFilter, label: s.label })), { value: 'todas', label: 'Todas' }]}
        />
        <SearchInput value={query} onChange={setQuery} placeholder="buscar fórmula o concepto" label="Buscar fórmula o concepto" className="min-w-48 flex-1" />
      </div>

      {groups.length ? (
        groups.map((g) => (
          <section key={g.id} aria-label={g.label} className="space-y-2">
            {groups.length > 1 && <h2 className="px-1 text-[15px] font-semibold tracking-tight">{g.label}</h2>}
            <CardMasonry cards={g.cards} />
          </section>
        ))
      ) : (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-zinc-300/80 px-5 py-6 dark:border-zinc-700/80">
          <p className="text-[13px] font-medium">No encontramos «{query.trim()}» en esta materia</p>
          {sheet !== 'todas' && <Button size="sm" onClick={() => setSheet('todas')}>Buscar en todas las materias</Button>}
        </div>
      )}
    </div>
  )
}

/** Formulario del tema abierto en el Inspector: solo las tarjetas que le corresponden. */
export function TopicCheatCards({ subtopicIds }: { subtopicIds: string[] }) {
  const cards = useMemo(() => cheatCardsFor(subtopicIds), [subtopicIds])
  const [query, setQuery] = useState('')
  const terms = useMemo(() => queryTerms(query), [query])
  const found = useMemo(() => searchCards(cards, terms), [cards, terms])
  return (
    <div className="space-y-3 px-4 py-4">
      {cards.length > 2 && (
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar fórmula o concepto..." label="Buscar fórmula o concepto" />
      )}
      {found.length ? (
        <CardMasonry cards={found} />
      ) : (
        <p className={cn('text-[13px] text-zinc-500 dark:text-zinc-400')}>
          {cards.length ? `No encontramos «${query.trim()}» en este tema.` : 'Este tema aún no tiene formulario.'}
        </p>
      )}
      <Link to="/material?vista=formulario" className="inline-block text-xs text-zinc-500 underline-offset-4 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100">
        Ver el Formulario Express completo
      </Link>
    </div>
  )
}
