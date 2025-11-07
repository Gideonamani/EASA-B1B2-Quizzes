import { useEffect, useMemo, useRef, useState } from 'react'
import type { AnswerMap, QuizQuestion, QuizSummary } from '../types'
import { buildSummary } from '../utils/summary'

interface Props {
  questions: QuizQuestion[]
  timeLimitMinutes: number
  onExit(): void
  onComplete(summary: QuizSummary): void
}

const TimedQuiz = ({ questions, timeLimitMinutes, onExit, onComplete }: Props) => {
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [index, setIndex] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(timeLimitMinutes * 60)
  const [status, setStatus] = useState<'running' | 'finished'>('running')
  const answersRef = useRef<AnswerMap>({})

  const limitSeconds = timeLimitMinutes * 60

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    if (status !== 'running') {
      return
    }

    const id = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(id)
          setStatus('finished')
          finalize(true)
          return 0
        }
        return value - 1
      })
    }, 1000)

    return () => window.clearInterval(id)
  }, [status])

  const finalize = (auto = false) => {
    const summary = buildSummary(questions, answersRef.current, {
      mode: 'timed',
      timing: {
        elapsedSeconds: auto ? limitSeconds : limitSeconds - secondsLeft,
        limitSeconds,
      },
    })
    setStatus('finished')
    onComplete(summary)
  }

  const handleSelect = (questionId: string, optionId: string) => {
    if (status !== 'running') {
      return
    }
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  const handleClear = (questionId: string) => {
    setAnswers((prev) => {
      const copy = { ...prev }
      delete copy[questionId]
      return copy
    })
  }

  const progressValue = (Object.keys(answers).length / questions.length) * 100

  const question = questions[index]

  const displayTime = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60)
    const seconds = secondsLeft % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [secondsLeft])

  const unanswered = questions.length - Object.keys(answers).length

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <p className="eyebrow">Timed mode</p>
          <h2>{question.module}</h2>
          <p className="subtle">{question.submodule}</p>
        </div>

        <div className="header-actions">
          <span className={`timer ${secondsLeft < 60 ? 'warn' : ''}`}>{displayTime}</span>
          <button type="button" className="ghost" onClick={onExit}>
            Abort
          </button>
        </div>
      </header>

      <div className="progress-bar">
        <div className="progress-bar__value" style={{ width: `${progressValue}%` }} />
      </div>

      <div className="question-nav">
        {questions.map((item, questionIndex) => {
          const answered = Boolean(answers[item.id])
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-dot ${answered ? 'filled' : ''} ${questionIndex === index ? 'active' : ''}`}
              onClick={() => setIndex(questionIndex)}
            >
              {questionIndex + 1}
            </button>
          )
        })}
      </div>

      <article className="question-card">
        <header>
          <p className="eyebrow">{question.difficulty || 'Mixed difficulty'}</p>
          <h3>{question.prompt}</h3>
        </header>

        <div className="options">
          {question.options.map((option) => {
            const isSelected = answers[question.id] === option.id
            return (
              <button
                key={option.id}
                type="button"
                className={`option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(question.id, option.id)}
              >
                <span className="option__key">{option.id.toUpperCase()}</span>
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>

        <footer className="question-actions">
          <div className="question-actions__group">
            <button type="button" className="ghost" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
              Previous
            </button>
            <button
              type="button"
              className="ghost"
              disabled={index === questions.length - 1}
              onClick={() => setIndex((i) => i + 1)}
            >
              Next
            </button>
          </div>
          <div className="question-actions__group">
            <button type="button" className="ghost" onClick={() => handleClear(question.id)}>
              Clear answer
            </button>
            <button type="button" className="primary" onClick={() => finalize(false)}>
              Submit ({unanswered} left)
            </button>
          </div>
        </footer>
      </article>
    </section>
  )
}

export default TimedQuiz
