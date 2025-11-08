import { useMemo, useState } from 'react'
import QuizConfigurator, { type QuizConfig } from './components/QuizConfigurator'
import LearningQuiz from './components/LearningQuiz'
import TimedQuiz from './components/TimedQuiz'
import SummaryPanel from './components/SummaryPanel'
import SheetSelector from './components/SheetSelector'
import type { QuizMode, QuizQuestion, QuizSummary } from './types'
import { fetchQuestionsFromCsv } from './utils/csv'
import { shuffle } from './utils/shuffle'
import './App.css'
import {
  buildCsvUrl,
  fetchPublishedSheetList,
  needsSheetSelection,
  parseGoogleSheetLink,
  type SheetLinkInfo,
  type SheetOption,
} from './utils/googleSheets'

type View = 'config' | 'sheet-select' | 'quiz' | 'summary'

interface SheetSelectionState {
  linkInfo: SheetLinkInfo
  options: SheetOption[]
  config: QuizConfig
}

function App() {
  const [view, setView] = useState<View>('config')
  const [mode, setMode] = useState<QuizMode>('learning')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [summary, setSummary] = useState<QuizSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [configSnapshot, setConfigSnapshot] = useState<QuizConfig | null>(null)
  const [runKey, setRunKey] = useState(() => Date.now())
  const [sheetSelection, setSheetSelection] = useState<SheetSelectionState | null>(null)

  const loadQuestionsFromSources = async (urls: string[], config: QuizConfig) => {
    const questionSets = await Promise.all(urls.map((url) => fetchQuestionsFromCsv(url)))
    let merged = questionSets.flat()
    if (!merged.length) {
      throw new Error('No questions were found in the selected sheets.')
    }
    if (config.shuffle) {
      merged = shuffle(merged)
    }
    if (config.questionLimit) {
      merged = merged.slice(0, config.questionLimit)
    }
    setQuestions(merged)
    setMode(config.mode)
    setConfigSnapshot(config)
    setRunKey(Date.now())
    setView('quiz')
  }

  const handleStart = async (config: QuizConfig) => {
    setLoading(true)
    setError(null)
    setSummary(null)

    try {
      const linkInfo = parseGoogleSheetLink(config.csvUrl)

      if (needsSheetSelection(linkInfo)) {
        const options = await fetchPublishedSheetList(linkInfo)
        setSheetSelection({ linkInfo, options, config })
        setView('sheet-select')
        return
      }

      await loadQuestionsFromSources([buildCsvUrl(linkInfo)], config)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong while loading the CSV.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = (quizSummary: QuizSummary) => {
    setSummary(quizSummary)
    setView('summary')
  }

  const handleRestart = () => {
    setView('config')
    setSheetSelection(null)
  }

  const handleRetake = () => {
    if (!questions.length) {
      setView('config')
      return
    }
    setSummary(null)
    setRunKey(Date.now())
    setView('quiz')
  }

  const handleSheetConfirm = async (gids: string[]) => {
    if (!sheetSelection) {
      return
    }
    setLoading(true)
    setError(null)
    try {
      const urls = gids.map((gid) => buildCsvUrl(sheetSelection.linkInfo, gid))
      await loadQuestionsFromSources(urls, sheetSelection.config)
      setSheetSelection(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong while loading the selected sheets.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const quizTitle = useMemo(() => {
    if (!questions.length) {
      return 'Load a CSV to get started'
    }
    const uniqueModules = new Set(questions.map((q) => q.module))
    return `${uniqueModules.size} modules • ${questions.length} questions`
  }, [questions])

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="eyebrow">EASA B1/B2 Self-Study</p>
          <h1>Targeted drills for confident sign-offs</h1>
          <p className="subtle">{quizTitle}</p>
        </div>
      </header>

      {view === 'config' && (
        <QuizConfigurator loading={loading} lastError={error} defaultUrl="" onStart={handleStart} />
      )}

      {view === 'sheet-select' && sheetSelection && (
        <SheetSelector
          sheets={sheetSelection.options}
          loading={loading}
          onConfirm={handleSheetConfirm}
          onCancel={handleRestart}
        />
      )}

      {view === 'quiz' && !!questions.length && (
        <>
          {mode === 'learning' ? (
            <LearningQuiz key={runKey} questions={questions} onExit={handleRestart} onComplete={handleComplete} />
          ) : (
            <TimedQuiz
              key={runKey}
              questions={questions}
              timeLimitMinutes={configSnapshot?.timeLimitMinutes ?? 20}
              onExit={handleRestart}
              onComplete={handleComplete}
            />
          )}
        </>
      )}

      {view === 'summary' && summary && (
        <SummaryPanel summary={summary} onRestart={handleRestart} onRetake={handleRetake} />
      )}
    </div>
  )
}

export default App
