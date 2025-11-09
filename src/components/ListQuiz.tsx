import { useMemo, useState } from 'react'
import type { AnswerMap, QuizQuestion, QuizSummary } from '../types'
import { buildSummary } from '../utils/summary'

interface Props {
  questions: QuizQuestion[]
  onExit(): void
  onComplete(summary: QuizSummary): void
}

const ListQuiz = ({ questions, onExit, onComplete }: Props) => {
  const [answers, setAnswers] = useState<AnswerMap>({})

  const total = questions.length
  const attempted = useMemo(() => questions.filter((question) => answers[question.id]).length, [answers, questions])
  const progressPercent = total ? (attempted / total) * 100 : 0
  const progressLabel = `${attempted}/${total} answered`
  const completionLabel = `${Math.round(progressPercent)}% complete`

  const handleSelect = (questionId: string, optionId: string) => {
    if (answers[questionId]) {
      return
    }
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  const handleSubmit = () => {
    const summary = buildSummary(questions, answers, { mode: 'learning' })
    onComplete(summary)
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <p className="eyebrow">Learning mode · list view</p>
          <h2>Review the full set at once</h2>
          <p className="subtle">
            {attempted}/{questions.length} answered
          </p>
        </div>
        <button type="button" className="ghost" onClick={onExit}>
          Back to setup
        </button>
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
          const explanation = selected
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
                  const revealState = selected
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
                      disabled={Boolean(selected)}
                    >
                      <span className="option__key">{option.id.toUpperCase()}</span>
                      <span>{option.label}</span>
                    </button>
                  )
                })}
              </div>

              {selected && (
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
            Cancel
          </button>
        </div>
        <div className="question-actions__group">
          <button type="button" className="primary" onClick={handleSubmit} disabled={!questions.length}>
            Submit for assessment
          </button>
        </div>
      </footer>
    </section>
  )
}

export default ListQuiz
