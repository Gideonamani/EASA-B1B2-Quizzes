import { useEffect, useMemo, useState } from 'react'
import type { SheetOption } from '../utils/googleSheets'

interface Props {
  sheets: SheetOption[]
  loading: boolean
  onConfirm(selectedGids: string[]): void
  onCancel(): void
}

const SheetSelector = ({ sheets, loading, onConfirm, onCancel }: Props) => {
  const [selection, setSelection] = useState<Set<string>>(new Set(sheets.map((sheet) => sheet.gid)))

  useEffect(() => {
    setSelection(new Set(sheets.map((sheet) => sheet.gid)))
  }, [sheets])

  const toggle = (gid: string) => {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(gid)) {
        next.delete(gid)
      } else {
        next.add(gid)
      }
      return next
    })
  }

  const handleSubmit = () => {
    if (!selection.size) {
      return
    }
    const selectedGids = Array.from(selection)
    onConfirm(selectedGids)
  }

  const selectAll = () => setSelection(new Set(sheets.map((sheet) => sheet.gid)))
  const clearAll = () => setSelection(new Set())

  const allSelected = selection.size === sheets.length
  const selectionSummary = useMemo(() => {
    if (selection.size === sheets.length) {
      return 'All sets selected'
    }
    if (!selection.size) {
      return 'No sets selected'
    }
    return `${selection.size} of ${sheets.length} selected`
  }, [selection, sheets.length])

  return (
    <section className="panel">
      <header className="panel__header">
        <div>
          <p className="eyebrow">Question sets detected</p>
          <h2>Select which sheets to include</h2>
          <p className="subtle">
            We found multiple published sheets inside this workbook. Choose one or more to build your quiz.{' '}
            <button type="button" className="link-button" onClick={selectAll}>
              Select all
            </button>{' '}
            ·{' '}
            <button type="button" className="link-button" onClick={clearAll}>
              Clear
            </button>
          </p>
        </div>
        <button type="button" className="ghost" onClick={onCancel}>
          Back
        </button>
      </header>

      <div className="sheet-list">
        {sheets.map((sheet) => (
          <label key={sheet.gid} className="checkbox sheet-option">
            <input
              type="checkbox"
              checked={selection.has(sheet.gid)}
              onChange={() => toggle(sheet.gid)}
              disabled={loading}
            />
            <span>{sheet.label}</span>
          </label>
        ))}
      </div>

      <footer className="sheet-actions">
        <p className="subtle">{selectionSummary}</p>
        <div className="question-actions__group">
          <button type="button" className="ghost" onClick={selectAll} disabled={loading || allSelected}>
            Use all sets
          </button>
          <button type="button" className="primary" onClick={handleSubmit} disabled={!selection.size || loading}>
            Build quiz
          </button>
        </div>
      </footer>
    </section>
  )
}

export default SheetSelector
