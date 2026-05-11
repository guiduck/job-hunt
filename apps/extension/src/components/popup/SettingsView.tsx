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
  const setResumeAssistantContext = usePopupStore((state) => state.setResumeAssistantContext)
  const userSettings = usePopupStore((state) => state.userSettings)
  const fieldAssistantActivations = usePopupStore((state) => state.fieldAssistantActivations)
  const refreshEmailSetup = usePopupStore((state) => state.refreshEmailSetup)
  const refreshFieldAssistantActivations = usePopupStore((state) => state.refreshFieldAssistantActivations)
  const enableFieldAssistantForCurrent = usePopupStore((state) => state.enableFieldAssistantForCurrent)
  const updateFieldAssistantActivation = usePopupStore((state) => state.updateFieldAssistantActivation)
  const deleteFieldAssistantActivation = usePopupStore((state) => state.deleteFieldAssistantActivation)
  const updateUserSettings = usePopupStore((state) => state.updateUserSettings)
  const loading = usePopupStore((state) => state.loading)
  const [previewResumeId, setPreviewResumeId] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [operatorName, setOperatorName] = useState("")
  const [operatorEmail, setOperatorEmail] = useState("")
  const [portfolioUrl, setPortfolioUrl] = useState("")
  const [operatorLinkedinUrl, setOperatorLinkedinUrl] = useState("")
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null)
  const [assistantFeedback, setAssistantFeedback] = useState<string | null>(null)
  const defaultResume = resumes.find((resume) => resume.is_default)
  const googleConnected = providerAccount?.auth_status === "authorized"

  useEffect(() => {
    void refreshEmailSetup()
    void refreshFieldAssistantActivations()
  }, [refreshEmailSetup, refreshFieldAssistantActivations])

  useEffect(() => {
    setOperatorName(userSettings?.operator_name || "")
    setOperatorEmail(userSettings?.operator_email || "")
    setPortfolioUrl(userSettings?.portfolio_url || "")
    setOperatorLinkedinUrl(userSettings?.operator_linkedin_url || "")
    setSettingsFeedback(null)
  }, [userSettings?.operator_email, userSettings?.operator_linkedin_url, userSettings?.operator_name, userSettings?.portfolio_url])

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
      portfolio_url: portfolioUrl.trim() || null,
      operator_linkedin_url: operatorLinkedinUrl.trim() || null
    })
    setSettingsFeedback("Profile settings saved.")
  }

  async function addAssistantScope(scopeType: "base_domain" | "exact_page") {
    setAssistantFeedback(null)
    try {
      await enableFieldAssistantForCurrent(scopeType)
      await refreshFieldAssistantActivations()
      setAssistantFeedback(scopeType === "base_domain" ? "Current site enabled." : "Exact page enabled.")
    } catch (error) {
      setAssistantFeedback(error instanceof Error ? error.message : "Could not enable this page.")
    }
  }

  return (
    <section className="panel">
      <h2>Full-time settings</h2>
      <p className="muted">Connect Gmail sending separately from Google sign-in, choose sender details, and upload your default PDF resume.</p>

      <div className="settings-card">
        <div>
          <strong>Google email sender</strong>
          <span>{providerAccount?.display_email || userSettings?.operator_email || "No Google account connected"}</span>
          <span>Status: {providerAccount?.auth_status || "not_configured"}</span>
          <span className="muted">This is Gmail send consent, not your primary app login.</span>
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
        <label className="field">
          <span>LinkedIn URL</span>
          <input
            value={operatorLinkedinUrl}
            onChange={(event) => setOperatorLinkedinUrl(event.target.value)}
            placeholder="https://www.linkedin.com/in/your-profile"
            type="url"
          />
        </label>
        <button className="primary-button" onClick={() => void saveProfileSettings()} type="button">
          Save profile
        </button>
        {settingsFeedback ? <p className="message">{settingsFeedback}</p> : null}
      </div>

      <div className="settings-card field-assistant-settings">
        <div className="settings-section-header">
          <div>
            <strong>AI field assistant</strong>
            <span className="muted">Choose where Opportunity Desk can add the magic-wand button to application text fields.</span>
          </div>
        </div>
        <div className="assistant-action-grid">
          <button
            className="assistant-action-button assistant-action-button--primary"
            disabled={loading}
            onClick={() => void addAssistantScope("base_domain")}
            type="button">
            <span>Add current site</span>
            <small>All pages on this domain</small>
          </button>
          <button className="assistant-action-button" disabled={loading} onClick={() => void addAssistantScope("exact_page")} type="button">
            <span>Add exact page</span>
            <small>Only this URL</small>
          </button>
        </div>
        {assistantFeedback ? <p className="message">{assistantFeedback}</p> : null}
        {fieldAssistantActivations.length === 0 ? (
          <div className="assistant-empty-state">
            <strong>No authorized sites yet</strong>
            <span>Open a job application page, then add the current site or exact page here.</span>
          </div>
        ) : (
          <ul className="assistant-site-list">
            {fieldAssistantActivations.map((activation) => (
              <li className="assistant-site-card" key={activation.id}>
                <div className="assistant-site-main">
                  <div>
                    <strong>{activation.display_name || activation.scope_value}</strong>
                    <span>{activation.scope_value}</span>
                  </div>
                  <div className="assistant-site-badges">
                    <span>{activation.scope_type === "base_domain" ? "Domain" : "Exact page"}</span>
                    <span>{activation.enabled ? "Active" : "Paused"}</span>
                  </div>
                </div>
                <div className="assistant-site-actions">
                  <button
                    className="assistant-small-button"
                    onClick={() => void updateFieldAssistantActivation(activation.id, { enabled: !activation.enabled })}
                    type="button">
                    {activation.enabled ? "Disable" : "Enable"}
                  </button>
                  <button className="assistant-small-button assistant-small-button--danger" onClick={() => void deleteFieldAssistantActivation(activation.id)} type="button">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
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
              <label className="inline-check">
                <input
                  checked={resume.include_in_field_assistant_context}
                  disabled={loading || !resume.is_available}
                  onChange={(event) => void setResumeAssistantContext(resume.id, event.target.checked)}
                  type="checkbox"
                />
                <span>Use as AI assistant context</span>
              </label>
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
