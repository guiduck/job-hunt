import { useEffect, useState } from "react"

import type { JobStage, JobReviewStatus, Opportunity, OutreachEvent } from "../../api/types"
import { StatusPill } from "../StatusPill"
import { usePopupStore } from "../../store/popupStore"
import { companyName, emailDomainLabel, opportunityTitle, postPresentation, scoreTone } from "../../utils/opportunity"
import { EmailDraftPanel } from "./EmailDraftPanel"
import { EmailHistoryTimeline } from "./EmailHistoryTimeline"

type OperationalJobStatus = "unsent" | "sent" | "interview"

export function OpportunityDetail() {
  const opportunity = usePopupStore((state) => state.selectedOpportunity)
  const closeDetail = usePopupStore((state) => state.setSelectedOpportunity)
  const saveOpportunityUpdate = usePopupStore((state) => state.saveOpportunityUpdate)
  const emailHistory = usePopupStore((state) => state.emailHistory)

  if (!opportunity) {
    return null
  }

  return (
    <OpportunityDetailPanel
      opportunity={opportunity}
      emailHistory={emailHistory}
      onClose={() => closeDetail(null)}
      onSave={(payload) => void saveOpportunityUpdate(payload)}
    />
  )
}

function OpportunityDetailPanel({
  opportunity,
  emailHistory,
  onClose,
  onSave
}: {
  opportunity: Opportunity
  emailHistory: OutreachEvent[]
  onClose: () => void
  onSave: (payload: { job_stage?: JobStage; review_status?: JobReviewStatus; operator_notes?: string | null }) => void
}) {
  const [jobStage, setJobStage] = useState<JobStage>(opportunity.job_detail?.job_stage || "new")
  const [notes, setNotes] = useState(opportunity.operator_notes || "")
  const profile = opportunity.job_detail?.review_profile
  const presentation = postPresentation(opportunity)
  const company = companyName(opportunity)
  const emailDomain = emailDomainLabel(opportunity)

  useEffect(() => {
    setJobStage(opportunity.job_detail?.job_stage || "new")
    setNotes(opportunity.operator_notes || "")
  }, [opportunity])

  const operationalStatus = toOperationalStatus(jobStage)

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <h2>{opportunityTitle(opportunity)}</h2>
        <button className="secondary-button" onClick={onClose} type="button">
          Close
        </button>
      </div>

      <section className="card">
        <dl className="detail-meta-list">
          <div>
            <dt>Author</dt>
            <dd>{presentation.authorName || "Not identified"}</dd>
          </div>
          {company ? (
            <div>
              <dt>Company</dt>
              <dd>{company}</dd>
            </div>
          ) : null}
          {!company && emailDomain ? (
            <div>
              <dt>Email domain</dt>
              <dd>{emailDomain}</dd>
            </div>
          ) : null}
          <div>
            <dt>Contact</dt>
            <dd>{opportunity.job_detail?.contact_email || opportunity.job_detail?.contact_channel_value}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{opportunity.source_name || "LinkedIn"}</dd>
          </div>
        </dl>
        <div className="detail-actions">
          {presentation.contactHref ? (
            <a className="primary-link-button" href={presentation.contactHref} rel="noreferrer" target="_blank">
              {presentation.contactActionLabel}
            </a>
          ) : null}
          {opportunity.source_url ? (
            <a className="link" href={opportunity.source_url} rel="noreferrer" target="_blank">
              Open source
            </a>
          ) : null}
        </div>
        <div className="pill-row">
          <StatusPill label={`score ${profile?.match_score ?? "-"}`} tone={scoreTone(profile?.match_score)} />
          <StatusPill label={profile?.analysis_status || "deterministic_only"} />
          <StatusPill label={operationalStatus} tone={operationalStatus === "interview" ? "good" : operationalStatus === "sent" ? "warn" : undefined} />
        </div>
      </section>

      <EmailDraftPanel opportunity={opportunity} />

      <section className="card">
        <h3 className="card-title">Email history</h3>
        <EmailHistoryTimeline events={emailHistory} />
      </section>

      <section className="card">
        <h3 className="card-title">Job status</h3>
        <label className="field">
          <span>Status</span>
          <select value={operationalStatus} onChange={(event) => setJobStage(toJobStage(event.target.value as OperationalJobStatus))}>
            <option value="unsent">Unsent</option>
            <option value="sent">Sent</option>
            <option value="interview">Interview</option>
          </select>
        </label>
        <label className="field">
          <span>Notes</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
        <button
          className="primary-button"
          onClick={() => onSave({ job_stage: jobStage, operator_notes: notes })}
          type="button">
          Save status
        </button>
      </section>

      <section className="card">
        <h3 className="card-title">Evidence</h3>
        <div className="evidence-block">
          <p className="section-label">Message</p>
          <p className="job-evidence">{presentation.message || opportunity.source_evidence}</p>
        </div>
        {profile?.score_explanation ? <p className="job-evidence">{profile.score_explanation}</p> : null}
        {opportunity.job_detail?.matched_keywords?.length ? (
          <div className="evidence-block">
            <p className="section-label">Matched keywords</p>
            <div className="keyword-grid">
              {opportunity.job_detail.matched_keywords.map((keyword) => (
                <span className="keyword-chip" key={keyword}>
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {presentation.hashtags.length ? (
          <div className="evidence-block">
            <p className="section-label">Hashtags</p>
            <div className="hashtag-grid">
              {presentation.hashtags.map((hashtag) => (
                <span className="hashtag-chip" key={hashtag}>
                  {hashtag}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </aside>
  )
}

function toOperationalStatus(stage: JobStage): OperationalJobStatus {
  if (stage === "interview") return "interview"
  if (stage === "applied" || stage === "responded") return "sent"
  return "unsent"
}

function toJobStage(status: OperationalJobStatus): JobStage {
  if (status === "interview") return "interview"
  if (status === "sent") return "applied"
  return "new"
}
