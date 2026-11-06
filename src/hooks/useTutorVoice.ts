import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { TutorRate } from '@/types/user'
import { chunkSpeech, pickSpanishVoice, type SpeechBlock } from '@/utils/mathToSpeech'

export type TutorStatus = 'idle' | 'playing' | 'paused'

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null)

/** Solo un tutor habla a la vez: al partir otra explicación, la anterior se detiene. */
let current: { owner: object; stop: () => void } | null = null

/**
 * Lee una explicación con la voz del dispositivo, sin servidores ni costo. La pausa corta el trozo actual y lo retoma
 * desde su inicio: `speechSynthesis.pause()` falla en varios navegadores móviles, y un trozo dura pocos segundos.
 */
export function useTutorVoice(blocks: SpeechBlock[]) {
  const rate = useSettingsStore((s) => s.tutorRate)
  const setRate = useSettingsStore((s) => s.setTutorRate)
  const [status, setStatus] = useState<TutorStatus>('idle')
  const [activeBlock, setActiveBlock] = useState(-1)
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(() => pickSpanishVoice(synth()?.getVoices() ?? []))
  const [voicesLoaded, setVoicesLoaded] = useState(() => (synth()?.getVoices().length ?? 0) > 0)
  const run = useRef(0)
  const position = useRef(0)
  const owner = useRef({})
  const chunks = useMemo(() => blocks.flatMap((block, index) => chunkSpeech(block.text).map((text) => ({ text, block: index }))), [blocks])

  // Las voces suelen llegar después de montar, y en algunos navegadores cambian al instalar otras.
  useEffect(() => {
    const speech = synth()
    if (!speech) return
    const load = () => {
      const voices = speech.getVoices()
      setVoicesLoaded(voices.length > 0)
      setVoice(pickSpanishVoice(voices))
    }
    speech.addEventListener('voiceschanged', load)
    return () => speech.removeEventListener('voiceschanged', load)
  }, [])

  const silence = useCallback(() => {
    run.current++
    synth()?.cancel()
  }, [])

  const speakFrom = useCallback(
    (start: number, speed: TutorRate) => {
      const speech = synth()
      if (!speech) return
      current?.stop()
      const id = ++run.current
      speech.cancel()
      const next = (index: number) => {
        if (id !== run.current) return
        if (index >= chunks.length) {
          position.current = 0
          setActiveBlock(-1)
          setStatus('idle')
          current = null
          return
        }
        position.current = index
        setActiveBlock(chunks[index].block)
        const utterance = new SpeechSynthesisUtterance(chunks[index].text)
        if (voice) utterance.voice = voice
        utterance.lang = voice?.lang ?? 'es-CL'
        utterance.rate = speed
        utterance.onend = () => next(index + 1)
        utterance.onerror = (event) => {
          // `canceled` e `interrupted` son nuestras propias pausas, no errores.
          if (event.error === 'canceled' || event.error === 'interrupted' || id !== run.current) return
          setStatus('idle')
          setActiveBlock(-1)
        }
        speech.speak(utterance)
      }
      setStatus('playing')
      current = {
        owner: owner.current,
        stop: () => {
          run.current++
          setStatus('idle')
          setActiveBlock(-1)
          position.current = 0
          current = null
        },
      }
      next(start)
    },
    [chunks, voice],
  )

  const toggle = useCallback(() => {
    if (status === 'playing') {
      silence()
      setStatus('paused')
    } else {
      speakFrom(position.current, rate)
    }
  }, [rate, silence, speakFrom, status])

  const stop = useCallback(() => {
    if (current?.owner !== owner.current) return
    current.stop()
    synth()?.cancel()
  }, [])

  const changeRate = useCallback(
    (next: TutorRate) => {
      setRate(next)
      if (status === 'playing') speakFrom(position.current, next)
    },
    [setRate, speakFrom, status],
  )

  // Al cerrar la explicación o cambiar de pregunta, o al salir de la página, la voz no debe seguir sonando.
  useEffect(() => {
    if (status === 'idle') return
    const stop = () => synth()?.cancel()
    window.addEventListener('pagehide', stop)
    return () => window.removeEventListener('pagehide', stop)
  }, [status])
  useEffect(() => {
    const me = owner.current
    return () => {
      if (current?.owner !== me) return
      current.stop()
      synth()?.cancel()
    }
  }, [])

  return {
    /** Sin soporte, o con voces cargadas y ninguna en español, el reproductor no se muestra: una voz en inglés no sirve. */
    available: Boolean(synth()) && (!voicesLoaded || voice !== null),
    status,
    rate,
    activeBlock,
    toggle,
    stop,
    changeRate,
  }
}
