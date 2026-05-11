type AssistantShellProps = {
  message: string
  minimized?: boolean
  onClose: () => void
  onToggleMinimized: () => void
}

export function AssistantShell({ message, minimized = false, onClose, onToggleMinimized }: AssistantShellProps) {
  return (
    <aside className="od-assistant-shell" data-minimized={minimized}>
      <div className="od-shell-header">
        <span className="od-shell-title">Opportunity Desk</span>
        <div className="od-shell-actions">
          <button className="od-icon-button" onClick={onToggleMinimized} type="button">
            -
          </button>
          <button className="od-icon-button" onClick={onClose} type="button">
            x
          </button>
        </div>
      </div>
      {!minimized ? <div className="od-shell-body">{message}</div> : null}
    </aside>
  )
}
