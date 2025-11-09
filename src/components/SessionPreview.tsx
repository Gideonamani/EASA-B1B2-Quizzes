import Modal from './Modal'

interface Props {
  questionCount: number
  mode: 'learning' | 'timed'
  timeLimitMinutes?: number
  sheetsLabel?: string
  shuffle: boolean
  questionLayout: 'single' | 'list'
  onAdjust(): void
  onLaunch(): void
}

const SessionPreview = ({
  questionCount,
  mode,
  timeLimitMinutes,
  sheetsLabel,
  shuffle,
  questionLayout,
  onAdjust,
  onLaunch,
}: Props) => {
  const layoutLabel = questionLayout === 'list' ? 'All questions (list view)' : 'Single-card (one question at a time)'

  return (
    <Modal
      title="Ready to launch"
      actions={
        <>
          <button type="button" className="ghost" onClick={onAdjust}>
            Adjust config
          </button>
          <button type="button" className="primary" onClick={onLaunch}>
            Start quiz
          </button>
        </>
      }
    >
      <p className="subtle">Double-check these settings before you dive in.</p>
      <ul className="preview-list">
        <li>
          <strong>Mode:</strong> {mode === 'learning' ? 'Learning practice' : 'Timed exam'}
        </li>
        {mode === 'timed' && timeLimitMinutes && (
          <li>
            <strong>Total time limit:</strong> {timeLimitMinutes} minutes
          </li>
        )}
        <li>
          <strong>Questions:</strong> {questionCount}
        </li>
        <li>
          <strong>Layout:</strong> {layoutLabel}
        </li>
        {sheetsLabel && (
          <li>
            <strong>Sets:</strong> {sheetsLabel}
          </li>
        )}
        <li>
          <strong>Shuffle:</strong> {shuffle ? 'Enabled' : 'Disabled'}
        </li>
      </ul>
    </Modal>
  )
}

export default SessionPreview
