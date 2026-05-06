import { useEffect, useMemo, useState } from "react"

import type { Opportunity } from "../../api/types"
import { usePopupStore } from "../../store/popupStore"

function gmailComposeUrl(to: string, subject: string, body: string) {
  const params = new URLSearchParams({
    view: "cm",
    fs: "1",
    to,
    su: subject,
    body
  })
  return `https://mail.google.com/mail/?${params.toString()}`
}

export function EmailDraftPanel({ opportunity }: { opportunity: Opportunity }) {
  const activeDraft = usePopupStore((state) => state.activeDraft)
  const emailTemplates = usePopupStore((state) => state.emailTemplates)
  const resumes = usePopupStore((state) => state.resumes)
  const providerAccount = usePopupStore((state) => state.providerAccount)
  const prepareEmailDraft = usePopupStore((state) => state.prepareEmailDraft)
  const updateActiveDraft = usePopupStore((state) => state.updateActiveDraft)
  const approveActiveDraft = usePopupStore((state) => state.approveActiveDraft)
  const refreshEmailSetup = usePopupStore((state) => state.refreshEmailSetup)
  const activeTemplates = useMemo(() => emailTemplates.filter((template) => template.is_active), [emailTemplates])
  const defaultResume = useMemo(
    () => resumes.find((resume) => resume.is_default && resume.is_available) || resumes.find((resume) => resume.is_available),
    [resumes]
  )
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [selectedResumeId, setSelectedResumeId] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [draftSubject, setDraftSubject] = useState("")
  const [sendFeedback, setSendFeedback] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const selectedTemplate = activeTemplates.find((template) => template.id === selectedTemplateId)
  const googleConnected = providerAccount?.auth_status === "authorized"

  useEffect(() => {
    void refreshEmailSetup()
  }, [refreshEmailSetup])

  useEffect(() => {
    if (activeTemplates.length > 0 && !activeTemplates.some((template) => template.id === selectedTemplateId)) {
      const applicationTemplate = activeTemplates.find((template) => template.template_kind === "job_application")
      setSelectedTemplateId((applicationTemplate || activeTemplates[0]).id)
    }
  }, [activeTemplates, selectedTemplateId])

  useEffect(() => {
    if (defaultResume && !resumes.some((resume) => resume.id === selectedResumeId && resume.is_available)) {
      setSelectedResumeId(defaultResume.id)
    }
  }, [defaultResume, resumes, selectedResumeId])

  useEffect(() => {
    setRecipientEmail(activeDraft?.to_email || "")
    setDraftSubject(activeDraft?.subject || "")
    setSendFeedback(null)
  }, [activeDraft?.id, activeDraft?.subject, activeDraft?.to_email])

  async function persistDraftEdits() {
    if (!activeDraft) {
      return null
    }
    const nextRecipient = recipientEmail.trim()
    const nextSubject = draftSubject.trim()
    const updates: { to_email?: string; subject?: string } = {}
    if (nextRecipient !== activeDraft.to_email) {
      updates.to_email = nextRecipient
    }
    if (nextSubject !== activeDraft.subject) {
      updates.subject = nextSubject
    }
    if (Object.keys(updates).length === 0) {
      return activeDraft
    }
    const updated = await updateActiveDraft(updates)
    if (!updated) {
      return null
    }
    return { ...activeDraft, to_email: nextRecipient, subject: nextSubject }
  }

  async function openInGmail() {
    if (!activeDraft) {
      return
    }
    if (!recipientEmail.trim()) {
      setSendFeedback("Confirm the recipient email before opening Gmail.")
      return
    }
    if (!draftSubject.trim()) {
      setSendFeedback("Confirm the subject before opening Gmail.")
      return
    }
    setSendFeedback("Updating draft before opening Gmail...")
    const draft = await persistDraftEdits()
    if (!draft) {
      setSendFeedback("Could not update the draft. Check the error banner above.")
      return
    }
    setSendFeedback(null)
    const composeUrl = gmailComposeUrl(draft.to_email, draft.subject, draft.body)
    if (typeof chrome !== "undefined" && chrome.tabs) {
      await chrome.tabs.create({ url: composeUrl })
      return
    }
    window.open(composeUrl, "_blank", "noreferrer")
  }

  async function sendWithConnectedGoogle() {
    if (isSending) {
      return
    }
    if (!googleConnected) {
      setSendFeedback("Connect Google in Settings before sending through the API.")
      return
    }
    if (!recipientEmail.trim()) {
      setSendFeedback("Confirm the recipient email before sending.")
      return
    }
    if (!draftSubject.trim()) {
      setSendFeedback("Confirm the subject before sending.")
      return
    }
    setIsSending(true)
    try {
      setSendFeedback("Sending email through Gmail...")
      const draft = await persistDraftEdits()
      if (!draft) {
        setSendFeedback("Could not update the draft. Check the error banner above.")
        return
      }
      const queued = await approveActiveDraft()
      setSendFeedback(
        queued
          ? "Email sent. The job status and email history were refreshed."
          : "Could not send the email. Check the error banner above."
      )
    } finally {
      setIsSending(false)
    }
  }

  return (
    <section className="card email-draft-panel">
      <h3 className="card-title">Email application</h3>
      <p className="muted">Provider: {providerAccount?.auth_status || "not_configured"}</p>
      {!googleConnected ? <p className="message message--warn">Connect Google in Settings before using API delivery.</p> : null}
      <label className="field">
        <span>Template for this job</span>
        <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
          {activeTemplates.length === 0 ? <option value="">No active templates</option> : null}
          {activeTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} ({template.template_kind})
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Resume</span>
        <select value={selectedResumeId} onChange={(event) => setSelectedResumeId(event.target.value)}>
          <option value="">No resume</option>
          {resumes
            .filter((resume) => resume.is_available)
            .map((resume) => (
              <option key={resume.id} value={resume.id}>
                {resume.display_name}
                {resume.is_default ? " (default)" : ""}
              </option>
            ))}
        </select>
      </label>
      <div className="detail-actions">
        <button className="secondary-button" onClick={() => void refreshEmailSetup()} type="button">
          Refresh setup
        </button>
        <button
          className="primary-button"
          disabled={!selectedTemplate}
          onClick={() =>
            selectedTemplate
              ? void prepareEmailDraft(opportunity.id, selectedTemplate.id, selectedResumeId || null)
              : undefined
          }
          type="button">
          Prepare draft
        </button>
      </div>
      {activeDraft ? (
        <div className="email-preview">
          {activeDraft.warnings.length ? (
            <ul className="warning-list">
              {activeDraft.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          ) : null}
          <label className="field">
            <span>Subject</span>
            <input value={draftSubject} onChange={(event) => setDraftSubject(event.target.value)} />
          </label>
          <label className="field">
            <span>Recipient email</span>
            <input value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} type="email" />
          </label>
          <pre>{activeDraft.body}</pre>
          <div className="button-stack">
            <button
              className="primary-link-button"
              onClick={() => void openInGmail()}
              type="button">
              Open in Gmail
            </button>
            <button className="primary-button" disabled={isSending} onClick={() => void sendWithConnectedGoogle()} type="button">
              {isSending ? "Sending..." : "Send with connected Google"}
            </button>
          </div>
          {sendFeedback ? <p className={`message ${googleConnected ? "" : "message--warn"}`}>{sendFeedback}</p> : null}
          <p className="message">
            Gmail compose links cannot attach files automatically. The default resume is attached only when sending through the connected
            Google API.
          </p>
        </div>
      ) : null}
    </section>
  )
}
