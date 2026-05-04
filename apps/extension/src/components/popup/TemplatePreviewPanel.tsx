import type { RenderedPreview } from "../../api/types"

export function TemplatePreviewPanel({ preview }: { preview: RenderedPreview | null }) {
  if (!preview) {
    return <p className="message">Create or select a template to preview rendered content.</p>
  }

  return (
    <aside className="template-preview">
      <h3>Preview</h3>
      {preview.warnings.length > 0 ? (
        <ul className="warning-list">
          {preview.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
      <strong>{preview.subject}</strong>
      <pre>{preview.body}</pre>
    </aside>
  )
}
