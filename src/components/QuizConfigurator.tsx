import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
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
  const [sourceLabel, setSourceLabel] = useState<string | undefined>(undefined)
  const [selectedPresetUrl, setSelectedPresetUrl] = useState<string | null>(null)
  const [activeBankTab, setActiveBankTab] = useState<'quickstart' | 'custom'>(
    featuredSets.length ? 'quickstart' : 'custom',
  )

  useEffect(() => {
    if (!featuredSetsLoading && !featuredSets.length && activeBankTab === 'quickstart') {
      setActiveBankTab('custom')
    }
  }, [featuredSetsLoading, featuredSets.length, activeBankTab])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!csvUrl.trim()) {
      return
    }
    handleStartWithUrl(csvUrl.trim(), sourceLabel)
  }

  const handleStartWithUrl = (url: string, label?: string) => {
    onStart({
      csvUrl: url,
      mode,
      timeLimitMinutes: timeLimit > 0 ? timeLimit : 15,
      questionLimit: questionLimit ? Number(questionLimit) : undefined,
      shuffle,
      sourceLabel: label,
    })
  }

  const handleFeaturedSelect = (set: FeaturedQuestionSet) => {
    setCsvUrl(set.url)
    setSourceLabel(set.label)
    setSelectedPresetUrl(set.url)
    setActiveBankTab('quickstart')
  }

  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCsvUrl(event.target.value)
    setSourceLabel(undefined)
    setSelectedPresetUrl(null)
  }

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <p className="eyebrow">Step 1</p>
          <h2>Choose your question bank</h2>
        </div>
      </header>

      <div className="panel__subsection">
        <div className="panel-tabs" role="tablist" aria-label="Question bank source">
          <button
            type="button"
            role="tab"
            aria-selected={activeBankTab === 'quickstart'}
            className={`panel-tab ${activeBankTab === 'quickstart' ? 'active' : ''}`}
            onClick={() => setActiveBankTab('quickstart')}
          >
            Quick start
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeBankTab === 'custom'}
            className={`panel-tab ${activeBankTab === 'custom' ? 'active' : ''}`}
            onClick={() => setActiveBankTab('custom')}
          >
            Custom Google Sheet
          </button>
        </div>

        {activeBankTab === 'quickstart' ? (
          <div className="preset-block">
            <div className="panel__subheading">
              <p className="eyebrow">Quick start</p>
              <h4 className="panel__subheading-title">Start with a curated question set</h4>
            </div>

            {featuredSetsLoading && <p className="subtle">Loading available question sets…</p>}

            {featuredSetsError && !featuredSetsLoading && <p className="error">{featuredSetsError}</p>}

            {!featuredSetsLoading && !featuredSetsError && featuredSets.length > 0 ? (
              <div className="preset-grid">
                {featuredSets.map((set) => (
                  <button
                    type="button"
                    key={set.url}
                    className={`preset-card ${selectedPresetUrl === set.url ? 'preset-card--selected' : ''}`}
                    onClick={() => handleFeaturedSelect(set)}
                    disabled={loading}
                  >
                    <span>{set.label}</span>
                    <small>Load and combine with the settings below</small>
                  </button>
                ))}
              </div>
            ) : (
              <p className="subtle">No curated sets are available right now. Switch to the custom tab to paste your own CSV.</p>
            )}
          </div>
        ) : (
          <div className="preset-block">
            <div className="panel__subheading">
              <p className="eyebrow">Custom source</p>
              <h4 className="panel__subheading-title">Insert a Google Sheets publish-to-web URL</h4>
            </div>

            <label className="form-row">
              <span className="form-row__label">Google Sheets published URL</span>
              <input
                type="url"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={csvUrl}
                onChange={handleUrlChange}
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
          </div>
        )}
      </div>

      <form className="config-form" onSubmit={handleSubmit}>
        <div className="panel__subsection">
          <p className="eyebrow">Step 2</p>
          <h2>Configure your quiz</h2>
        </div>

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
