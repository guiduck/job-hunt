import { useEffect, useMemo, useState } from "react"

import type { Opportunity } from "../../api/types"
import { StatusPill } from "../StatusPill"
import { usePopupStore } from "../../store/popupStore"
import { companyName, emailDomainLabel, opportunityTitle, postPresentation, scoreTone } from "../../utils/opportunity"
import { BulkEmailPanel } from "./BulkEmailPanel"

const MAX_BULK_EMAIL_SELECTION = 50

export function JobsView() {
  const opportunities = usePopupStore((state) => state.opportunities)
  const opportunityPage = usePopupStore((state) => state.opportunityPage)
  const opportunityTotalPages = usePopupStore((state) => state.opportunityTotalPages)
  const opportunityTotalItems = usePopupStore((state) => state.opportunityTotalItems)
  const opportunityHasNext = usePopupStore((state) => state.opportunityHasNext)
  const opportunityHasPrevious = usePopupStore((state) => state.opportunityHasPrevious)
  const filters = usePopupStore((state) => state.filters)
  const updateFilters = usePopupStore((state) => state.updateFilters)
  const deleteOpportunities = usePopupStore((state) => state.deleteOpportunities)
  const selectedIds = usePopupStore((state) => state.selectedJobIds)
  const showBulkEmail = usePopupStore((state) => state.showBulkEmail)
  const setSelectedIds = usePopupStore((state) => state.setSelectedJobIds)
  const setShowBulkEmail = usePopupStore((state) => state.setShowBulkEmail)
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null)
  const listedIds = useMemo(() => opportunities.map((opportunity) => opportunity.id), [opportunities])
  const listedIdSet = useMemo(() => new Set(listedIds), [listedIds])
  const allListedSelected = listedIds.length > 0 && listedIds.every((id) => selectedIds.includes(id))
  const canBulkEmailSelection = selectedIds.length > 0 && selectedIds.length <= MAX_BULK_EMAIL_SELECTION

  useEffect(() => {
    const nextSelectedIds = selectedIds.filter((id) => listedIdSet.has(id))
    if (nextSelectedIds.length !== selectedIds.length) {
      setSelectedIds(nextSelectedIds)
    }
  }, [listedIdSet, selectedIds, setSelectedIds])

  async function deleteSelectedJobs() {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Delete ${selectedIds.length} selected job(s)? This also removes related email history.`)) return
    await deleteOpportunities(selectedIds)
    setSelectedIds([])
  }

  async function deleteAllListedJobs() {
    if (listedIds.length === 0) return
    if (!window.confirm(`Delete the ${listedIds.length} visible job(s) on this page? This also removes related email history.`)) return
    await deleteOpportunities(listedIds)
    setSelectedIds([])
  }

  function toggleSelected(opportunityId: string) {
    setSelectionNotice(null)
    setSelectedIds(
      selectedIds.includes(opportunityId)
        ? selectedIds.filter((id) => id !== opportunityId)
        : [...selectedIds, opportunityId]
    )
  }

  function toggleAllListed(checked: boolean) {
    setSelectedIds(checked ? listedIds : [])
    if (checked && listedIds.length > MAX_BULK_EMAIL_SELECTION) {
      setSelectionNotice(
        `${listedIds.length} listed jobs selected. Delete can use the full selection; bulk email supports up to ${MAX_BULK_EMAIL_SELECTION} at a time.`
      )
      return
    }
    setSelectionNotice(checked ? `${listedIds.length} visible job(s) selected on this page.` : null)
  }

  function goToPage(page: number) {
    void updateFilters({ ...filters, page })
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
          <span>Collected order</span>
          <select
            value={filters.sort_order || "newest"}
            onChange={(event) => void updateFilters({ ...filters, sort_order: event.target.value as "newest" | "oldest" })}>
            <option value="newest">Newest collected first</option>
            <option value="oldest">Oldest collected first</option>
          </select>
        </label>
      </section>

      <section className="card selection-panel" aria-label="Selection controls">
        <div>
          <h3 className="card-title">Selection</h3>
          <p className="message">
            {selectedIds.length} of {opportunities.length} visible jobs selected. {opportunityTotalItems} total match current filters.
          </p>
        </div>
        <div className="selection-actions">
          <label className="select-all-row">
            <input
              checked={allListedSelected}
              disabled={opportunities.length === 0}
              onChange={(event) => toggleAllListed(event.target.checked)}
              type="checkbox"
            />
            <span>All visible on this page</span>
          </label>
          <button className="secondary-button danger-secondary-button" disabled={listedIds.length === 0} onClick={() => void deleteAllListedJobs()} type="button">
            Delete visible page
          </button>
        </div>
      </section>

      <nav className="pagination-controls" aria-label="Jobs pagination">
        <button
          className="secondary-button"
          disabled={!opportunityHasPrevious}
          onClick={() => goToPage(opportunityPage - 1)}
          type="button">
          Previous
        </button>
        <span>
          Page {opportunityPage} of {opportunityTotalPages}
        </span>
        <button
          className="secondary-button"
          disabled={!opportunityHasNext}
          onClick={() => goToPage(opportunityPage + 1)}
          type="button">
          Next
        </button>
      </nav>

      {selectionNotice ? <p className="message message--warn">{selectionNotice}</p> : null}
      {selectedIds.length === MAX_BULK_EMAIL_SELECTION ? (
        <p className="message message--warn">Selection limit reached: review/send these 50 jobs, then select the next batch.</p>
      ) : null}
      {selectedIds.length > MAX_BULK_EMAIL_SELECTION ? (
        <p className="message message--warn">
          Bulk email supports up to {MAX_BULK_EMAIL_SELECTION} jobs at a time. Delete still works for all selected jobs.
        </p>
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

      <section className="job-list" aria-label="Captured jobs">
        {opportunities.length === 0 ? (
          <p className="empty-state">No opportunities match the current filters yet.</p>
        ) : (
          opportunities.map((opportunity) => (
            <JobCard
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
            disabled={!canBulkEmailSelection}
            onClick={() => setShowBulkEmail(true)}
            title={
              canBulkEmailSelection
                ? `Review email for ${selectedIds.length} selected`
                : `Bulk email supports up to ${MAX_BULK_EMAIL_SELECTION} selected jobs`
            }
            type="button">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M3 5h18v14H3V5Zm2.4 2 6.6 5 6.6-5H5.4Zm13.6 10V8.9l-7 5.3-7-5.3V17h14Z" />
            </svg>
            <span>{selectedIds.length}</span>
          </button>
          {selectedIds.length >= MAX_BULK_EMAIL_SELECTION ? (
            <span className="floating-selection-note">50 max per email batch</span>
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
          onChange={onToggleSelected}
          type="checkbox"
        />
        <button className="job-card-main" onClick={() => void openDetail(opportunity.id)} type="button">
          <h3>{opportunityTitle(opportunity)}</h3>
          {presentation.authorName ? <p className="job-meta">Author: {presentation.authorName}</p> : null}
          {company ? <p className="job-meta">Company: {company}</p> : null}
          {opportunity.source_name ? <p className="job-meta">Source: {opportunity.source_name}</p> : null}
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
