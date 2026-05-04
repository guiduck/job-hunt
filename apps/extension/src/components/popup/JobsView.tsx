import { useState } from "react"

import type { JobReviewStatus, Opportunity } from "../../api/types"
import { StatusPill } from "../StatusPill"
import { usePopupStore } from "../../store/popupStore"
import { companyName, emailDomainLabel, opportunityTitle, postPresentation, scoreTone } from "../../utils/opportunity"
import { BulkEmailPanel } from "./BulkEmailPanel"
import { REVIEW_STATUSES } from "./constants"

export function JobsView() {
  const opportunities = usePopupStore((state) => state.opportunities)
  const filters = usePopupStore((state) => state.filters)
  const updateFilters = usePopupStore((state) => state.updateFilters)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  return (
    <>
      <section className="card filters">
        <label className="field">
          <span>Keyword</span>
          <input
            placeholder="typescript"
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
      </section>

      <BulkEmailPanel selectedIds={selectedIds} />

      <section className="job-list" aria-label="Captured jobs">
        {opportunities.length === 0 ? (
          <p className="empty-state">No opportunities match the current filters yet.</p>
        ) : (
          opportunities.map((opportunity) => (
            <JobCard
              isSelected={selectedIds.includes(opportunity.id)}
              key={opportunity.id}
              onToggleSelected={() =>
                setSelectedIds((current) =>
                  current.includes(opportunity.id)
                    ? current.filter((id) => id !== opportunity.id)
                    : [...current, opportunity.id].slice(0, 25)
                )
              }
              opportunity={opportunity}
            />
          ))
        )}
      </section>
    </>
  )
}

function JobCard({
  opportunity,
  isSelected,
  onToggleSelected
}: {
  opportunity: Opportunity
  isSelected: boolean
  onToggleSelected: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const openDetail = usePopupStore((state) => state.openDetail)
  const profile = opportunity.job_detail?.review_profile
  const score = profile?.match_score
  const presentation = postPresentation(opportunity)
  const description = expanded ? presentation.message : presentation.excerpt
  const company = companyName(opportunity)
  const emailDomain = emailDomainLabel(opportunity)

  return (
    <article className="job-card">
      <div className="job-card-header">
        <input aria-label="Select for bulk email" checked={isSelected} onChange={onToggleSelected} type="checkbox" />
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
