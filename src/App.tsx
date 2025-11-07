import { useMemo, useState } from 'react'
import QuizConfigurator, { type QuizConfig } from './components/QuizConfigurator'
import LearningQuiz from './components/LearningQuiz'
import TimedQuiz from './components/TimedQuiz'
import SummaryPanel from './components/SummaryPanel'
import type { QuizMode, QuizQuestion, QuizSummary } from './types'
import { fetchQuestionsFromCsv } from './utils/csv'
import { shuffle } from './utils/shuffle'
import './App.css'

type View = 'config' | 'quiz' | 'summary'

function App() {
  const [view, setView] = useState<View>('config')
  const [mode, setMode] = useState<QuizMode>('learning')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [summary, setSummary] = useState<QuizSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [configSnapshot, setConfigSnapshot] = useState<QuizConfig | null>(null)
  const [runKey, setRunKey] = useState(() => Date.now())

  const handleStart = async (config: QuizConfig) => {
    setLoading(true)
    setError(null)
    setSummary(null)

    try {
      let loadedQuestions = await fetchQuestionsFromCsv(config.csvUrl)
      if (config.shuffle) {
        loadedQuestions = shuffle(loadedQuestions)
      }
      if (config.questionLimit) {
        loadedQuestions = loadedQuestions.slice(0, config.questionLimit)
      }
      setQuestions(loadedQuestions)
      setMode(config.mode)
      setConfigSnapshot(config)
      setRunKey(Date.now())
      setView('quiz')
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
