import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Grid3x3, PanelLeft, X } from 'lucide-react'
import { SplitPane } from '@/components/layout/SplitPane'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, SheetContent } from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { Segmented } from '@/components/ui/segmented'
import { subjectLabel } from '@/data/subjects'
import { useElementWidth } from '@/hooks/useElementWidth'
import { useExamTimer } from '@/hooks/useExamTimer'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useQuestionClock } from '@/hooks/useQuestionClock'
import { useSidebar } from '@/hooks/useWorkspace'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { sessionKey, useExamStore } from '@/store/useExamStore'
import { useInspectorStore } from '@/store/useInspectorStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useStreakStore } from '@/store/useStreakStore'
import type { Exam, ExamMode } from '@/types/exam'
import { dateKeyOfDailySet, isDailySetId, localDateKey } from '@/utils/daily'
import { plural } from '@/utils/format'
import { cn } from '@/lib/utils'
import { gradeAttempt } from '@/utils/scoring'
import { ExamTimer } from './ExamTimer'
import { PassageViewer } from './PassageViewer'
import { QuestionCard } from './QuestionCard'
import { QuestionNavigator } from './QuestionNavigator'

export function ExamRunner({ exam, mode }: { exam: Exam; mode: ExamMode }) {
  const navigate = useNavigate()
  const key = sessionKey(exam.id, mode)
  const session = useExamStore((s) => s.sessions[key])
  const select = useExamStore((s) => s.select)
  const clearAnswer = useExamStore((s) => s.clearAnswer)
  const toggleFlag = useExamStore((s) => s.toggleFlag)
  const toggleStrike = useExamStore((s) => s.toggleStrike)
  const markChallenge = useStreakStore((s) => s.markChallenge)
  const check = useExamStore((s) => s.check)
  const goTo = useExamStore((s) => s.goTo)
  const discard = useExamStore((s) => s.discard)
  const addAttempt = useAnalyticsStore((s) => s.addAttempt)
  const showHints = useSettingsStore((s) => s.showShortcutHints)
  const splitRatio = useSettingsStore((s) => s.splitRatio)
  const setSplitRatio = useSettingsStore((s) => s.setSplitRatio)

  const isWide = useMediaQuery('(min-width: 1024px)')
  const inspectorOpen = useInspectorStore((s) => s.isOpen)
  const { toggle: toggleSidebar, state: sidebarState } = useSidebar()
  // El espacio depende de la barra lateral y del Inspector, así que se mide el área del runner y no la ventana.
  const [setRootEl, rootWidth] = useElementWidth()
  const stageWidth = rootWidth || (isWide ? 1280 : 0)
  const asideVisible = stageWidth >= 1100 && !inspectorOpen
  const splitPassage = isWide && stageWidth - (asideVisible ? 288 : 0) >= 720
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  /** Aviso breve cuando se intenta marcar con el teclado una alternativa tachada. */
  const [notice, setNotice] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const finishing = useRef(false)
  const elapsedRef = useRef(0)

  const questions = exam.questions
  const index = Math.min(Math.max(session?.currentIndex ?? 0, 0), questions.length - 1)
  const question = questions[index]
  // La vista móvil vuelve a "Pregunta" al cambiar de pregunta (estado ligado al índice).
  const [mobileView, setMobileView] = useState<{ index: number; tab: 'texto' | 'pregunta' }>({ index: 0, tab: 'pregunta' })
  const mobileTab = mobileView.index === index ? mobileView.tab : 'pregunta'
  const setMobileTab = (tab: 'texto' | 'pregunta') => setMobileView({ index, tab })
  const passage = useMemo(
    () => (question.passageId ? exam.passages.find((p) => p.id === question.passageId) : undefined),
    [exam.passages, question.passageId],
  )
  const limitMs = mode === 'ensayo' ? exam.durationMinutes * 60_000 : null
  const answers = session?.answers ?? {}
  const selected = answers[question.id]
  const checked = session?.checked ?? {}
  const flagged = session?.flagged ?? []
  const struck = session?.struck?.[question.id] ?? []
  const isDaily = isDailySetId(exam.id)
  const revealed = mode === 'practica' && Boolean(checked[question.id])
  const answeredCount = questions.filter((q) => answers[q.id]).length
  // Mide el tiempo de resolver: no corre mientras se lee la solución o se consulta teoría en el Inspector.
  const flushClock = useQuestionClock(key, question.id, Boolean(session) && !revealed && !inspectorOpen)

  const finish = useCallback(() => {
    if (finishing.current) return
    flushClock()
    const current = useExamStore.getState().sessions[key]
    if (!current) return
    finishing.current = true
    const attempt = gradeAttempt({
      exam,
      mode,
      answers: current.answers,
      flagged: current.flagged,
      startedAt: current.startedAt,
      durationMs: elapsedRef.current,
      telemetry: current.telemetry,
    })
    if (attempt.answered === 0 && mode === 'practica') {
      discard(key)
      navigate('/ensayos', { replace: true })
      return
    }
    addAttempt(attempt)
    // Desafío Diario: cuenta para la racha si respondes las 3 preguntas el mismo día del desafío.
    if (isDailySetId(exam.id) && attempt.answered === attempt.totalQuestions && dateKeyOfDailySet(exam.id) === localDateKey()) {
      markChallenge(localDateKey())
    }
    discard(key)
    navigate(`/resultados/${attempt.id}`, { replace: true })
  }, [addAttempt, discard, exam, flushClock, key, markChallenge, mode, navigate])

  const { elapsedMs, remainingMs } = useExamTimer({
    sessionKey: key,
    limitMs,
    running: Boolean(session),
    onExpire: finish,
  })
  useEffect(() => {
    elapsedRef.current = elapsedMs
  }, [elapsedMs])

  const go = useCallback(
    (delta: number) => {
      const next = Math.min(questions.length - 1, Math.max(0, index + delta))
      if (next !== index) goTo(key, next)
    },
    [goTo, index, key, questions.length],
  )

  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 })
  }, [index])

  useEffect(() => {
    if (!notice) return
    const t = window.setTimeout(() => setNotice(null), 3200)
    return () => window.clearTimeout(t)
  }, [notice])

  const optionKeys = question.options.map((o) => o.key)
  const shortcuts: Record<string, (event: KeyboardEvent) => void> = {
    arrowleft: () => go(-1),
    arrowright: () => go(1),
    f: () => toggleFlag(key, question.id),
    backspace: () => clearAnswer(key, question.id),
    enter: () => {
      if (mode === 'practica') {
        if (!revealed && selected) check(key, question.id)
        else if (revealed) go(1)
      } else if (index === questions.length - 1) setConfirmOpen(true)
      else go(1)
    },
  }
  for (const k of optionKeys) {
    shortcuts[k.toLowerCase()] = (event) => {
      // Shift + letra tacha o recupera la alternativa (no aplica una vez verificada).
      if (event.shiftKey) {
        if (!revealed) toggleStrike(key, question.id, k)
        return
      }
      // Una alternativa tachada no se marca con el teclado: hay que recuperarla o hacer clic en ella.
      if (struck.includes(k) && !revealed) {
        setNotice(`La ${k} está descartada. Recupérala con Shift + ${k} o haz clic en ella para marcarla.`)
        return
      }
      select(key, question.id, k)
    }
  }
  useKeyboardShortcuts(shortcuts, Boolean(session) && !confirmOpen && !sheetOpen)

  if (!session) return null

  const navigator = (
    <QuestionNavigator
      questions={questions}
      passages={exam.passages}
      current={index}
      answers={answers}
      flagged={flagged}
      checked={checked}
      mode={mode}
      onJump={(i) => {
        goTo(key, i)
        setSheetOpen(false)
      }}
    />
  )

  const card = (
    <div ref={panelRef} className="h-full overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
      <QuestionCard
        key={question.id}
        question={question}
        mode={mode}
        position={index + 1}
        total={questions.length}
        selected={selected}
        revealed={revealed}
        flagged={flagged.includes(question.id)}
        onSelect={(k) => select(key, question.id, k)}
        onCheck={() => check(key, question.id)}
        onToggleFlag={() => toggleFlag(key, question.id)}
        showHints={showHints && isWide}
        struck={struck}
        onToggleStrike={revealed ? undefined : (k) => toggleStrike(key, question.id, k)}
        theory={mode === 'practica'}
        subject={exam.subject}
      />
    </div>
  )

  let main: React.ReactNode
  if (passage && splitPassage) {
    main = (
      <SplitPane
        ratio={splitRatio}
        onRatioChange={setSplitRatio}
        left={<PassageViewer passage={passage} />}
        right={card}
      />
    )
  } else if (passage) {
    main = (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex justify-center border-b border-zinc-200/80 px-4 py-2 dark:border-zinc-800/80">
          <Segmented
            label="Vista"
            size="sm"
            value={mobileTab}
            onChange={setMobileTab}
            options={[
              { value: 'texto', label: passage.title },
              { value: 'pregunta', label: `Pregunta ${question.number}` },
            ]}
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {mobileTab === 'texto' ? <PassageViewer passage={passage} /> : card}
        </div>
      </div>
    )
  } else {
    main = <div className="min-h-0 flex-1">{card}</div>
  }

  const progress = answeredCount / questions.length
  const unanswered = questions.length - answeredCount

  return (
    <div ref={setRootEl} className="flex min-h-0 flex-1 flex-col bg-[#FAFAFA] dark:bg-[#09090B]">
      <header className="relative flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200/80 bg-white px-3 sm:px-4 dark:border-zinc-800/80 dark:bg-[#121215]">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={sidebarState === 'full' ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}
          title={mode === 'ensayo' ? 'Modo Zen: mostrar u ocultar la barra lateral' : 'Mostrar u ocultar la barra lateral'}
        >
          <PanelLeft />
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <Link to="/ensayos" aria-label="Salir (tu avance queda guardado)" title="Salir; tu avance queda guardado">
            <X />
          </Link>
        </Button>
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-[13px] font-semibold tracking-tight">
            {isDaily ? exam.title : subjectLabel(exam.subject, exam.area)}
            {!isDaily && <span className="ml-2 hidden font-normal text-zinc-500 sm:inline dark:text-zinc-400">{exam.title}</span>}
          </p>
          <p className="flex items-center gap-2 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
            <Badge tone={mode === 'ensayo' ? 'solid' : 'outline'} className="py-0">
              {mode === 'ensayo' ? 'Ensayo' : 'Práctica'}
            </Badge>
            <span className="tabular-nums">{answeredCount}/{questions.length}</span>
            <span className="hidden sm:inline">respondidas</span>
          </p>
        </div>
        <ExamTimer elapsedMs={elapsedMs} remainingMs={remainingMs} />
        {!asideVisible && (
          <Button variant="secondary" size="md" onClick={() => setSheetOpen(true)} aria-label="Abrir hoja de respuestas">
            <Grid3x3 />
            <span className="hidden sm:inline">Hoja</span>
          </Button>
        )}
        <Button variant="primary" onClick={() => setConfirmOpen(true)}>
          {mode === 'ensayo' ? 'Entregar' : 'Terminar'}
        </Button>
        <div className="absolute inset-x-0 -bottom-px h-px bg-transparent" aria-hidden>
          <div className="h-px bg-zinc-900 transition-[width] duration-300 dark:bg-zinc-100" style={{ width: `${progress * 100}%` }} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{main}</div>
        {asideVisible && (
          <aside className="w-72 shrink-0 border-l border-zinc-200/80 bg-white dark:border-zinc-800/80 dark:bg-[#121215]">
            {navigator}
          </aside>
        )}
      </div>

      <footer className="flex h-14 shrink-0 items-center gap-2 border-t border-zinc-200/80 bg-white px-3 sm:px-4 dark:border-zinc-800/80 dark:bg-[#121215]">
        <Button variant="secondary" onClick={() => go(-1)} disabled={index === 0} aria-label="Pregunta anterior">
          <ArrowLeft />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        <div
          className={cn(
            'flex-1 items-center justify-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-400',
            notice ? 'flex' : 'hidden md:flex',
          )}
          role="status"
          aria-live="polite"
        >
          {notice ? (
            <span className="truncate text-[12px] font-medium text-zinc-900 dark:text-zinc-100">{notice}</span>
          ) : showHints && (
            <>
              <span className="flex items-center gap-1.5"><Kbd>A</Kbd>–<Kbd>{optionKeys[optionKeys.length - 1]}</Kbd> responder</span>
              <span className="hidden items-center gap-1.5 lg:flex"><Kbd>Shift</Kbd>+<Kbd>A</Kbd> descartar</span>
              <span className="flex items-center gap-1.5"><Kbd>F</Kbd> duda</span>
              <span className="flex items-center gap-1.5"><Kbd>Enter</Kbd> {mode === 'practica' ? 'verificar' : 'siguiente'}</span>
              <span className="flex items-center gap-1.5"><Kbd>←</Kbd><Kbd>→</Kbd> navegar</span>
            </>
          )}
        </div>
        {!notice && <div className="flex-1 md:hidden" />}
        <Button variant="secondary" onClick={() => (index === questions.length - 1 ? setConfirmOpen(true) : go(1))} aria-label="Pregunta siguiente">
          <span className="hidden sm:inline">{index === questions.length - 1 ? (mode === 'ensayo' ? 'Entregar' : 'Terminar') : 'Siguiente'}</span>
          <ArrowRight />
        </Button>
      </footer>

      <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent title="Hoja de respuestas">{navigator}</SheetContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent
          title={mode === 'ensayo' ? '¿Entregar el ensayo?' : '¿Terminar la práctica?'}
          description={
            mode === 'ensayo'
              ? 'Al entregar se calcula tu puntaje PAES y ya no podrás cambiar respuestas.'
              : 'Se guardará tu desempeño en las preguntas que respondiste.'
          }
        >
          <dl className="mt-4 grid grid-cols-3 divide-x divide-zinc-200/80 rounded-lg border border-zinc-200/80 text-center dark:divide-zinc-800/80 dark:border-zinc-800/80">
            {[
              ['Respondidas', answeredCount],
              ['Sin responder', unanswered],
              ['Con duda', flagged.length],
            ].map(([label, value]) => (
              <div key={label as string} className="py-3">
                <dd className="font-mono text-lg font-medium tabular-nums">{value}</dd>
                <dt className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</dt>
              </div>
            ))}
          </dl>
          {mode === 'ensayo' && unanswered > 0 && (
            <p className="mt-3 text-[12.5px] font-medium text-zinc-900 dark:text-zinc-100">
              Te {unanswered === 1 ? 'queda' : 'quedan'} {plural(unanswered, 'pregunta')} sin responder. En la PAES no se descuenta por error: conviene responder todas.
            </p>
          )}
          {mode === 'practica' && answeredCount === 0 && (
            <p className="mt-3 text-[12.5px] text-zinc-500 dark:text-zinc-400">No respondiste ninguna pregunta, así que no se guardará un intento.</p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Seguir respondiendo</Button>
            <Button variant="primary" onClick={finish}>{mode === 'ensayo' ? 'Entregar ensayo' : 'Terminar práctica'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
