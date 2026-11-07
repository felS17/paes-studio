import { useCallback, useEffect, useRef, useState } from 'react'
import { Segmented } from '@/components/ui/segmented'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { clamp01 } from './manimMath'
import { Stage } from './primitives'
import { SCENES, type ChoiceParam } from './registry'
import type { SceneId, SceneValues } from './sceneMap'

const BUTTON = 'rounded-sm px-0.5 text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400'

export interface VoiceSync {
  state: 'idle' | 'playing' | 'paused'
  /** Avance de la lectura, de 0 a 1. Se consulta cuadro a cuadro. */
  progress: () => number
}

/** Una cifra que vino del enunciado puede no estar entre las opciones de ejemplo: se agrega para que quede marcada. */
function optionsFor(param: ChoiceParam, value: string) {
  if (param.options.some((option) => option.value === value) || !param.custom) return param.options
  return [{ value, label: param.custom(value) }, ...param.options]
}

/**
 * Pizarra animada al estilo de Manim, en SVG nativo y sin videos. `t` va de 0 a 1 y cada escena lo traduce a sus trazos.
 * Parte con la escena terminada: solo se mueve si lo pides o si el tutor de voz está leyendo (`sync`).
 */
export function ManimVisualizer({ scene, initial, fromQuestion, sync }: {
  scene: SceneId
  initial?: SceneValues
  /** En una pregunta: si las cifras son las suyas. En el resumen de un tema no se dice nada. */
  fromQuestion?: boolean
  sync?: VoiceSync
}) {
  const meta = SCENES[scene]
  const [values, setValues] = useState<SceneValues>({ ...meta.defaults, ...initial })
  const [touched, setTouched] = useState(false)
  const [t, setT] = useState(1)
  const [playing, setPlaying] = useState(false)
  const frame = useRef(0)
  const current = useRef(1)
  const following = useRef(false)
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

  // Con el tutor leyendo, la escena sigue el avance de la voz: si esta se pausa queda quieta, y al terminar se completa.
  const state = sync?.state ?? 'idle'
  const progress = sync?.progress
  useEffect(() => {
    if (state === 'idle') {
      if (!following.current) return
      following.current = false
      const id = requestAnimationFrame(() => animate(current.current, 1, 400))
      return () => cancelAnimationFrame(id)
    }
    if (reducedMotion || !progress) return
    following.current = true
    cancelAnimationFrame(frame.current)
    if (state === 'paused') return
    const follow = () => {
      current.current = clamp01(progress())
      setT(current.current)
      frame.current = requestAnimationFrame(follow)
    }
    frame.current = requestAnimationFrame(follow)
    return () => cancelAnimationFrame(frame.current)
  }, [animate, progress, reducedMotion, state])

  const replay = () => animate(0, 1, meta.durationMs)
  const reset = () => {
    cancelAnimationFrame(frame.current)
    current.current = 0
    setT(0)
    setPlaying(false)
  }
  const change = (key: string, value: string | number) => {
    setValues((v) => ({ ...v, [key]: value }))
    setTouched(true)
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
        {fromQuestion !== undefined && !touched && (
          <span className="text-zinc-500 dark:text-zinc-400">{fromQuestion ? 'con los datos de esta pregunta' : 'valores de ejemplo'}</span>
        )}
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
              options={optionsFor(param, String(values[param.key]))}
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
