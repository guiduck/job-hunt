import type { Opportunity } from "../../api/types"
import { usePopupStore } from "../../store/popupStore"

export function EmailDraftPanel({ opportunity }: { opportunity: Opportunity }) {
  const activeDraft = usePopupStore((state) => state.activeDraft)
  const emailTemplates = usePopupStore((state) => state.emailTemplates)
  const resumes = usePopupStore((state) => state.resumes)
  const providerAccount = usePopupStore((state) => state.providerAccount)
  const prepareEmailDraft = usePopupStore((state) => state.prepareEmailDraft)
  const approveActiveDraft = usePopupStore((state) => state.approveActiveDraft)
  const refreshEmailSetup = usePopupStore((state) => state.refreshEmailSetup)
  const applicationTemplate = emailTemplates.find((template) => template.template_kind === "job_application" && template.is_active)
  const defaultResume = resumes.find((resume) => resume.is_available)

  return (
    <section className="card email-draft-panel">
      <h3 className="card-title">Email application</h3>
      <p className="muted">Provider: {providerAccount?.auth_status || "not_configured"}</p>
      <div className="detail-actions">
        <button className="secondary-button" onClick={() => void refreshEmailSetup()} type="button">
          Refresh setup
        </button>
        <button
          className="primary-button"
          disabled={!applicationTemplate}
          onClick={() =>
            applicationTemplate
              ? void prepareEmailDraft(opportunity.id, applicationTemplate.id, defaultResume?.id || null)
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
          <strong>{activeDraft.subject}</strong>
          <pre>{activeDraft.body}</pre>
          <button className="primary-button" onClick={() => void approveActiveDraft()} type="button">
            Approve send
          </button>
        </div>
      ) : null}
    </section>
  )
}
