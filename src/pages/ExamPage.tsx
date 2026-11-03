import { useEffect, useRef } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ExamIntro } from '@/components/exam/ExamIntro'
import { ExamRunner } from '@/components/exam/ExamRunner'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { useExam } from '@/hooks/useExam'
import { sessionKey, useExamStore } from '@/store/useExamStore'
import type { ExamMode } from '@/types/exam'

export function ExamPage() {
  const { examId } = useParams()
  const [params] = useSearchParams()
  const modeParam = params.get('modo')
  const mode: ExamMode | null = modeParam === 'practica' || modeParam === 'ensayo' ? modeParam : null
  const { exam, error, loading } = useExam(examId)
  const start = useExamStore((s) => s.start)
  const hasSession = useExamStore((s) => (exam && mode ? Boolean(s.sessions[sessionKey(exam.id, mode)]) : false))

  // Inicia la sesión una sola vez por montaje: al entregar, la sesión se descarta y no debe recrearse
  // mientras se navega a los resultados.
  const started = useRef<string | null>(null)
  useEffect(() => {
    if (!exam || !mode) {
      started.current = null // de vuelta en la portada: se puede iniciar de nuevo
      return
    }
    const k = sessionKey(exam.id, mode)
    if (started.current === k) return
    started.current = k
    if (!hasSession) start(exam.id, mode)
  }, [exam, mode, hasSession, start])

  useEffect(() => {
    if (exam) document.title = `${exam.title} | PAES Studio`
    return () => {
      document.title = 'PAES Studio'
    }
  }, [exam])

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <EmptyState title="No se pudo abrir el ensayo" action={<Button asChild><Link to="/ensayos">Volver a ensayos</Link></Button>}>
          {error}
        </EmptyState>
      </div>
    )
  }
  if (loading || !exam) {
    return (
      <div className="flex h-dvh items-center justify-center text-[13px] text-zinc-500" role="status">
        Cargando ensayo…
      </div>
    )
  }
  if (!mode) return <ExamIntro exam={exam} />
  if (!hasSession) return null
  return <ExamRunner key={`${exam.id}:${mode}`} exam={exam} mode={mode} />
}
