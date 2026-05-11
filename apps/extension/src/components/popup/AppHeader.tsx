import { usePopupStore } from "../../store/popupStore"

export function AppHeader() {
  const currentUser = usePopupStore((state) => state.currentUser)
  const logout = usePopupStore((state) => state.logout)
  const enableFieldAssistantForCurrent = usePopupStore((state) => state.enableFieldAssistantForCurrent)

  if (!currentUser) {
    return null
  }

  function openAssistantShell() {
    chrome.runtime.sendMessage({ type: "FIELD_ASSISTANT_OPEN_SHELL" }).catch(() => undefined)
  }

  return (
    <header className="app-header">
      <div className="app-header-row">
        <div>
          <p className="eyebrow">Full-time</p>
          <h1 className="app-title">Opportunity Desk</h1>
        </div>
        <div className="button-row">
          <span className="muted-text">{currentUser.email}</span>
          <button className="header-action" onClick={() => void enableFieldAssistantForCurrent("base_domain").catch(() => undefined)} type="button">
            Enable site
          </button>
          <button className="header-action" onClick={openAssistantShell} type="button">
            Pin assistant
          </button>
          <button className="header-action" onClick={() => void logout()} type="button">
            Log out
          </button>
        </div>
      </div>
      <p className="app-subtitle">Capture LinkedIn posts, review matches, and update job status locally.</p>
    </header>
  )
}
