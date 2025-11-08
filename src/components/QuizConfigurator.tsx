import { useState } from 'react'
import type { QuizMode } from '../types'

export interface QuizConfig {
  csvUrl: string
  mode: QuizMode
  timeLimitMinutes: number
  questionLimit?: number
  shuffle: boolean
  sourceLabel?: string
}

export interface FeaturedQuestionSet {
  label: string
  url: string
}

interface Props {
  loading: boolean
  lastError?: string | null
  defaultUrl?: string
  onStart(config: QuizConfig): void
  featuredSets?: FeaturedQuestionSet[]
  featuredSetsLoading?: boolean
  featuredSetsError?: string | null
}

const SAMPLE_PATH = '/sample-question-bank.csv'

const QuizConfigurator = ({
  loading,
  lastError,
  defaultUrl = '',
  onStart,
  featuredSets = [],
  featuredSetsLoading = false,
  featuredSetsError = null,
}: Props) => {
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
    handleStartWithUrl(csvUrl.trim())
  }

  const handleUseSample = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    setCsvUrl(`${origin}${SAMPLE_PATH}`)
  }

  const handleStartWithUrl = (url: string, sourceLabel?: string) => {
    onStart({
      csvUrl: url,
      mode,
      timeLimitMinutes: timeLimit > 0 ? timeLimit : 15,
      questionLimit: questionLimit ? Number(questionLimit) : undefined,
      shuffle,
      sourceLabel,
    })
  }

  const handleFeaturedStart = (url: string) => {
    setCsvUrl(url)
    const label = featuredSets.find((set) => set.url === url)?.label
    handleStartWithUrl(url, label)
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

      {(featuredSetsLoading || featuredSetsError || featuredSets.length > 0) && (
        <div className="preset-block">
          <div>
            <p className="eyebrow">Quick start</p>
            <h3 className="preset-block__title">Start with a curated question set</h3>
          </div>

          {featuredSetsLoading && <p className="subtle">Loading available question sets…</p>}

          {featuredSetsError && !featuredSetsLoading && <p className="error">{featuredSetsError}</p>}

          {!featuredSetsLoading && !featuredSetsError && featuredSets.length > 0 && (
            <div className="preset-grid">
              {featuredSets.map((set) => (
                <button
                  type="button"
                  key={set.url}
                  className="preset-card"
                  onClick={() => handleFeaturedStart(set.url)}
                  disabled={loading}
                >
                  <span>{set.label}</span>
                  <small>Load and combine with the settings below</small>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form className="config-form" onSubmit={handleSubmit}>
        <label className="form-row">
          <span className="form-row__label">Google Sheets publish-to-web CSV URL</span>
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

        <details className="csv-guidance">
          <summary>CSV format guide</summary>
          <p>
            Include a header row with <code>module</code>, <code>submodule</code>, <code>question</code>,{' '}
            <code>option_a</code>, <code>option_b</code>, <code>option_c</code>, <code>option_d</code>,{' '}
            <code>correct</code>, <code>explanation</code>, <code>difficulty</code>, and <code>tags</code>. Each
            question needs a prompt, at least one option, and the letter of the correct option (a–d).
          </p>
        </details>

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

        <label className="form-row">
          <span className="form-row__label">Total time limit (minutes)</span>
          <input
            type="number"
            min={1}
            value={timeLimit}
            onChange={(event) => setTimeLimit(Number(event.target.value))}
            disabled={loading || mode === 'learning'}
          />
        </label>

        <label className="form-row">
          <span className="form-row__label">Question cap (optional)</span>
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
