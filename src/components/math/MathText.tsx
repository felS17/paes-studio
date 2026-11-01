import { Fragment, memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { numberableParagraphs, parseBlocks, parseInline, type Block, type Inline } from '@/utils/markdown'
import { renderTex } from './katex'

function InlineNodes({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.t) {
          case 'text':
            return <Fragment key={i}>{n.v}</Fragment>
          case 'math':
            return (
              <span
                key={i}
                className={n.display ? 'block' : undefined}
                dangerouslySetInnerHTML={{ __html: renderTex(n.v, Boolean(n.display)) }}
              />
            )
          case 'strong':
            return <strong key={i}><InlineNodes nodes={n.c} /></strong>
          case 'em':
            return <em key={i}><InlineNodes nodes={n.c} /></em>
          case 'br':
            return <br key={i} />
        }
      })}
    </>
  )
}

function BlockNode({ block }: { block: Block }) {
  switch (block.t) {
    case 'p':
      return <p><InlineNodes nodes={block.c} /></p>
    case 'math':
      return <div dangerouslySetInnerHTML={{ __html: renderTex(block.v, true) }} />
    case 'h':
      return <h3><InlineNodes nodes={block.c} /></h3>
    case 'quote':
      return <blockquote><InlineNodes nodes={block.c} /></blockquote>
    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul'
      return (
        <Tag>
          {block.items.map((item, i) => (
            <li key={i}><InlineNodes nodes={item} /></li>
          ))}
        </Tag>
      )
    }
    case 'table':
      return (
        <div className="mt-table">
          <table>
            <thead>
              <tr>{block.head.map((c, i) => <th key={i}><InlineNodes nodes={c} /></th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>{row.map((c, i) => <td key={i}><InlineNodes nodes={c} /></td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'img':
      return (
        <figure>
          <img
            src={block.src}
            alt={block.alt}
            width={block.w}
            height={block.h}
            loading="lazy"
            decoding="async"
            className={cn('rounded-md', block.mono && 'snapshot-mono')}
            style={block.w ? { width: `min(100%, ${Math.round(block.w / 1.75)}px)` } : undefined}
          />
          {block.caption && block.alt && <figcaption>{block.alt}</figcaption>}
        </figure>
      )
  }
}

interface MathTextProps {
  text: string
  className?: string
  /** Renderiza solo contenido en línea dentro de un <span> (alternativas, títulos). */
  inline?: boolean
  /** Numera en el margen los párrafos del texto (lecturas). */
  numberParagraphs?: boolean
  style?: React.CSSProperties
}

/** Texto híbrido Markdown + LaTeX renderizado con KaTeX. */
export const MathText = memo(function MathText({ text, className, inline, numberParagraphs, style }: MathTextProps) {
  const blocks = useMemo(() => (inline ? null : parseBlocks(text)), [text, inline])
  const inlineNodes = useMemo(() => (inline ? parseInline(text) : null), [text, inline])
  const numbered = useMemo(() => {
    if (!blocks || !numberParagraphs) return null
    const map = new Map<number, number>()
    for (const i of numberableParagraphs(blocks)) map.set(i, map.size + 1)
    return map
  }, [blocks, numberParagraphs])

  if (inlineNodes) {
    return (
      <span className={cn('mt-prose', className)} style={style}>
        <InlineNodes nodes={inlineNodes} />
      </span>
    )
  }

  return (
    <div className={cn('mt-prose', className)} style={style}>
      {blocks!.map((b, i) => {
        const n = numbered?.get(i)
        if (n !== undefined) {
          return (
            <div key={i} className="relative">
              <span
                aria-label={`Párrafo ${n}`}
                className="absolute top-[0.32em] -left-9 w-6 text-right font-mono text-[11px] text-zinc-400 tabular-nums select-none dark:text-zinc-600"
              >
                {n}
              </span>
              <BlockNode block={b} />
            </div>
          )
        }
        return <BlockNode key={i} block={b} />
      })}
    </div>
  )
})
