import { MathText } from '@/components/math/MathText'
import type { SubtopicNote } from '@/types/temario'

/** Nota del subtema: teoría, recuadro, ideas clave y trampas frecuentes del DEMRE. */
export function SubtopicNoteView({ id, notes }: { id: string; notes: Record<string, SubtopicNote> | null }) {
  const note = notes?.[id]
  if (!notes) return <p className="text-[13px] text-zinc-500">Cargando la nota…</p>
  if (!note) return null
  return (
    <div className="space-y-3 text-[13.5px] leading-relaxed">
      {note.theory.map((p, i) => (
        <MathText key={i} text={p} className="text-zinc-700 dark:text-zinc-300" />
      ))}
      <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/70 px-3.5 py-3 dark:border-zinc-800/80 dark:bg-zinc-900/40">
        <p className="text-xs font-medium">{note.box.title}</p>
        <MathText text={note.box.body} className="mt-1.5 text-[13px]" />
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Ideas clave</p>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 marker:text-zinc-400">
          {note.keyIdeas.map((t, i) => (
            <li key={i}><MathText text={t} inline /></li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Trampas frecuentes del DEMRE</p>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 marker:text-zinc-400">
          {note.traps.map((t, i) => (
            <li key={i}><MathText text={t} inline /></li>
          ))}
        </ul>
      </div>
    </div>
  )
}
