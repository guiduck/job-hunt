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
        <div className="header-controls">
          <div className="header-account-row">
            <span className="header-email">{currentUser.email}</span>
            <button className="header-action" onClick={() => void logout()} type="button">
              <HeaderIcon name="logout" />
              <span>Log out</span>
            </button>
          </div>
          <div className="header-assistant-row">
            <button className="header-action" onClick={() => void enableFieldAssistantForCurrent("base_domain").catch(() => undefined)} type="button">
              <HeaderIcon name="site" />
              <span>Enable site</span>
            </button>
            <button className="header-action" onClick={openAssistantShell} type="button">
              <HeaderIcon name="pin" />
              <span>Pin assistant</span>
            </button>
          </div>
        </div>
      </div>
      <p className="app-subtitle">Capture LinkedIn posts, review matches, and update job status locally.</p>
    </header>
  )
}

function HeaderIcon({ name }: { name: "logout" | "site" | "pin" }) {
  if (name === "logout") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M5 4h8v2H7v12h6v2H5V4Zm10.6 4.4L19.2 12l-3.6 3.6-1.4-1.4 1.2-1.2H10v-2h5.4l-1.2-1.2 1.4-1.4Z" />
      </svg>
    )
  }
  if (name === "site") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm6.7 8h-3.1a13 13 0 0 0-1.1-5 7.02 7.02 0 0 1 4.2 5ZM12 5.1c.7 1 1.4 2.9 1.6 5.9h-3.2c.2-3 .9-4.9 1.6-5.9ZM5.3 13h3.1c.1 1.9.5 3.6 1.1 5a7.02 7.02 0 0 1-4.2-5Zm3.1-2H5.3a7.02 7.02 0 0 1 4.2-5 13 13 0 0 0-1.1 5Zm3.6 7.9c-.7-1-1.4-2.9-1.6-5.9h3.2c-.2 3-.9 4.9-1.6 5.9Zm2.5-.9c.6-1.4 1-3.1 1.1-5h3.1a7.02 7.02 0 0 1-4.2 5Z" />
      </svg>
    )
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M14 3 21 10l-2 2-1.2-1.2-3.5 3.5.4 3.2-1.5 1.5-3.8-3.8L5 19.6 4.4 19l4.4-4.4L5 10.8l1.5-1.5 3.2.4 3.5-3.5L12 5l2-2Z" />
    </svg>
  )
}
