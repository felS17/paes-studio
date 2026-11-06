import { useEffect, useRef } from 'react'
import { Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { THEME_BY_ID } from '@/data/themes'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/store/useSettingsStore'
import { createNebula } from '@/utils/nebula'

const FRAME_MS = 1000 / 26
/** Instante inicial: con el vórtice ya formado, también si parte en pausa. */
const FIRST_FRAME_S = 40

/**
 * Nebulosa animada del Inicio. Corre a ~26 fps, se detiene sola fuera de pantalla y con el botón de pausa. Con
 * movimiento reducido parte detenida, pero el botón sigue permitiendo animarla.
 */
export function NebulaCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const clockRef = useRef(FIRST_FRAME_S)
  const { resolved } = useTheme()
  const saved = useSettingsStore((s) => s.nebulaPaused)
  const setPaused = useSettingsStore((s) => s.setNebulaPaused)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const paused = saved ?? reducedMotion
  const { accent, accent2, text } = THEME_BY_ID[resolved]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const nebula = createNebula(canvas, { rim: accent2, mid: accent, core: text })
    let frame = 0
    let last = 0
    let visible = true
    let alive = true

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop)
      const elapsed = now - last
      if (elapsed < FRAME_MS) return
      last = now
      // Al volver de otra pestaña sigue donde quedó, sin saltar.
      clockRef.current += Math.min(elapsed, FRAME_MS * 3) / 1000
      nebula.draw(clockRef.current)
    }
    const stop = () => {
      cancelAnimationFrame(frame)
      frame = 0
    }
    const start = () => {
      if (frame || paused || !visible) return
      last = performance.now()
      frame = requestAnimationFrame(loop)
    }

    const resizeObserver = new ResizeObserver(() => {
      nebula.resize()
      nebula.draw(clockRef.current)
    })
    resizeObserver.observe(canvas)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else stop()
    })
    intersectionObserver.observe(canvas)
    // El atlas se pinta con la fuente mono: si aún no había cargado, se repinta cuando llega.
    document.fonts?.load("500 12px 'JetBrains Mono Variable'").then(() => {
      if (!alive) return
      nebula.rebuildGlyphs()
      nebula.draw(clockRef.current)
    })

    nebula.resize()
    nebula.draw(clockRef.current)
    start()
    return () => {
      alive = false
      stop()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [paused, accent, accent2, text])

  const label = paused ? 'Reanudar la animación' : 'Pausar la animación'
  return (
    <div className={cn('relative overflow-hidden bg-canvas', className)}>
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 size-full" />
      <Button
        variant="ghost"
        size="icon-sm"
        className="absolute bottom-2 left-2 bg-canvas/70"
        onClick={() => setPaused(!paused)}
        title={label}
        aria-label={label}
      >
        {paused ? <Play /> : <Pause />}
      </Button>
    </div>
  )
}
