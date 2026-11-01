import { useCallback, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface SplitPaneProps {
  left: React.ReactNode
  right: React.ReactNode
  ratio: number
  onRatioChange: (ratio: number) => void
  min?: number
  max?: number
  className?: string
}

/** Vista dividida horizontal con divisor arrastrable (mouse, touch y teclado). */
export function SplitPane({ left, right, ratio, onRatioChange, min = 0.3, max = 0.7, className }: SplitPaneProps) {
  const container = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const clamp = useCallback((r: number) => Math.min(max, Math.max(min, r)), [min, max])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !container.current) return
    const rect = container.current.getBoundingClientRect()
    onRatioChange(clamp((e.clientX - rect.left) / rect.width))
  }
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  return (
    <div ref={container} className={cn('flex min-h-0 flex-1', dragging && 'cursor-col-resize select-none', className)}>
      <div className="min-h-0 min-w-0 overflow-y-auto" style={{ flexBasis: `${ratio * 100}%` }}>
        {left}
      </div>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Ajustar ancho del texto"
        aria-valuemin={Math.round(min * 100)}
        aria-valuemax={Math.round(max * 100)}
        aria-valuenow={Math.round(ratio * 100)}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={() => onRatioChange(0.52)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault()
            e.stopPropagation()
            onRatioChange(clamp(ratio + (e.key === 'ArrowRight' ? 0.02 : -0.02)))
          }
        }}
        className="group relative z-10 w-px shrink-0 cursor-col-resize bg-zinc-200/80 dark:bg-zinc-800/80"
      >
        <span className="absolute inset-y-0 -left-1.5 w-3" />
        <span
          className={cn(
            'absolute top-1/2 left-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-300 transition-colors group-hover:bg-zinc-500 group-focus-visible:bg-zinc-900 dark:bg-zinc-700 dark:group-hover:bg-zinc-400 dark:group-focus-visible:bg-zinc-100',
            dragging && 'bg-zinc-900 dark:bg-zinc-100',
          )}
        />
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">{right}</div>
    </div>
  )
}
