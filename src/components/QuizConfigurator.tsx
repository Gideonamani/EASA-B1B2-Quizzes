import { useState } from 'react'
import type { QuizMode } from '../types'

export interface QuizConfig {
  csvUrl: string
  mode: QuizMode
  timeLimitMinutes: number
  questionLimit?: number
  shuffle: boolean
}

interface Props {
  loading: boolean
  lastError?: string | null
  defaultUrl?: string
  onStart(config: QuizConfig): void
}

const SAMPLE_PATH = '/sample-question-bank.csv'

const QuizConfigurator = ({ loading, lastError, defaultUrl = '', onStart }: Props) => {
  const [csvUrl, setCsvUrl] = useState(defaultUrl)
  const [mode, setMode] = useState<QuizMode>('learning')
  const [timeLimit, setTimeLimit] = useState(15)
  const [questionLimit, setQuestionLimit] = useState<number | ''>('')
  const [shuffle, setShuffle] = useState(true)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!csvUrl.trim()) {
      return
    }
    onStart({
      csvUrl: csvUrl.trim(),
      mode,
      timeLimitMinutes: timeLimit > 0 ? timeLimit : 15,
      questionLimit: questionLimit ? Number(questionLimit) : undefined,
      shuffle,
    })
  }

  const handleUseSample = () => {
    setCsvUrl(SAMPLE_PATH)
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <p className="eyebrow">Step 1</p>
          <h2>Load a question bank</h2>
        </div>
        <button type="button" className="ghost" onClick={handleUseSample} disabled={loading}>
          Use bundled sample
        </button>
      </header>

      <form className="config-form" onSubmit={handleSubmit}>
        <label>
          Google Sheets publish-to-web CSV URL
          <input
            type="url"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={csvUrl}
            onChange={(event) => setCsvUrl(event.target.value)}
            required
            disabled={loading}
          />
          <small>
            From Google Sheets: <em>File → Share → Publish to web → CSV</em>. Paste the generated link (or any
            CSV endpoint) here.
          </small>
        </label>

        <fieldset className="inline">
          <legend>Quiz mode</legend>
          <label className="radio">
            <input
              type="radio"
              name="mode"
              value="learning"
              checked={mode === 'learning'}
              onChange={() => setMode('learning')}
              disabled={loading}
            />
            Learning — one question at a time with instant feedback
          </label>
          <label className="radio">
            <input
              type="radio"
              name="mode"
              value="timed"
              checked={mode === 'timed'}
              onChange={() => setMode('timed')}
              disabled={loading}
            />
            Timed exam — full set with answers revealed at the end
          </label>
        </fieldset>

        <label>
          Time limit (minutes)
          <input
            type="number"
            min={1}
            value={timeLimit}
            onChange={(event) => setTimeLimit(Number(event.target.value))}
            disabled={loading || mode === 'learning'}
          />
        </label>

        <label>
          Question cap (optional)
          <input
            type="number"
            min={1}
            placeholder="e.g. 25"
            value={questionLimit}
            onChange={(event) => {
              const value = event.target.value
              setQuestionLimit(value ? Number(value) : '')
            }}
            disabled={loading}
          />
          <small>Use this to pull a smaller randomized subset for a quick drill.</small>
        </label>

        <label className="checkbox">
          <input type="checkbox" checked={shuffle} onChange={() => setShuffle((value) => !value)} disabled={loading} />
          Shuffle questions
        </label>

        {lastError && <p className="error">{lastError}</p>}

        <button type="submit" className="primary" disabled={loading}>
          {loading ? 'Loading questions…' : 'Start quiz'}
        </button>
      </form>
    </section>
  )
}

export default QuizConfigurator
