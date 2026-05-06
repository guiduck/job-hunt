import { useEffect, useMemo, useState } from "react"

import { usePopupStore } from "../../store/popupStore"

export function BulkEmailPanel({ onClose, selectedIds }: { onClose?: () => void; selectedIds: string[] }) {
  const bulkPreview = usePopupStore((state) => state.bulkPreview)
  const emailTemplates = usePopupStore((state) => state.emailTemplates)
  const resumes = usePopupStore((state) => state.resumes)
  const loading = usePopupStore((state) => state.loading)
  const refreshEmailSetup = usePopupStore((state) => state.refreshEmailSetup)
  const previewBulkSend = usePopupStore((state) => state.previewBulkSend)
  const generateAIBulkSend = usePopupStore((state) => state.generateAIBulkSend)
  const updateBulkSendItem = usePopupStore((state) => state.updateBulkSendItem)
  const approveBulkSend = usePopupStore((state) => state.approveBulkSend)
  const activeTemplates = useMemo(
    () => emailTemplates.filter((item) => item.template_kind === "job_application" && item.is_active),
    [emailTemplates]
  )
  const defaultResume = resumes.find((resume) => resume.is_default && resume.is_available) || resumes.find((resume) => resume.is_available)
  const [mode, setMode] = useState<"ai" | "template">("ai")
  const [selectedTemplateId, setSelectedTemplateId] = useState("")
  const [selectedResumeId, setSelectedResumeId] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [draftEdits, setDraftEdits] = useState<Record<string, { recipient_email: string; subject: string; body: string }>>({})
  const [generationProgress, setGenerationProgress] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)
  const [actionFeedbackTone, setActionFeedbackTone] = useState<"info" | "success" | "error">("info")

  useEffect(() => {
    void refreshEmailSetup()
  }, [refreshEmailSetup])

  useEffect(() => {
    if (mode === "template" && activeTemplates.length > 0 && !activeTemplates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId(activeTemplates[0].id)
    }
    if (mode === "ai" && selectedTemplateId && !activeTemplates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId("")
    }
  }, [activeTemplates, mode, selectedTemplateId])

  useEffect(() => {
    if (defaultResume && !resumes.some((resume) => resume.id === selectedResumeId && resume.is_available)) {
      setSelectedResumeId(defaultResume.id)
    }
  }, [defaultResume, resumes, selectedResumeId])

  async function startReview() {
    if (!window.confirm(`Prepare email review for ${selectedIds.length} selected job(s)? Nothing will send until you approve.`)) {
      return
    }
    setActionFeedback(mode === "ai" ? "Generating AI email drafts..." : "Preparing template preview...")
    setGenerationProgress(mode === "ai" ? `0 / ${selectedIds.length} jobs processed` : null)
    if (mode === "ai") {
      await generateAIBulkSend(selectedIds, selectedResumeId || null, selectedTemplateId || null)
      setGenerationProgress(`${selectedIds.length} / ${selectedIds.length} jobs processed`)
      setActionFeedback("Review finished. Check generated, skipped, and failed items before approval.")
      return
    }
    if (selectedTemplateId) {
      await previewBulkSend(selectedIds, selectedTemplateId, selectedResumeId || null)
      setActionFeedback("Template review ready. Check skipped or blocked items before approval.")
    }
  }

  async function approveReviewedItems() {
    if (!bulkPreview?.sendable_count) {
      setActionFeedbackTone("error")
      setActionFeedback("No sendable reviewed items to approve.")
      return
    }
    const sendableCount = bulkPreview.sendable_count
    if (!window.confirm(`Send ${sendableCount} reviewed email(s)? The worker will deliver them through Gmail.`)) {
      return
    }
    setActionFeedbackTone("info")
    setActionFeedback("Sending reviewed emails...")
    await approveBulkSend()
    setActionFeedbackTone("success")
    setActionFeedback(`SEND submitted: ${sendableCount} email(s) were queued for Gmail delivery. Check each job history for sent/failed status.`)
  }

  function editValues(item: NonNullable<typeof bulkPreview>["items"][number]) {
    return (
      draftEdits[item.opportunity_id] || {
        recipient_email: item.recipient_email || "",
        subject: item.subject || "",
        body: item.body || ""
      }
    )
  }

  function setEditValue(
    item: NonNullable<typeof bulkPreview>["items"][number],
    field: "recipient_email" | "subject" | "body",
    value: string
  ) {
    setDraftEdits((current) => ({
      ...current,
      [item.opportunity_id]: {
        recipient_email: current[item.opportunity_id]?.recipient_email ?? item.recipient_email ?? "",
        subject: current[item.opportunity_id]?.subject ?? item.subject ?? "",
        body: current[item.opportunity_id]?.body ?? item.body ?? "",
        [field]: value
      }
    }))
  }

  const failedGenerationCount = bulkPreview?.items.filter((item) => item.outcome === "ai_generation_failed").length || 0
  const failedGenerationReasons = Array.from(
    new Set(
      bulkPreview?.items
        .filter((item) => item.outcome === "ai_generation_failed")
        .map((item) => item.reason || item.ai_error_code || "AI generation failed.")
    )
  )
  const retryableGenerationFailures = bulkPreview?.items.some((item) => item.outcome === "ai_generation_failed" && item.retryable) || false

  return (
    <section className="card bulk-email-panel">
      <div className="detail-header">
        <h3 className="card-title">Bulk email review</h3>
        {onClose ? (
          <button className="secondary-button" onClick={onClose} type="button">
            Close
          </button>
        ) : null}
      </div>
      <p className="muted">{selectedIds.length} selected. Nothing sends until you approve reviewed sendable items.</p>
      <div className="form-row">
        <label className="field">
          <span>Flow</span>
          <select value={mode} onChange={(event) => setMode(event.target.value as "ai" | "template")}>
            <option value="ai">Generate with AI</option>
            <option value="template">Use template</option>
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
      </div>
      <label className="field">
        <span>{mode === "ai" ? "Template reference" : "Template"}</span>
        <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
          {mode === "ai" ? <option value="">No template reference</option> : null}
          {activeTemplates.length === 0 ? <option value="">No active job application templates</option> : null}
          {activeTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </label>
      {mode === "ai" ? (
        <p className="message">
          AI uses the selected resume text as the source of truth and the template only as tone/structure guidance.
        </p>
      ) : null}
      {mode === "template" && !selectedTemplateId ? (
        <p className="message message--warn">Select an active job application template to preview template-based bulk email.</p>
      ) : null}
      <div className="detail-actions">
        <button
          className="secondary-button"
          disabled={loading || selectedIds.length === 0 || (mode === "template" && !selectedTemplateId)}
          onClick={() => void startReview()}
          type="button">
          {loading ? "Working..." : mode === "ai" ? "Generate review" : "Preview review"}
        </button>
        <button className="primary-button send-button" disabled={loading || !bulkPreview?.sendable_count} onClick={() => void approveReviewedItems()} type="button">
          {loading ? "Sending..." : "SEND"}
        </button>
      </div>
      {generationProgress ? <p className="message">{generationProgress}</p> : null}
      {actionFeedback ? <p className={`message message--${actionFeedbackTone}`}>{actionFeedback}</p> : null}
      {failedGenerationCount > 0 ? (
        <div className="message message--error bulk-error-summary">
          <strong>{failedGenerationCount} AI generation request(s) failed.</strong>
          {failedGenerationReasons.map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
          {retryableGenerationFailures ? <span>This may be retryable after rate limits, quota, or connectivity recover.</span> : null}
        </div>
      ) : null}
      {bulkPreview ? (
        <div className="bulk-summary">
          <div className="bulk-stats">
            <span>Sendable: {bulkPreview.sendable_count}</span>
            <span>Missing: {bulkPreview.skipped_missing_contact_count}</span>
            <span>Duplicates: {bulkPreview.skipped_duplicate_count}</span>
            <span>Invalid: {bulkPreview.blocked_invalid_contact_count}</span>
            <span>AI failed: {failedGenerationCount}</span>
          </div>
          <ul className="stack-list">
            {bulkPreview.items.map((item) => {
              const expanded = expandedId === item.opportunity_id
              const edits = editValues(item)
              return (
                <li className="stack-card" key={item.opportunity_id}>
                  <strong>{item.recipient_email || "Missing recipient"}</strong>
                  <span>{item.subject || item.outcome}</span>
                  {item.reason ? <span>{item.reason}</span> : null}
                  {item.ai_error_code ? <span>Error code: {item.ai_error_code}</span> : null}
                  {item.body ? <p>{expanded ? item.body : `${item.body.slice(0, 140)}${item.body.length > 140 ? "..." : ""}`}</p> : null}
                  <div className="detail-actions">
                    <button className="secondary-button" onClick={() => setExpandedId(expanded ? null : item.opportunity_id)} type="button">
                      {expanded ? "Show less" : "View more"}
                    </button>
                    <button
                      className="secondary-button"
                      disabled={loading}
                      onClick={() => void updateBulkSendItem(item.opportunity_id, { is_skipped: !item.is_skipped })}
                      type="button">
                      {item.is_skipped ? "Unskip" : "Skip"}
                    </button>
                  </div>
                  {expanded ? (
                    <div className="form-stack">
                      <label className="field">
                        <span>Recipient</span>
                        <input
                          value={edits.recipient_email}
                          onChange={(event) => setEditValue(item, "recipient_email", event.target.value)}
                          type="email"
                        />
                      </label>
                      <label className="field">
                        <span>Subject</span>
                        <input value={edits.subject} onChange={(event) => setEditValue(item, "subject", event.target.value)} />
                      </label>
                      <label className="field">
                        <span>Body</span>
                        <textarea value={edits.body} onChange={(event) => setEditValue(item, "body", event.target.value)} />
                      </label>
                      <button
                        className="primary-button"
                        disabled={loading}
                        onClick={() => void updateBulkSendItem(item.opportunity_id, edits)}
                        type="button">
                        Save item
                      </button>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
