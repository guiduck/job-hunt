import { usePopupStore } from "../../store/popupStore"

export function AppHeader() {
  const currentUser = usePopupStore((state) => state.currentUser)
  const logout = usePopupStore((state) => state.logout)

  function openAppWindow() {
    chrome.runtime.sendMessage({ type: "OPEN_APP_WINDOW" }).catch(() => undefined)
  }

  return (
    <header className="app-header">
      <div className="app-header-row">
        <div>
          <p className="eyebrow">Full-time</p>
          <h1 className="app-title">Opportunity Desk</h1>
        </div>
        <div className="button-row">
          {currentUser ? <span className="muted-text">{currentUser.email}</span> : null}
          {currentUser ? (
            <button className="header-action" onClick={() => void logout()} type="button">
              Log out
            </button>
          ) : null}
          <button className="header-action" onClick={openAppWindow} type="button">
            Keep open
          </button>
        </div>
      </div>
      <p className="app-subtitle">Capture LinkedIn posts, review matches, and update job status locally.</p>
    </header>
  )
}
