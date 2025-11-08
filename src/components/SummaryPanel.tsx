import type { QuizSummary } from '../types'

interface Props {
  summary: QuizSummary
  onRestart(): void
  onRetake(): void
}

const formatPercent = (value: number) => `${Math.round(value * 100)}%`

const SummaryPanel = ({ summary, onRestart, onRetake }: Props) => {
  const { correct, total, incorrect, skipped } = summary

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <p className="eyebrow">Session complete</p>
          <h2>
            Score: {correct}/{total} ({formatPercent(summary.accuracy)})
          </h2>
          {summary.timing && (
            <p className="subtle">
              Time spent: {Math.round(summary.timing.elapsedSeconds / 60)} min of{' '}
              {summary.timing.limitSeconds ? Math.round(summary.timing.limitSeconds / 60) : '—'}
            </p>
          )}
        </div>
        <div className="header-actions">
          <button type="button" className="ghost" onClick={onRestart}>
            Back to setup
          </button>
          <button type="button" className="primary" onClick={onRetake}>
            Retake now
          </button>
        </div>
      </header>

      <div className="summary-grid">
        <div className="stat success">
          <p className="eyebrow">Correct</p>
          <strong>{correct}</strong>
        </div>

        <div className="stat warn">
          <p className="eyebrow">Incorrect</p>
          <strong>{incorrect}</strong>
        </div>

        <div className="stat neutral">
          <p className="eyebrow">Skipped</p>
          <strong>{skipped}</strong>
        </div>
      </div>

      <section className="grid-2">
        <article>
          <h3>Went well</h3>
          {summary.strengths.length ? (
            <ul>
              {summary.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="subtle">Complete another run to surface consistent strengths.</p>
          )}
        </article>

        <article>
          <h3>Focus next</h3>
          {summary.focus.length ? (
            <ul>
              {summary.focus.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="subtle">No critical gaps detected—consider raising the difficulty.</p>
          )}
        </article>
      </section>

      <section>
        <h3>Performance by submodule</h3>
        <div className="table">
          <div className="table__row table__head">
            <span>Submodule</span>
            <span>Accuracy</span>
            <span>Questions</span>
          </div>
          {summary.bySubmodule.map((stat) => (
            <div key={`${stat.module}-${stat.submodule ?? stat.label}`} className="table__row">
              <span>
                <strong>{stat.submodule ?? stat.label}</strong>
                {stat.module && <div className="subtle">{stat.module}</div>}
              </span>
              <span>{formatPercent(stat.accuracy)}</span>
              <span>{stat.total}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3>Question review</h3>
        <div className="review-list">
          {summary.questions.map((item) => (
            <article key={item.questionId} className={`review-card ${item.wasCorrect ? 'success' : 'warn'}`}>
              <header>
                <p className="eyebrow">
                  {item.module} / {item.submodule}
                </p>
                <h4>{item.prompt}</h4>
              </header>
              <p>
                Your answer: <strong>{item.selected?.toUpperCase() ?? '—'}</strong> | Correct:{' '}
                <strong>{item.correctAnswer.toUpperCase()}</strong>
              </p>
              {item.explanation && <p className="subtle">{item.explanation}</p>}
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default SummaryPanel
