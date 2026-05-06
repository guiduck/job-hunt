import { useEffect, useState } from "react"

import { fetchResumeFile } from "../../api/client"
import { usePopupStore } from "../../store/popupStore"
import { ResumeSettingsPanel } from "./ResumeSettingsPanel"

export function SettingsView() {
  const connectGoogle = usePopupStore((state) => state.connectGoogle)
  const disconnectGoogle = usePopupStore((state) => state.disconnectGoogle)
  const providerAccount = usePopupStore((state) => state.providerAccount)
  const resumes = usePopupStore((state) => state.resumes)
  const setDefaultResume = usePopupStore((state) => state.setDefaultResume)
  const userSettings = usePopupStore((state) => state.userSettings)
  const refreshEmailSetup = usePopupStore((state) => state.refreshEmailSetup)
  const updateUserSettings = usePopupStore((state) => state.updateUserSettings)
  const [previewResumeId, setPreviewResumeId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [operatorName, setOperatorName] = useState("")
  const [operatorEmail, setOperatorEmail] = useState("")
  const [portfolioUrl, setPortfolioUrl] = useState("")
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null)
  const defaultResume = resumes.find((resume) => resume.is_default)
  const googleConnected = providerAccount?.auth_status === "authorized"

  useEffect(() => {
    void refreshEmailSetup()
  }, [refreshEmailSetup])

  useEffect(() => {
    setOperatorName(userSettings?.operator_name || "")
    setOperatorEmail(userSettings?.operator_email || "")
    setPortfolioUrl(userSettings?.portfolio_url || "")
    setSettingsFeedback(null)
  }, [userSettings?.operator_email, userSettings?.operator_name, userSettings?.portfolio_url])

  useEffect(() => {
    if (!previewResumeId) {
      setPreviewUrl(null)
      setPreviewError(null)
      return
    }

    let objectUrl: string | null = null
    const controller = new AbortController()
    setPreviewUrl(null)
    setPreviewError(null)
    fetchResumeFile(previewResumeId, { signal: controller.signal })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setPreviewError(error instanceof Error ? error.message : "Could not load resume preview.")
        }
      })

    return () => {
      controller.abort()
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [previewResumeId])

  async function saveProfileSettings() {
    await updateUserSettings({
      operator_name: operatorName.trim() || null,
      operator_email: operatorEmail.trim() || null,
      portfolio_url: portfolioUrl.trim() || null
    })
    setSettingsFeedback("Profile settings saved.")
  }

  return (
    <section className="panel">
      <h2>Full-time settings</h2>
      <p className="muted">Connect Google, choose the sender Gmail account, and upload your default PDF resume.</p>

      <div className="settings-card">
        <div>
          <strong>Google email sender</strong>
          <span>{providerAccount?.display_email || userSettings?.operator_email || "No Google account connected"}</span>
          <span>Status: {providerAccount?.auth_status || "not_configured"}</span>
        </div>
        <div className="button-stack">
          {googleConnected ? (
            <button className="secondary-button" onClick={() => void disconnectGoogle()} type="button">
              Disconnect Google
            </button>
          ) : (
            <button className="primary-button" onClick={() => void connectGoogle()} type="button">
              Connect Google
            </button>
          )}
        </div>
      </div>

      <div className="settings-card">
        <strong>Default resume</strong>
        <span>{defaultResume?.display_name || "No default resume selected"}</span>
      </div>

      <div className="settings-card settings-card--form">
        <strong>Sender profile</strong>
        <label className="field">
          <span>Your name</span>
          <input value={operatorName} onChange={(event) => setOperatorName(event.target.value)} placeholder="Guilherme" />
        </label>
        <label className="field">
          <span>Your email</span>
          <input value={operatorEmail} onChange={(event) => setOperatorEmail(event.target.value)} placeholder="you@example.com" type="email" />
        </label>
        <label className="field">
          <span>Portfolio URL</span>
          <input value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} placeholder="https://your-site.com" type="url" />
        </label>
        <button className="primary-button" onClick={() => void saveProfileSettings()} type="button">
          Save profile
        </button>
        {settingsFeedback ? <p className="message">{settingsFeedback}</p> : null}
      </div>

      <h3>Resumes</h3>
      <ResumeSettingsPanel />
      {resumes.length === 0 ? (
        <p className="message">No resumes registered yet.</p>
      ) : (
        <ul className="stack-list">
          {resumes.map((resume) => (
            <li className="stack-card" key={resume.id}>
              <strong>
                {resume.display_name}
                {resume.is_default ? " (default)" : ""}
              </strong>
              <span>
                {resume.file_name}
                {resume.file_size_bytes ? ` - ${Math.round(resume.file_size_bytes / 1024)} KB` : ""}
              </span>
              <div className="detail-actions">
                <button onClick={() => void setDefaultResume(resume.id)} type="button">
                  Set default
                </button>
                <button onClick={() => setPreviewResumeId(resume.id)} type="button">
                  Preview PDF
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {previewResumeId ? (
        <section className="pdf-preview">
          <div className="detail-header">
            <h3>Resume preview</h3>
            <button className="secondary-button" onClick={() => setPreviewResumeId(null)} type="button">
              Close
            </button>
          </div>
          {previewError ? <p className="message message--error">{previewError}</p> : null}
          {!previewUrl && !previewError ? <p className="message">Loading resume preview...</p> : null}
          {previewUrl ? <iframe src={previewUrl} title="Resume PDF preview" /> : null}
        </section>
      ) : null}
    </section>
  )
}
