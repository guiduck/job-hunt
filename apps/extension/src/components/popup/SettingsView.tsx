import { useEffect, useState } from "react"

import { resumeFileUrl } from "../../api/client"
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
  const [previewResumeId, setPreviewResumeId] = useState<string | null>(null)
  const defaultResume = resumes.find((resume) => resume.is_default)

  useEffect(() => {
    void refreshEmailSetup()
  }, [refreshEmailSetup])

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
        <div className="detail-actions">
          <button className="primary-button" onClick={() => void connectGoogle()} type="button">
            Connect Google
          </button>
          <button className="secondary-button" onClick={() => void disconnectGoogle()} type="button">
            Disconnect
          </button>
        </div>
      </div>

      <div className="settings-card">
        <strong>Default resume</strong>
        <span>{defaultResume?.display_name || "No default resume selected"}</span>
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
          <iframe src={resumeFileUrl(previewResumeId)} title="Resume PDF preview" />
        </section>
      ) : null}
    </section>
  )
}
