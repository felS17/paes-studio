import { Minus, Plus } from 'lucide-react'
import { MathText } from '@/components/math/MathText'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/ui/segmented'
import { cn } from '@/lib/utils'
import { READER_SIZES, useSettingsStore } from '@/store/useSettingsStore'
import type { Passage } from '@/types/exam'
import type { ReaderFont } from '@/types/user'

export function ReaderControls({ className }: { className?: string }) {
  const reader = useSettingsStore((s) => s.reader)
  const setReader = useSettingsStore((s) => s.setReader)
  const idx = READER_SIZES.indexOf(reader.size as (typeof READER_SIZES)[number])
  const step = (dir: 1 | -1) => {
    const next = READER_SIZES[Math.min(READER_SIZES.length - 1, Math.max(0, (idx < 0 ? 2 : idx) + dir))]
    setReader({ size: next })
  }
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Segmented<ReaderFont>
        label="Tipografía de lectura"
        size="sm"
        value={reader.font}
        onChange={(font) => setReader({ font })}
        options={[
          { value: 'serif', label: <span className="font-serif text-[12.5px]">Serif</span> },
          { value: 'sans', label: 'Sans' },
        ]}
      />
      <div className="flex items-center rounded-lg border border-zinc-200/80 dark:border-zinc-800/80" role="group" aria-label="Tamaño de letra">
        <Button variant="ghost" size="icon-sm" onClick={() => step(-1)} disabled={idx === 0} aria-label="Reducir letra">
          <Minus />
        </Button>
        <span className="w-8 text-center font-mono text-[11px] text-zinc-600 tabular-nums dark:text-zinc-400" aria-live="polite">
          {reader.size}
        </span>
        <Button variant="ghost" size="icon-sm" onClick={() => step(1)} disabled={idx === READER_SIZES.length - 1} aria-label="Aumentar letra">
          <Plus />
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        aria-pressed={reader.paragraphNumbers}
        onClick={() => setReader({ paragraphNumbers: !reader.paragraphNumbers })}
        className={cn(reader.paragraphNumbers && 'text-zinc-900 dark:text-zinc-100')}
        title="Numerar párrafos en el margen"
      >
        <span className="font-serif text-[14px] leading-none">¶</span>
        {reader.paragraphNumbers ? 'Numerados' : 'Numerar'}
      </Button>
    </div>
  )
}

/** Texto base de la lectura con tipografía editorial ajustable. */
export function PassageViewer({ passage, className }: { passage: Passage; className?: string }) {
  const reader = useSettingsStore((s) => s.reader)
  return (
    <section className={cn('px-5 pt-5 pb-16 sm:px-8', className)} aria-label={passage.title}>
      <div className="sticky top-0 z-10 -mx-5 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 bg-canvas/95 px-5 py-2.5 backdrop-blur sm:-mx-8 sm:px-8 dark:border-zinc-800/80">
        <h2 className="text-[13px] font-semibold tracking-tight normal-case">
          {passage.title}
          {passage.questionRange && (
            <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
              preguntas <span className="tabular-nums">{passage.questionRange[0]}–{passage.questionRange[1]}</span>
            </span>
          )}
        </h2>
        <ReaderControls />
      </div>
      <div className={cn('mx-auto max-w-[65ch] normal-case', reader.paragraphNumbers && 'pl-9')}>
        <MathText
          text={passage.body}
          numberParagraphs={reader.paragraphNumbers}
          className={cn(
            'leading-[1.75] text-zinc-800 dark:text-zinc-200',
            reader.font === 'serif' ? 'font-serif' : 'font-sans',
          )}
          style={{ fontSize: `${reader.size}px` }}
        />
        {passage.footnotes && passage.footnotes.length > 0 && (
          <div className="mt-8 border-t border-zinc-200/80 pt-4 dark:border-zinc-800/80">
            <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              {passage.footnotes.map((note, i) => (
                <li key={i}><MathText text={note} inline /></li>
              ))}
            </ul>
          </div>
        )}
        {passage.source && <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">{passage.source}</p>}
      </div>
    </section>
  )
}
