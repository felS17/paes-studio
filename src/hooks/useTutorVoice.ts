import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSettingsStore } from '@/store/useSettingsStore'
import type { TutorRate } from '@/types/user'
import { chunkSpeech, pickSpanishVoice, type SpeechBlock } from '@/utils/mathToSpeech'

export type TutorStatus = 'idle' | 'playing' | 'paused'

declare global {
  interface Window {
    /** Chromium libera la locución en curso si nada la referencia, y entonces nunca llega su `onend`. */
    __activeUtterance?: SpeechSynthesisUtterance
  }
}

/** Sin respuesta en este plazo, se considera caído el audio y se pasa a la voz del dispositivo. */
const LOAD_TIMEOUT_MS = 15000
/** Hay sistemas con `speechSynthesis` pero sin motor de voz: `speak()` no falla, simplemente nunca empieza. */
const DEVICE_START_TIMEOUT_MS = 2500
/** Ritmo aproximado de la voz del dispositivo, que no informa su avance. Sirve solo para sincronizar la animación. */
const DEVICE_MS_PER_CHAR = 65
const SPEECH_RESTART_MS = 80

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null)

const ttsUrl = (text: string) => `/api/tts?text=${encodeURIComponent(text)}`

/** Un solo elemento para toda la app: en iOS solo suena el que se desbloqueó con un toque, y así nunca hablan dos. */
let sharedAudio: HTMLAudioElement | null = null
const audioElement = () => (sharedAudio ??= new Audio())

/** Solo un tutor habla a la vez: al partir otra explicación, la anterior se detiene. */
let current: { owner: object; stop: () => void } | null = null

/**
 * Lee una explicación por bloques. El motor principal es un `<audio>` con los MP3 de `/api/tts`: suena igual en todos los
 * sistemas, también en Linux, donde `speechSynthesis` suele venir sin voces. Si el audio falla (sin internet, por ejemplo)
 * sigue con la voz del dispositivo desde el mismo trozo, y solo si tampoco hay voz en español avisa con `error`.
 */
