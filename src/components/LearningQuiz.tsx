import { useEffect, useMemo, useState } from 'react'
import type { AnswerMap, QuizQuestion, QuizSummary } from '../types'
import { buildSummary } from '../utils/summary'

interface Props {
  questions: QuizQuestion[]
  onExit(): void
  onComplete(summary: QuizSummary): void
}

const LearningQuiz = ({ questions, onExit, onComplete }: Props) => {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [revealed, setRevealed] = useState(false)

  const question = questions[index]

  const progressLabel = `${index + 1} / ${questions.length}`
  const progressValue = ((index + 1) / questions.length) * 100

  const answered = Boolean(answers[question.id])
  const selected = answers[question.id]
  const isCorrect = selected === question.correctOption

  const disabledOptions = revealed

  const handleAnswer = (optionId: string) => {
    if (revealed) {
      return
    }
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }))
    setRevealed(true)
  }

  const handleNext = () => {
    if (index < questions.length - 1) {
      setIndex((value) => value + 1)
    }
  }

  const handlePrev = () => {
    if (index > 0) {
      setIndex((value) => value - 1)
    }
  }

  const handleSkip = () => {
    setRevealed(false)
    handleNext()
  }

  const handleFinish = () => {
    const summary = buildSummary(questions, answers, {
      mode: 'learning',
    })
    onComplete(summary)
  }

  useEffect(() => {
    const current = questions[index]
    setRevealed(Boolean(current && answers[current.id]))
  }, [index, answers, questions])

  const explanation = useMemo(() => {
    if (!revealed) {
      return null
    }
    if (isCorrect) {
      return question.explanation ? question.explanation : 'Great work — you nailed it.'
    }
    return question.explanation || 'Review your notes for this topic and try again.'
  }, [revealed, isCorrect, question])

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <p className="eyebrow">Learning mode</p>
          <h2>{question.module}</h2>
          <p className="subtle">{question.submodule}</p>
        </div>

        <div className="header-actions">
          <span className="pill">{progressLabel}</span>
          <button type="button" className="ghost" onClick={onExit}>
            Back to setup
          </button>
        </div>
      </header>

      <div className="progress-bar">
        <div className="progress-bar__value" style={{ width: `${progressValue}%` }} />
      </div>

      <article className="question-card">
        <header>
          <p className="eyebrow">{question.difficulty || 'Mixed difficulty'}</p>
          <h3>{question.prompt}</h3>
        </header>

        <div className="options">
          {question.options.map((option) => {
            const isSelected = selected === option.id
            const revealState = revealed
              ? option.id === question.correctOption
                ? 'correct'
                : isSelected
                  ? 'incorrect'
                  : undefined
              : undefined
            return (
              <button
                key={option.id}
                type="button"
                className={`option ${revealState ?? ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => handleAnswer(option.id)}
                disabled={disabledOptions}
              >
                <span className="option__key">{option.id.toUpperCase()}</span>
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>

        {revealed && (
          <div className={`flash ${isCorrect ? 'success' : 'warn'}`}>
            <strong>{isCorrect ? 'Correct' : 'Keep working'}</strong>
            <p>{explanation}</p>
          </div>
        )}

        <footer className="question-actions">
          <div className="question-actions__group">
            <button type="button" className="ghost" disabled={index === 0} onClick={handlePrev}>
              Previous
            </button>
            <button type="button" className="ghost" disabled={index === questions.length - 1} onClick={handleSkip}>
              Skip
            </button>
          </div>

          <div className="question-actions__group">
            {index < questions.length - 1 && (
              <button type="button" className="primary" disabled={!answered} onClick={handleNext}>
                Next question
              </button>
            )}
            {index === questions.length - 1 && (
              <button type="button" className="primary" onClick={handleFinish}>
                Finish session
              </button>
            )}
          </div>
        </footer>
      </article>
    </section>
  )
}

export default LearningQuiz
