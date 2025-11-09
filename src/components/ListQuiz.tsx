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

  const attempted = useMemo(() => questions.filter((question) => answers[question.id]).length, [answers, questions])

  const handleSelect = (questionId: string, optionId: string) => {
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

      <div className="question-list">
        {questions.map((question) => {
          const selected = answers[question.id]
          return (
            <article key={question.id} className="question-card">
              <header>
                <p className="eyebrow">
                  {question.module} · {question.submodule}
                </p>
                <h3>{question.prompt}</h3>
              </header>

              <div className="options">
                {question.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`option ${selected === option.id ? 'selected' : ''}`}
                    onClick={() => handleSelect(question.id, option.id)}
                  >
                    <span className="option__key">{option.id.toUpperCase()}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
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
