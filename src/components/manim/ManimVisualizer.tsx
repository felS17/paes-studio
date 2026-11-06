import { useCallback, useEffect, useRef, useState } from 'react'
import { Segmented } from '@/components/ui/segmented'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { clamp01 } from './manimMath'
import { Stage } from './primitives'
import { SCENES, type SceneValues } from './registry'
import type { SceneId } from './sceneMap'

const BUTTON = 'rounded-sm px-0.5 text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400'

/**
 * Pizarra animada al estilo de Manim, en SVG nativo y sin videos. `t` va de 0 a 1 y cada escena lo traduce a sus trazos.
 * Parte con la escena terminada: solo se mueve si lo pides o si el tutor de voz está leyendo (`syncProgress`).
 */
export function ManimVisualizer({ scene, initial, syncProgress = null }: {
  scene: SceneId
  initial?: SceneValues
  /** Avance del tutor de voz, de 0 a 1, o null si no está leyendo. */
  syncProgress?: number | null
}) {
  const meta = SCENES[scene]
  const [values, setValues] = useState<SceneValues>({ ...meta.defaults, ...initial })
  const [t, setT] = useState(1)
  const [playing, setPlaying] = useState(false)
  const frame = useRef(0)
  const current = useRef(1)
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const animate = useCallback(
    (from: number, to: number, ms: number) => {
      cancelAnimationFrame(frame.current)
      if (reducedMotion) {
        current.current = to
        setT(to)
        setPlaying(false)
        return
      }
      const start = performance.now()
      setPlaying(true)
      const step = (now: number) => {
        const progress = clamp01((now - start) / ms)
        current.current = from + (to - from) * progress
        setT(current.current)
        if (progress < 1) frame.current = requestAnimationFrame(step)
        else setPlaying(false)
      }
      frame.current = requestAnimationFrame(step)
    },
    [reducedMotion],
  )

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  // Con el tutor leyendo, la escena avanza a medida que pasa de un bloque al siguiente.
  useEffect(() => {
    if (syncProgress === null) return
    const id = requestAnimationFrame(() => animate(current.current, clamp01(syncProgress), 1200))
    return () => cancelAnimationFrame(id)
  }, [animate, syncProgress])

  const replay = () => animate(0, 1, meta.durationMs)
  const reset = () => {
    cancelAnimationFrame(frame.current)
    current.current = 0
    setT(0)
    setPlaying(false)
  }
  const change = (key: string, value: string | number) => {
    setValues((v) => ({ ...v, [key]: value }))
    replay()
  }

  const { Component } = meta
  return (
    // Los rótulos matemáticos (A′, Δ, λ) no deben pasar por las minúsculas de la interfaz.
    <figure className="overflow-hidden rounded-lg border border-zinc-200/80 normal-case dark:border-zinc-800/80">
      <Stage label={meta.description}>
        <Component t={t} v={values} />
      </Stage>
      <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-2 bg-surface px-3 py-2 font-mono text-[12px]">
        <span className="text-zinc-900 dark:text-zinc-100">{meta.title}</span>
        <button type="button" onClick={replay} className={BUTTON}>{playing ? '[ ▸ animando ]' : '[ ▸ animar ]'}</button>
        <button type="button" onClick={reset} className={BUTTON}>[ reiniciar ]</button>
        {meta.params.filter((param) => !param.when || param.when(values)).map((param) =>
          param.kind === 'choice' ? (
            <Segmented
              key={param.key}
              size="sm"
              label={param.label}
              className="max-w-full overflow-x-auto font-sans"
              value={String(values[param.key])}
              onChange={(value) => change(param.key, value)}
              options={param.options}
            />
          ) : (
            <label key={param.key} className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
              {param.label}
              <input
                type="range"
                min={param.min}
                max={param.max}
                step={param.step}
                value={Number(values[param.key])}
                onChange={(e) => change(param.key, Number(e.target.value))}
                className="w-24 accent-[var(--accent)]"
              />
              <span className="w-12 text-zinc-900 tabular-nums dark:text-zinc-100">{param.format(Number(values[param.key]))}</span>
            </label>
          ),
        )}
      </figcaption>
    </figure>
  )
}
