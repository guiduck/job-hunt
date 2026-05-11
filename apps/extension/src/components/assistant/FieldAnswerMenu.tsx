import type { FieldResponseSuggestion } from "../../api/types"

type FieldAnswerMenuProps = {
  question: string
  answer: string
  suggestions: FieldResponseSuggestion[]
  loading?: boolean
  error?: string | null
  onAnswerChange: (answer: string) => void
  onGenerate: () => void
  onUseSuggestion: (suggestion: FieldResponseSuggestion) => void
  onReplace: () => void
  onAppend: () => void
  onSave: () => void
  onClose: () => void
}

export function FieldAnswerMenu({
  question,
  answer,
  suggestions,
  loading = false,
  error = null,
  onAnswerChange,
  onGenerate,
  onUseSuggestion,
  onReplace,
  onAppend,
  onSave,
  onClose
}: FieldAnswerMenuProps) {
  return (
    <section className="od-field-menu">
      <div className="od-menu-header">
        <span className="od-menu-title">Opportunity Desk</span>
        <button className="od-icon-button" onClick={onClose} type="button">
          x
        </button>
      </div>
      <div className="od-menu-body">
        <span>{question}</span>
        <button className="od-menu-button" disabled={loading} onClick={onGenerate} type="button">
          Generate answer
        </button>
        <div className="od-suggestion-list">
          {suggestions.map((suggestion) => (
            <button className="od-suggestion-button" key={suggestion.id} onClick={() => onUseSuggestion(suggestion)} type="button">
              {suggestion.response_text}
            </button>
          ))}
        </div>
        <textarea className="od-answer-box" onChange={(event) => onAnswerChange(event.target.value)} value={answer} />
        <div className="od-menu-actions">
          <button className="od-menu-button" onClick={onReplace} type="button">
            Replace
          </button>
          <button className="od-menu-button secondary" onClick={onAppend} type="button">
            Append
          </button>
          <button className="od-menu-button secondary" onClick={onSave} type="button">
            Save
          </button>
        </div>
        {error ? <div className="od-menu-error">{error}</div> : null}
      </div>
    </section>
  )
}
