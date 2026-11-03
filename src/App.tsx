import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useTheme } from '@/hooks/useTheme'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Las vistas con KaTeX y gráficos se cargan bajo demanda: el listado de ensayos abre sin ellas.
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const SubtopicsPage = lazy(() => import('@/pages/SubtopicsPage').then((m) => ({ default: m.SubtopicsPage })))
const ExamPage = lazy(() => import('@/pages/ExamPage').then((m) => ({ default: m.ExamPage })))
const ResultsPage = lazy(() => import('@/pages/ResultsPage').then((m) => ({ default: m.ResultsPage })))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const FlashcardsPage = lazy(() => import('@/pages/FlashcardsPage').then((m) => ({ default: m.FlashcardsPage })))
const FlashcardStudyPage = lazy(() => import('@/pages/FlashcardStudyPage').then((m) => ({ default: m.FlashcardStudyPage })))
const MaterialPage = lazy(() => import('@/pages/MaterialPage').then((m) => ({ default: m.MaterialPage })))
// El grafo (react-force-graph-2d, Canvas) vive en su propio chunk.
const ZettelkastenPage = lazy(() => import('@/pages/ZettelkastenPage').then((m) => ({ default: m.ZettelkastenPage })))

function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-[13px] text-zinc-500" role="status">
      Cargando…
    </div>
  )
}

export default function App() {
  useTheme()
  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/ensayo/:examId" element={<ExamPage />} />
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="/ensayos" element={<DashboardPage />} />
            <Route path="/subtemas" element={<SubtopicsPage />} />
            <Route path="/analitica" element={<AnalyticsPage />} />
            <Route path="/resultados/:attemptId" element={<ResultsPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/flashcards/:deckId" element={<FlashcardStudyPage />} />
            <Route path="/material" element={<MaterialPage />} />
            <Route path="/zettelkasten" element={<ZettelkastenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
