import { useEffect } from "react"

import type { CaptureProgress, LinkedInJobsProgress } from "../../capture/types"
import { usePopupStore } from "../../store/popupStore"
import { AuthView } from "./AuthView"
import { DashboardView } from "./DashboardView"
import { JobsView } from "./JobsView"
import { SearchHistoryView } from "./SearchHistoryView"
import { SearchView } from "./SearchView"
import { SettingsView } from "./SettingsView"
import { TemplatesView } from "./TemplatesView"

export function PopupContent() {
  const activeTab = usePopupStore((state) => state.activeTab)
  const error = usePopupStore((state) => state.error)
  const authReady = usePopupStore((state) => state.authReady)
  const clearError = usePopupStore((state) => state.clearError)
  const currentUser = usePopupStore((state) => state.currentUser)
  const initializeAuth = usePopupStore((state) => state.initializeAuth)

  useEffect(() => {
    console.info("[Opportunity Desk] popup mounted; initializing auth")
    void initializeAuth()
  }, [initializeAuth])

  return (
    <section className="content">
      {error ? (
        <div className="message-banner message-banner--error">
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={clearError} type="button">
            x
          </button>
        </div>
      ) : null}
      {!authReady ? <p className="empty-state">Checking session...</p> : currentUser ? <ActiveView activeTab={activeTab} /> : <AuthView />}
    </section>
  )
}

function ActiveView({ activeTab }: { activeTab: "dashboard" | "search" | "history" | "jobs" | "templates" | "settings" }) {
  switch (activeTab) {
    case "dashboard":
      return <DashboardView />
    case "search":
      return <SearchView />
    case "history":
      return <SearchHistoryView />
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
  const setLinkedInJobsProgress = usePopupStore((state) => state.setLinkedInJobsProgress)

  useEffect(() => {
    const listener = (message: { type?: string; payload?: CaptureProgress | LinkedInJobsProgress }) => {
      if (message.type === "CAPTURE_PROGRESS" && message.payload) {
        setCaptureProgress(message.payload as CaptureProgress)
      }
      if (message.type === "LINKEDIN_JOBS_EXTERNAL_PROGRESS" && message.payload) {
        setLinkedInJobsProgress(message.payload as LinkedInJobsProgress)
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
    chrome.runtime
      .sendMessage({ type: "GET_LINKEDIN_JOBS_EXTERNAL_PROGRESS" })
      .then((progress: LinkedInJobsProgress) => {
        if (progress) {
          setLinkedInJobsProgress(progress)
        }
      })
      .catch(() => undefined)

    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [setCaptureProgress, setLinkedInJobsProgress])

  return null
}
