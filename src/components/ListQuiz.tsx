import { useEffect, useMemo, useRef, useState } from 'react'
import type { AnswerMap, QuizMode, QuizQuestion, QuizSummary } from '../types'
import { buildSummary } from '../utils/summary'

interface Props {
  questions: QuizQuestion[]
  mode: QuizMode
  timeLimitMinutes?: number
  onExit(): void
  onComplete(summary: QuizSummary): void
}

const ListQuiz = ({ questions, mode, timeLimitMinutes = 20, onExit, onComplete }: Props) => {
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [status, setStatus] = useState<'idle' | 'running' | 'finished'>(mode === 'timed' ? 'running' : 'idle')
  const limitSeconds = mode === 'timed' ? Math.max(1, timeLimitMinutes) * 60 : null
  const [secondsLeft, setSecondsLeft] = useState(limitSeconds ?? 0)
  const answersRef = useRef<AnswerMap>({})

  const headerEyebrow = mode === 'learning' ? 'Learning mode · list view' : 'Timed mode · list view'
  const headerTitle = mode === 'learning' ? 'Review the full set at once' : 'Answer the full set before time runs out'
  const exitLabel = mode === 'timed' ? 'Abort' : 'Back to setup'

  const total = questions.length
  const attempted = useMemo(() => questions.filter((question) => answers[question.id]).length, [answers, questions])
  const progressPercent = total ? (attempted / total) * 100 : 0
  const progressLabel = `${attempted}/${total} answered`
  const completionLabel = `${Math.round(progressPercent)}% complete`
  const unanswered = total - attempted

  const displayTime = useMemo(() => {
    if (mode !== 'timed' || !limitSeconds) {
      return null
    }
    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [mode, secondsLeft, limitSeconds])

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  const finalize = (auto = false) => {
    if (mode === 'timed') {
      setStatus('finished')
    }
    const summary = buildSummary(questions, answersRef.current, {
      mode,
      ...(mode === 'timed' && limitSeconds
        ? {
            timing: {
              elapsedSeconds: auto ? limitSeconds : limitSeconds - secondsLeft,
              limitSeconds,
            },
          }
        : {}),
    })
    onComplete(summary)
  }

  useEffect(() => {
    if (mode !== 'timed' || !limitSeconds || status !== 'running') {
      return
    }

    const id = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(id)
          finalize(true)
          return 0
        }
        return value - 1
      })
    }, 1000)

    return () => window.clearInterval(id)
  }, [mode, status, limitSeconds])

  const handleSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      if (mode === 'learning' && prev[questionId]) {
        return prev
      }
      return { ...prev, [questionId]: optionId }
    })
  }

  const handleSubmit = () => {
    if (mode === 'timed') {
      if (status !== 'running') {
        return
      }
      if (unanswered > 0) {
        const confirmed = window.confirm(
          `You still have ${unanswered} unanswered question${unanswered === 1 ? '' : 's'}. Submit anyway?`,
        )
        if (!confirmed) {
          return
        }
      }
    }
    finalize(false)
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <p className="eyebrow">{headerEyebrow}</p>
          <h2>{headerTitle}</h2>
          <p className="subtle">{progressLabel}</p>
        </div>
        <div className="header-actions">
          {mode === 'timed' && displayTime && (
            <span className={`timer ${secondsLeft < 60 ? 'warn' : ''}`}>{displayTime}</span>
          )}
          <button type="button" className="ghost" onClick={onExit}>
            {exitLabel}
          </button>
        </div>
      </header>

      <div className="list-progress" aria-live="polite">
        <div className="list-progress__meta">
          <span className="list-progress__count">{progressLabel}</span>
          <span className="list-progress__percent">{completionLabel}</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar__value" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="question-list">
        {questions.map((question, index) => {
          const selected = answers[question.id]
          const isCorrect = selected === question.correctOption
          const explanation =
            mode === 'learning' && selected
              ? selected === question.correctOption
                ? question.explanation || 'Great work — you nailed it.'
                : question.explanation || 'Review your notes for this topic and try again.'
              : null

          return (
            <article key={question.id} className="question-card">
              <header className="question-card__header">
                <span className="question-card__number" aria-hidden="true">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <div>
                  <p className="eyebrow">
                    {question.module} · {question.submodule}
                  </p>
                  <h3>{question.prompt}</h3>
                </div>
              </header>

              <div className="options">
                {question.options.map((option) => {
                  const revealState =
                    mode === 'learning' && selected
                      ? option.id === question.correctOption
                        ? 'correct'
                        : selected === option.id
                          ? 'incorrect'
                          : undefined
                      : undefined
                  const buttonClasses = ['option']
                  if (selected === option.id) {
                    buttonClasses.push('selected')
                  }
                  if (revealState) {
                    buttonClasses.push(revealState)
                  }
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={buttonClasses.join(' ')}
                      onClick={() => handleSelect(question.id, option.id)}
                      disabled={mode === 'learning' && Boolean(selected)}
                    >
                      <span className="option__key">{option.id.toUpperCase()}</span>
                      <span>{option.label}</span>
                    </button>
                  )
                })}
              </div>

              {mode === 'learning' && selected && (
                <div className={`flash ${isCorrect ? 'success' : 'warn'}`}>
                  <strong>{isCorrect ? 'Correct' : 'Keep working'}</strong>
                  <p>{explanation}</p>
                </div>
              )}
            </article>
          )
        })}
      </div>

      <footer className="question-actions list-actions">
        <div className="question-actions__group">
          <button type="button" className="ghost" onClick={onExit}>
            {mode === 'timed' ? 'Abort' : 'Cancel'}
          </button>
        </div>
        <div className="question-actions__group">
          <button
            type="button"
            className="primary"
            onClick={handleSubmit}
            disabled={mode === 'timed' ? status !== 'running' : !questions.length}
          >
            {mode === 'timed' ? `Submit (${unanswered} left)` : 'Submit for assessment'}
          </button>
        </div>
      </footer>
    </section>
  )
}

export default ListQuiz
