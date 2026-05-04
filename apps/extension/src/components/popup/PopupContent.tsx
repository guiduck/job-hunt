import { useEffect } from "react"

import type { CaptureProgress } from "../../capture/types"
import { usePopupStore } from "../../store/popupStore"
import { AuthView } from "./AuthView"
import { DashboardView } from "./DashboardView"
import { JobsView } from "./JobsView"
import { SearchView } from "./SearchView"
import { SettingsView } from "./SettingsView"
import { TemplatesView } from "./TemplatesView"

export function PopupContent() {
  const activeTab = usePopupStore((state) => state.activeTab)
  const error = usePopupStore((state) => state.error)
  const authReady = usePopupStore((state) => state.authReady)
  const currentUser = usePopupStore((state) => state.currentUser)
  const initializeAuth = usePopupStore((state) => state.initializeAuth)

  useEffect(() => {
    void initializeAuth()
  }, [initializeAuth])

  return (
    <section className="content">
      {error ? <p className="message message--error">{error}</p> : null}
      {!authReady ? <p className="empty-state">Checking session...</p> : currentUser ? <ActiveView activeTab={activeTab} /> : <AuthView />}
    </section>
  )
}

function ActiveView({ activeTab }: { activeTab: "dashboard" | "search" | "jobs" | "templates" | "settings" }) {
  switch (activeTab) {
    case "dashboard":
      return <DashboardView />
    case "search":
      return <SearchView />
    case "jobs":
      return <JobsView />
    case "templates":
      return <TemplatesView />
    case "settings":
      return <SettingsView />
  }
}

export function CaptureProgressListener() {
  const setCaptureProgress = usePopupStore((state) => state.setCaptureProgress)

  useEffect(() => {
    const listener = (message: { type?: string; payload?: CaptureProgress }) => {
      if (message.type === "CAPTURE_PROGRESS" && message.payload) {
        setCaptureProgress(message.payload)
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    chrome.runtime
      .sendMessage({ type: "GET_CAPTURE_PROGRESS" })
      .then((progress: CaptureProgress) => {
        if (progress) {
          setCaptureProgress(progress)
        }
      })
      .catch(() => undefined)

    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [setCaptureProgress])

  return null
}
