import { useEffect, useState } from 'react'
import QuizConfigurator, { type FeaturedQuestionSet, type QuizConfig } from './components/QuizConfigurator'
import LearningQuiz from './components/LearningQuiz'
import TimedQuiz from './components/TimedQuiz'
import SummaryPanel from './components/SummaryPanel'
import SheetSelector from './components/SheetSelector'
import SessionPreview from './components/SessionPreview'
import ListQuiz from './components/ListQuiz'
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

interface PendingSession {
  questions: QuizQuestion[]
  config: QuizConfig
  sheetsLabel?: string
}

const FEATURED_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vRm9auFh31r-1f2cVzGlGTxxfonbH-m7eiGa_mKwYRZO4F0yuZRJob4BubJ8SH2y3a5Rb12Ccbf-axu/pub?output=csv'
const FEEDBACK_FORM_URL = 'https://forms.gle/ameMentorFeedback'

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') {
    return 'light'
  }
  const stored = window.localStorage.getItem('ame-theme')
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
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
  const [pendingSession, setPendingSession] = useState<PendingSession | null>(null)
  const [featuredSets, setFeaturedSets] = useState<FeaturedQuestionSet[]>([])
  const [featuredSetsLoading, setFeaturedSetsLoading] = useState(true)
  const [featuredSetsError, setFeaturedSetsError] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getInitialTheme())

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = theme
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ame-theme', theme)
    }
  }, [theme])

  useEffect(() => {
    const linkInfo = parseGoogleSheetLink(FEATURED_SHEET_URL)

    const loadFeaturedSets = async () => {
      setFeaturedSetsLoading(true)
      setFeaturedSetsError(null)

      try {
        if (linkInfo.kind === 'google-sheet') {
          if (needsSheetSelection(linkInfo)) {
            const options = await fetchPublishedSheetList(linkInfo)
            setFeaturedSets(
              options.map((option) => ({
                label: option.label,
                url: buildCsvUrl(linkInfo, option.gid),
              })),
            )
          } else {
            setFeaturedSets([
              {
                label: 'Question bank',
                url: buildCsvUrl(linkInfo),
              },
            ])
          }
        } else {
          setFeaturedSets([
            {
              label: 'Question bank',
              url: buildCsvUrl(linkInfo),
            },
          ])
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to load the featured question sets. Please try again later.'
        setFeaturedSetsError(message)
        setFeaturedSets([])
      } finally {
        setFeaturedSetsLoading(false)
      }
    }

    void loadFeaturedSets()
  }, [])

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
    return merged
  }

  const openSessionPreview = (questions: QuizQuestion[], config: QuizConfig, sheetsLabel?: string) => {
    setPendingSession({ questions, config, sheetsLabel })
  }

  const handleStart = async (config: QuizConfig) => {
    setLoading(true)
    setError(null)
    setSummary(null)
    setPendingSession(null)

    try {
      const linkInfo = parseGoogleSheetLink(config.csvUrl)

      if (needsSheetSelection(linkInfo)) {
        const options = await fetchPublishedSheetList(linkInfo)
        setSheetSelection({ linkInfo, options, config })
        setView('sheet-select')
        return
      }

      const questions = await loadQuestionsFromSources([buildCsvUrl(linkInfo)], config)
      openSessionPreview(questions, config, config.sourceLabel ?? 'This sheet')
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
    setPendingSession(null)
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
    setPendingSession(null)
    try {
      const urls = gids.map((gid) => buildCsvUrl(sheetSelection.linkInfo, gid))
      const questions = await loadQuestionsFromSources(urls, sheetSelection.config)
      const label = gids.length === sheetSelection.options.length
        ? 'All sets'
        : sheetSelection.options
            .filter((option) => gids.includes(option.gid))
            .map((option) => option.label)
            .join(', ')
      openSessionPreview(questions, sheetSelection.config, label)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong while loading the selected sheets.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const launchSession = () => {
    if (!pendingSession) {
      return
    }
    setQuestions(pendingSession.questions)
    setMode(pendingSession.config.mode)
    setConfigSnapshot(pendingSession.config)
    setRunKey(Date.now())
    setPendingSession(null)
    setSheetSelection(null)
    setView('quiz')
  }

  return (
    <>
      <div className="app">
        <header className="app__header">
          <div className="app__top">
            <div>
              <p className="eyebrow">EASA B1/B2 Self-Study</p>
              <h1>Train with purpose. Pass with confidence.</h1>
            </div>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
            >
              {theme === 'light' ? '🌞 Light' : '🌙 Dark'}
            </button>
          </div>
        </header>

      {view === 'config' && (
        <QuizConfigurator
          loading={loading}
          lastError={error}
          defaultUrl=""
          onStart={handleStart}
          featuredSets={featuredSets}
          featuredSetsLoading={featuredSetsLoading}
          featuredSetsError={featuredSetsError}
        />
      )}

      {view === 'sheet-select' && sheetSelection && (
        <SheetSelector
          sheets={sheetSelection.options}
          loading={loading}
          onConfirm={handleSheetConfirm}
          onCancel={handleRestart}
        />
      )}

      {pendingSession && (
        <SessionPreview
          questionCount={pendingSession.questions.length}
          mode={pendingSession.config.mode}
          timeLimitMinutes={pendingSession.config.timeLimitMinutes}
          sheetsLabel={pendingSession.sheetsLabel || pendingSession.config.sourceLabel}
          shuffle={pendingSession.config.shuffle}
          onAdjust={() => setPendingSession(null)}
          onLaunch={launchSession}
        />
      )}

      {view === 'quiz' && !!questions.length && (
        <>
          {mode === 'learning' ? (
            configSnapshot?.questionLayout === 'list' ? (
              <ListQuiz key={runKey} questions={questions} onExit={handleRestart} onComplete={handleComplete} />
            ) : (
              <LearningQuiz key={runKey} questions={questions} onExit={handleRestart} onComplete={handleComplete} />
            )
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
    <footer className="app-footer">
      <p>
        Have comments or suggestions?{' '}
        <a href={FEEDBACK_FORM_URL} target="_blank" rel="noreferrer">
          Send us a quick note ↗
        </a>
      </p>
    </footer>
    </>
  )
}

export default App
