import { useState } from "react"

import type { JobReviewStatus, Opportunity } from "../../api/types"
import { StatusPill } from "../StatusPill"
import { usePopupStore } from "../../store/popupStore"
import { companyName, emailDomainLabel, opportunityTitle, postPresentation, scoreTone } from "../../utils/opportunity"
import { BulkEmailPanel } from "./BulkEmailPanel"
import { REVIEW_STATUSES } from "./constants"

const MAX_BULK_EMAIL_SELECTION = 50

export function JobsView() {
  const opportunities = usePopupStore((state) => state.opportunities)
  const filters = usePopupStore((state) => state.filters)
  const updateFilters = usePopupStore((state) => state.updateFilters)
  const deleteOpportunities = usePopupStore((state) => state.deleteOpportunities)
  const deleteOpportunitiesBySendStatus = usePopupStore((state) => state.deleteOpportunitiesBySendStatus)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showBulkEmail, setShowBulkEmail] = useState(false)
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null)

  async function deleteSelectedJobs() {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Delete ${selectedIds.length} selected job(s)? This also removes related email history.`)) return
    await deleteOpportunities(selectedIds)
    setSelectedIds([])
  }

  async function deleteBySendStatus(sendStatus: "sent" | "unsent") {
    const label = sendStatus === "sent" ? "sent" : "not sent"
    if (!window.confirm(`Delete all ${label} jobs? This cannot be undone.`)) return
    await deleteOpportunitiesBySendStatus(sendStatus)
    setSelectedIds([])
  }

  function toggleSelected(opportunityId: string) {
    setSelectedIds((current) => {
      if (current.includes(opportunityId)) {
        setSelectionNotice(null)
        return current.filter((id) => id !== opportunityId)
      }
      if (current.length >= MAX_BULK_EMAIL_SELECTION) {
        setSelectionNotice(`Bulk email supports up to ${MAX_BULK_EMAIL_SELECTION} selected jobs at a time.`)
        return current
      }
      setSelectionNotice(null)
      return [...current, opportunityId]
    })
  }

  return (
    <>
      <section className="card filters">
        <div className="filter-tabs" aria-label="Email send status">
          {[
            ["", "All"],
            ["unsent", "Not sent"],
            ["sent", "Sent"]
          ].map(([value, label]) => (
            <button
              aria-pressed={(filters.send_status || "") === value}
              key={value || "all"}
              onClick={() => void updateFilters({ ...filters, send_status: value as "" | "sent" | "unsent" })}
              type="button">
              {label}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Search jobs</span>
          <input
            placeholder="typescript, company, email, description..."
            value={filters.keyword || ""}
            onChange={(event) => void updateFilters({ ...filters, keyword: event.target.value })}
          />
        </label>
        <div className="form-row">
          <label className="field">
            <span>Min score</span>
            <input
              max={100}
              min={0}
              type="number"
              value={filters.min_score || 0}
              onChange={(event) => void updateFilters({ ...filters, min_score: Number(event.target.value) })}
            />
          </label>
          <label className="field">
            <span>Review</span>
            <select
              value={filters.review_status || ""}
              onChange={(event) =>
                void updateFilters({ ...filters, review_status: event.target.value as JobReviewStatus | "" })
              }>
              {REVIEW_STATUSES.map((status) => (
                <option key={status || "all"} value={status}>
                  {status || "all"}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="field">
          <span>Collected order</span>
          <select
            value={filters.sort_order || "newest"}
            onChange={(event) => void updateFilters({ ...filters, sort_order: event.target.value as "newest" | "oldest" })}>
            <option value="newest">Newest collected first</option>
            <option value="oldest">Oldest collected first</option>
          </select>
        </label>
      </section>

      {selectionNotice ? <p className="message message--warn">{selectionNotice}</p> : null}
      {selectedIds.length === MAX_BULK_EMAIL_SELECTION ? (
        <p className="message message--warn">Selection limit reached: review/send these 25 jobs, then select the next batch.</p>
      ) : null}

      {showBulkEmail ? (
        <div className="modal-backdrop" onClick={() => setShowBulkEmail(false)} role="presentation">
          <div
            aria-label="Bulk email review"
            aria-modal="true"
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog">
            <BulkEmailPanel onClose={() => setShowBulkEmail(false)} selectedIds={selectedIds} />
          </div>
        </div>
      ) : null}

      <section className="card compact-danger-panel">
        <h3 className="card-title">Delete by status</h3>
        <div className="form-row">
          <button className="secondary-button" onClick={() => void deleteBySendStatus("unsent")} type="button">
            Delete not sent
          </button>
          <button className="secondary-button" onClick={() => void deleteBySendStatus("sent")} type="button">
            Delete sent
          </button>
        </div>
      </section>

      <section className="job-list" aria-label="Captured jobs">
        {opportunities.length === 0 ? (
          <p className="empty-state">No opportunities match the current filters yet.</p>
        ) : (
          opportunities.map((opportunity) => (
            <JobCard
              disabledSelection={selectedIds.length >= MAX_BULK_EMAIL_SELECTION && !selectedIds.includes(opportunity.id)}
              isSelected={selectedIds.includes(opportunity.id)}
              key={opportunity.id}
              onToggleSelected={() => toggleSelected(opportunity.id)}
              opportunity={opportunity}
            />
          ))
        )}
      </section>
      {selectedIds.length > 0 ? (
        <div className="floating-actions">
          <button
            aria-label={`Send email to ${selectedIds.length} selected jobs`}
            className="floating-send-button"
            onClick={() => setShowBulkEmail(true)}
            title={`Review email for ${selectedIds.length} selected`}
            type="button">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M3 5h18v14H3V5Zm2.4 2 6.6 5 6.6-5H5.4Zm13.6 10V8.9l-7 5.3-7-5.3V17h14Z" />
            </svg>
            <span>{selectedIds.length}</span>
          </button>
          {selectedIds.length === MAX_BULK_EMAIL_SELECTION ? (
            <span className="floating-selection-note">25 max per batch</span>
          ) : null}
          <button
            aria-label={`Delete ${selectedIds.length} selected jobs`}
            className="floating-delete-button"
            onClick={() => void deleteSelectedJobs()}
            title={`Delete ${selectedIds.length} selected`}
            type="button">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" />
            </svg>
            <span>{selectedIds.length}</span>
          </button>
        </div>
      ) : null}
    </>
  )
}

function JobCard({
  disabledSelection,
  opportunity,
  isSelected,
  onToggleSelected
}: {
  disabledSelection?: boolean
  opportunity: Opportunity
  isSelected: boolean
  onToggleSelected: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const openDetail = usePopupStore((state) => state.openDetail)
  const deleteOpportunity = usePopupStore((state) => state.deleteOpportunity)
  const profile = opportunity.job_detail?.review_profile
  const score = profile?.match_score
  const presentation = postPresentation(opportunity)
  const description = expanded ? presentation.message : presentation.excerpt
  const company = companyName(opportunity)
  const emailDomain = emailDomainLabel(opportunity)

  function confirmDelete() {
    if (window.confirm("Delete this collected job? This removes it from the list and related email history.")) {
      void deleteOpportunity(opportunity.id)
    }
  }

  return (
    <article className="job-card">
      <div className="job-card-header">
        <input
          aria-label="Select for bulk email"
          checked={isSelected}
          disabled={disabledSelection}
          onChange={onToggleSelected}
          title={disabledSelection ? "Bulk email supports up to 25 selected jobs at a time." : undefined}
          type="checkbox"
        />
        <button className="job-card-main" onClick={() => void openDetail(opportunity.id)} type="button">
          <h3>{opportunityTitle(opportunity)}</h3>
          {presentation.authorName ? <p className="job-meta">Author: {presentation.authorName}</p> : null}
          {company ? <p className="job-meta">Company: {company}</p> : null}
          {!company && emailDomain ? <p className="job-meta">Email domain: {emailDomain}</p> : null}
          <p className="job-meta">{opportunity.job_detail?.contact_email || opportunity.job_detail?.contact_channel_value}</p>
        </button>
        {presentation.contactHref ? (
          <a
            aria-label={presentation.contactActionLabel}
            className="icon-action"
            href={presentation.contactHref}
            rel="noreferrer"
            target="_blank">
            Send
          </a>
        ) : null}
        <button aria-label="Delete job" className="icon-delete-button" onClick={confirmDelete} title="Delete job" type="button">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-2 6h10l-.7 11H7.7L7 9Zm3 2v7h2v-7h-2Zm4 0v7h2v-7h-2Z" />
          </svg>
        </button>
      </div>

      {description ? <p className="job-description-preview">{description}</p> : null}
      {presentation.message.length > presentation.excerpt.length ? (
        <button className="inline-button" onClick={() => setExpanded((current) => !current)} type="button">
          {expanded ? "Show less" : "View more"}
        </button>
      ) : null}

      <div className="pill-row">
        <StatusPill label={`score ${score ?? "-"}`} tone={scoreTone(score)} />
        <StatusPill label={profile?.review_status || "unreviewed"} />
        <StatusPill label={opportunity.job_detail?.job_stage || "new"} />
      </div>
    </article>
  )
}