export function useTutorVoice(blocks: SpeechBlock[]) {
  const rate = useSettingsStore((s) => s.tutorRate)
  const setRate = useSettingsStore((s) => s.setTutorRate)
  const [status, setStatus] = useState<TutorStatus>('idle')
  const [activeBlock, setActiveBlock] = useState(-1)
  const [buffering, setBuffering] = useState(false)
  const [error, setError] = useState(false)
  const run = useRef(0)
  const position = useRef(0)
  const engine = useRef<'audio' | 'device'>('audio')
  /** El `<audio>` compartido tiene cargado un trozo nuestro, listo para retomarse donde quedó. */
  const audioReady = useRef(false)
  const deviceClock = useRef({ startedAt: 0, ms: 1 })
  const preload = useRef<HTMLAudioElement | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const owner = useRef({})
  const chunks = useMemo(() => blocks.flatMap((block, index) => chunkSpeech(block.text).map((text) => ({ text, block: index }))), [blocks])
  const totalChars = useMemo(() => chunks.reduce((sum, chunk) => sum + chunk.text.length, 0), [chunks])

  // Chromium carga las voces recién al pedirlas: así ya están si en algún momento hay que usar la voz del dispositivo.
  useEffect(() => {
    synth()?.getVoices()
  }, [])

  /** Corta el audio y la voz sin tocar el estado de la interfaz. El siguiente `run` invalida cualquier evento atrasado. */
  const silence = useCallback(() => {
    run.current++
    clearTimeout(timer.current)
    sharedAudio?.pause()
    audioReady.current = false
    const speech = synth()
    if (speech?.speaking || speech?.pending) speech.cancel()
  }, [])

  const finish = useCallback((failed = false) => {
    clearTimeout(timer.current)
    position.current = 0
    audioReady.current = false
    setActiveBlock(-1)
    setBuffering(false)
    setStatus('idle')
    setError(failed)
    current = null
  }, [])

  const playFrom = useCallback(
    (start: number) => {
      current?.stop()
      silence()
      const id = run.current
      const speech = synth()

      const next = (index: number) => {
        if (id !== run.current) return
        if (index >= chunks.length) {
          finish()
          return
        }
        position.current = index
        setActiveBlock(chunks[index].block)
        if (engine.current === 'audio') playChunk(index)
        else speakChunk(index)
      }

      const fallBack = (index: number) => {
        if (id !== run.current) return
        clearTimeout(timer.current)
        sharedAudio?.pause()
        audioReady.current = false
        engine.current = 'device'
        speakChunk(index)
      }

      const playChunk = (index: number) => {
        const audio = audioElement()
        const speed = useSettingsStore.getState().tutorRate
        setBuffering(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => fallBack(index), LOAD_TIMEOUT_MS)
        audio.onplaying = () => {
          if (id !== run.current) return
          clearTimeout(timer.current)
          setBuffering(false)
        }
        audio.onwaiting = () => {
          if (id === run.current) setBuffering(true)
        }
        audio.onended = () => next(index + 1)
        audio.onerror = () => fallBack(index)
        audio.src = ttsUrl(chunks[index].text)
        audio.preservesPitch = true
        // Cargar otro `src` devuelve `playbackRate` a `defaultPlaybackRate`: hay que fijar ambos para no perder la velocidad.
        audio.defaultPlaybackRate = speed
        audio.playbackRate = speed
        audioReady.current = true
        audio.play().catch((reason: unknown) => {
          if (id !== run.current || (reason instanceof DOMException && reason.name === 'AbortError')) return
          if (reason instanceof DOMException && reason.name === 'NotAllowedError') {
            // El sistema pidió un toque antes de sonar: queda en pausa para que un clic lo retome.
            clearTimeout(timer.current)
            setBuffering(false)
            setStatus('paused')
            return
          }
          fallBack(index)
        })
        // El trozo siguiente se pide por adelantado, para que no haya silencio entre uno y otro.
        if (chunks[index + 1]) {
          const ahead = new Audio()
          ahead.preload = 'auto'
          ahead.src = ttsUrl(chunks[index + 1].text)
          preload.current = ahead
        }
      }

      const speakChunk = (index: number) => {
        const voice = speech ? pickSpanishVoice(speech.getVoices()) : null
        if (!speech || !voice) {
          finish(true)
          return
        }
        setBuffering(false)
        const utterance = new SpeechSynthesisUtterance(chunks[index].text)
        const speed = useSettingsStore.getState().tutorRate
        utterance.voice = voice
        utterance.lang = voice.lang
        utterance.rate = speed
        utterance.onstart = () => {
          clearTimeout(timer.current)
          deviceClock.current = { startedAt: performance.now(), ms: (chunks[index].text.length * DEVICE_MS_PER_CHAR) / speed }
        }
        utterance.onend = () => next(index + 1)
        utterance.onerror = (event) => {
          // `canceled` e `interrupted` son nuestras propias pausas, no errores.
          if (event.error === 'canceled' || event.error === 'interrupted' || id !== run.current) return
          finish(true)
        }
        window.__activeUtterance = utterance
        const speak = () => {
          if (id !== run.current) return
          clearTimeout(timer.current)
          timer.current = setTimeout(() => {
            if (id !== run.current) return
            speech.cancel()
            finish(true)
          }, DEVICE_START_TIMEOUT_MS)
          speech.speak(utterance)
        }
        // En Chromium, `cancel()` y `speak()` en el mismo tick dejan la locución muda: se separan.
        if (speech.speaking || speech.pending) {
          speech.cancel()
          setTimeout(speak, SPEECH_RESTART_MS)
        } else {
          speak()
        }
      }

      engine.current = navigator.onLine === false ? 'device' : 'audio'
      setError(false)
      setStatus('playing')
      current = {
        owner: owner.current,
        stop: () => {
          silence()
          position.current = 0
          setStatus('idle')
          setActiveBlock(-1)
          setBuffering(false)
          current = null
        },
      }
      next(start)
    },
    [chunks, finish, silence],
  )

  const toggle = useCallback(() => {
    if (status === 'playing') {
      clearTimeout(timer.current)
      if (engine.current === 'audio') {
        sharedAudio?.pause()
      } else {
        // La voz del dispositivo no pausa de forma fiable en móviles: se corta y retoma el trozo desde su inicio.
        silence()
      }
      setBuffering(false)
      setStatus('paused')
    } else if (status === 'paused' && engine.current === 'audio' && audioReady.current && sharedAudio) {
      setStatus('playing')
      void sharedAudio.play().catch(() => setStatus('paused'))
    } else {
      playFrom(position.current)
    }
  }, [playFrom, silence, status])

  const stop = useCallback(() => {
    if (current?.owner === owner.current) current.stop()
  }, [])

  const changeRate = useCallback(
    (next: TutorRate) => {
      setRate(next)
      if (engine.current === 'audio') {
        if (status !== 'idle' && sharedAudio) sharedAudio.playbackRate = next
      } else if (status === 'playing') {
        playFrom(position.current)
      }
    },
    [playFrom, setRate, status],
  )

  /** Avance de la lectura, de 0 a 1. Se consulta cuadro a cuadro desde la animación, sin renderizar la explicación. */
  const getProgress = useCallback(() => {
    if (!totalChars) return 0
    const index = Math.min(position.current, chunks.length - 1)
    let read = 0
    for (let i = 0; i < index; i++) read += chunks[i].text.length
    const duration = sharedAudio?.duration ?? 0
    const within =
      engine.current === 'device'
        ? Math.min(1, (performance.now() - deviceClock.current.startedAt) / deviceClock.current.ms)
        : audioReady.current && sharedAudio && duration > 0 && Number.isFinite(duration)
          ? sharedAudio.currentTime / duration
          : 0
    return (read + chunks[index].text.length * within) / totalChars
  }, [chunks, totalChars])

  // Al salir de la página, la voz no debe seguir sonando.
  useEffect(() => {
    if (status === 'idle') return
    const pagehide = () => {
      sharedAudio?.pause()
      synth()?.cancel()
    }
    window.addEventListener('pagehide', pagehide)
    return () => window.removeEventListener('pagehide', pagehide)
  }, [status])

  // Al cerrar la explicación o cambiar de pregunta, tampoco.
  useEffect(() => {
    const me = owner.current
    return () => {
      if (current?.owner === me) current.stop()
    }
  }, [])

  return { status, rate, activeBlock, buffering, error, toggle, stop, changeRate, getProgress }
}
