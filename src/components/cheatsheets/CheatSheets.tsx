import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

function CheatCardView({ card }: { card: CheatCard }) {
  return (
    <article className="@container mb-3 break-inside-avoid rounded-lg border border-zinc-200/80 bg-surface dark:border-zinc-800/80">
      <h4 className="border-b border-zinc-200/80 px-3 py-2 text-[13px] font-semibold tracking-tight dark:border-zinc-800/80">{card.title}</h4>
      <dl className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
        {card.rows.map(([label, value]) => (
          <div key={label} className="grid gap-x-3 gap-y-0.5 px-3 py-1.5 @sm:grid-cols-[7.5rem_minmax(0,1fr)] @sm:items-baseline">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400"><MathText text={label} inline /></dt>
            <dd className="min-w-0 overflow-x-auto text-[13.5px] leading-relaxed"><MathText text={value} inline /></dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

/** Tarjetas agrupadas por eje; las columnas se ajustan al espacio disponible. */
function CardGroups({ cards }: { cards: CheatCard[] }) {
  const axes = [...new Set(cards.map((c) => c.axis))]
  return (
    <div className="@container space-y-4">
      {axes.map((axis) => (
        <section key={axis} aria-label={axis}>
          <h3 className="mb-1.5 px-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{axis}</h3>
          <div className="gap-3 @3xl:columns-2 @6xl:columns-3">
            {cards.filter((c) => c.axis === axis).map((card) => <CheatCardView key={card.id} card={card} />)}
          </div>
        </section>
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
            <CardGroups cards={g.cards} />
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
        <CardGroups cards={found} />
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
