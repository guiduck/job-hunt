import { useEffect, useState } from "react"

import { API_BASE_URL } from "../../api/client"
import { CAPTURE_MAX_POSTS, CAPTURE_MAX_SCROLLS, LINKEDIN_JOBS_MAX_PAGES, usePopupStore } from "../../store/popupStore"

const CAPTURE_BUSY_STATUSES = new Set(["opening", "capturing", "submitting", "processing"])
const LINKEDIN_JOBS_BUSY_STATUSES = new Set(["opening", "capturing", "submitting"])

type SearchPanel = "external_jobs" | "linkedin_posts"

export function SearchView() {
  const [activePanel, setActivePanel] = useState<SearchPanel>("external_jobs")

  useEffect(() => {
    void usePopupStore.getState().refreshCareerPageSearch()
  }, [])

  return (
    <section className="card">
      <h2 className="card-title">Search</h2>
      <nav aria-label="Search type" className="search-type-tabs" role="tablist">
        <button aria-selected={activePanel === "external_jobs"} onClick={() => setActivePanel("external_jobs")} role="tab" type="button">
          External jobs
        </button>
        <button aria-selected={activePanel === "linkedin_posts"} onClick={() => setActivePanel("linkedin_posts")} role="tab" type="button">
          LinkedIn posts
        </button>
      </nav>
      {activePanel === "external_jobs" ? <ExternalJobsSearchPanel /> : <LinkedInPostsSearchPanel />}
    </section>
  )
}

function SavedKeywordBadges() {
  const savedSearchKeywords = usePopupStore((state) => state.savedSearchKeywords)
  const appendSavedSearchKeyword = usePopupStore((state) => state.appendSavedSearchKeyword)
  const deleteSavedSearchKeyword = usePopupStore((state) => state.deleteSavedSearchKeyword)

  if (!savedSearchKeywords.length) return null

  return (
    <div aria-label="Saved search keywords" className="saved-keyword-badges">
      {savedSearchKeywords.map((keyword) => (
        <span className="saved-keyword-badge" key={keyword}>
          <button className="saved-keyword-badge__term" onClick={() => appendSavedSearchKeyword(keyword)} title={`Add ${keyword} to search`} type="button">
            {keyword}
          </button>
          <button aria-label={`Remove ${keyword}`} className="saved-keyword-badge__remove" onClick={() => void deleteSavedSearchKeyword(keyword)} title={`Remove ${keyword}`} type="button">
            x
          </button>
        </span>
      ))}
    </div>
  )
}

function SearchTextField() {
  const keywords = usePopupStore((state) => state.keywords)
  const setKeywords = usePopupStore((state) => state.setKeywords)
  return (
    <label className="field">
      <span>Search text</span>
      <input value={keywords} onChange={(event) => setKeywords(event.target.value)} />
    </label>
  )
}

function ExternalJobsSearchPanel() {
  const keywords = usePopupStore((state) => state.keywords)
  const curatedCareerSources = usePopupStore((state) => state.curatedCareerSources)
  const selectedCareerSourceKeys = usePopupStore((state) => state.selectedCareerSourceKeys)
  const latestCareerPageRun = usePopupStore((state) => state.latestCareerPageRun)
  const latestLinkedInJobsExternalRun = usePopupStore((state) => state.latestLinkedInJobsExternalRun)
  const careerPageAcceptedLimit = usePopupStore((state) => state.careerPageAcceptedLimit)
  const careerPageInspectedCap = usePopupStore((state) => state.careerPageInspectedCap)
  const linkedinJobsMaxPages = usePopupStore((state) => state.linkedinJobsMaxPages)
  const linkedinJobsDatePosted = usePopupStore((state) => state.linkedinJobsDatePosted)
  const linkedinJobsSort = usePopupStore((state) => state.linkedinJobsSort)
  const linkedinJobsAssisted = usePopupStore((state) => state.linkedinJobsAssisted)
  const linkedinJobsProgress = usePopupStore((state) => state.linkedinJobsProgress)
  const setSelectedCareerSourceKeys = usePopupStore((state) => state.setSelectedCareerSourceKeys)
  const setCareerPageAcceptedLimit = usePopupStore((state) => state.setCareerPageAcceptedLimit)
  const setCareerPageInspectedCap = usePopupStore((state) => state.setCareerPageInspectedCap)
  const setLinkedInJobsMaxPages = usePopupStore((state) => state.setLinkedInJobsMaxPages)
  const setLinkedInJobsDatePosted = usePopupStore((state) => state.setLinkedInJobsDatePosted)
  const setLinkedInJobsSort = usePopupStore((state) => state.setLinkedInJobsSort)
  const setLinkedInJobsAssisted = usePopupStore((state) => state.setLinkedInJobsAssisted)
  const startCareerPageSearch = usePopupStore((state) => state.startCareerPageSearch)
  const startLinkedInJobsExternalSearch = usePopupStore((state) => state.startLinkedInJobsExternalSearch)
  const isCareerSearchRunning = latestCareerPageRun ? ["pending", "running"].includes(latestCareerPageRun.status) : false
  const isLinkedInJobsRunning = LINKEDIN_JOBS_BUSY_STATUSES.has(linkedinJobsProgress.status)
  const canUseExternalSources = selectedCareerSourceKeys.length > 0
  const latestCareerSearchLabel = latestCareerPageRun ? new Date(latestCareerPageRun.created_at).toLocaleString() : "Never"

  function toggleCareerSource(sourceKey: string, checked: boolean) {
    setSelectedCareerSourceKeys(checked ? [...selectedCareerSourceKeys, sourceKey] : selectedCareerSourceKeys.filter((key) => key !== sourceKey))
  }

  return (
    <>
      <div className="search-section">
        <p className="section-label">External job sources</p>
        <SearchTextField />
        <SavedKeywordBadges />
        {!keywords.trim() ? <p className="message">LinkedIn Jobs will browse default relevant jobs when search text is empty.</p> : null}
        {curatedCareerSources.length > 0 ? (
          <div className="source-checkbox-grid" aria-label="External job sources">
            {curatedCareerSources.map((source) => (
              <label key={source.key}>
                <input checked={selectedCareerSourceKeys.includes(source.key)} disabled={!source.active || isCareerSearchRunning || isLinkedInJobsRunning} onChange={(event) => toggleCareerSource(source.key, event.target.checked)} type="checkbox" />
                {source.name}
              </label>
            ))}
          </div>
        ) : (
          <p className="message">No external sources loaded yet.</p>
        )}
      </div>

      <div className="search-section search-section--career">
        <div className="section-heading-row">
          <p className="section-label">LinkedIn Jobs external search</p>
          <span className="latest-search-label">Max {LINKEDIN_JOBS_MAX_PAGES} pages</span>
        </div>
        <label className="toggle-row">
          <input checked={linkedinJobsAssisted} onChange={(event) => setLinkedInJobsAssisted(event.target.checked)} type="checkbox" />
          <span>
            <strong>Assisted Jobs mode</strong>
            <small>Best effort. LinkedIn may use account preferences; date and sort may not apply.</small>
          </span>
        </label>
        <div className="form-row">
          <label className="field">
            <span>Date posted</span>
            <select disabled={linkedinJobsAssisted} value={linkedinJobsDatePosted} onChange={(event) => setLinkedInJobsDatePosted(event.target.value as typeof linkedinJobsDatePosted)}>
              <option value="any_time">Any time</option>
              <option value="past_month">Past month</option>
              <option value="past_week">Past week</option>
              <option value="past_24_hours">Past 24 hours</option>
            </select>
          </label>
          <label className="field">
            <span>Sort</span>
            <select disabled={linkedinJobsAssisted} value={linkedinJobsSort} onChange={(event) => setLinkedInJobsSort(event.target.value as typeof linkedinJobsSort)}>
              <option value="relevant">Relevant</option>
              <option value="most_recent">Most recent</option>
            </select>
          </label>
        </div>
        <label className="field">
          <span>Max pages</span>
          <input max={LINKEDIN_JOBS_MAX_PAGES} min={1} type="number" value={linkedinJobsMaxPages} onChange={(event) => setLinkedInJobsMaxPages(Number(event.target.value))} />
        </label>
        <button className="primary-button" disabled={!canUseExternalSources || isLinkedInJobsRunning} onClick={() => void startLinkedInJobsExternalSearch()} type="button">
          Search LinkedIn Jobs
        </button>
        <LinkedInJobsDiagnosticsPanel />
      </div>

      <div className="search-section search-section--career">
        <div className="section-heading-row">
          <p className="section-label">Career-page search</p>
          <span className="latest-search-label">Last search: {latestCareerSearchLabel}</span>
        </div>
        <div className="form-row">
          <label className="field">
            <span>Max accepted</span>
            <input max={250} min={1} type="number" value={careerPageAcceptedLimit} onChange={(event) => setCareerPageAcceptedLimit(Number(event.target.value))} />
          </label>
          <label className="field">
            <span>Inspect cap</span>
            <input max={1000} min={1} type="number" value={careerPageInspectedCap} onChange={(event) => setCareerPageInspectedCap(Number(event.target.value))} />
          </label>
        </div>
        <button className="primary-button" disabled={!canUseExternalSources || isCareerSearchRunning} onClick={() => void startCareerPageSearch()} type="button">
          Search career pages
        </button>
        {latestCareerPageRun ? <p className="message">{latestCareerPageRun.status}: {latestCareerPageRun.accepted_count} accepted, {latestCareerPageRun.rejected_count} rejected, {latestCareerPageRun.duplicate_count} duplicate.</p> : null}
      </div>
    </>
  )
}

function LinkedInPostsSearchPanel() {
  const aiFiltersEnabled = usePopupStore((state) => state.aiFiltersEnabled)
  const acceptedRegions = usePopupStore((state) => state.acceptedRegions)
  const excludedRegions = usePopupStore((state) => state.excludedRegions)
  const remoteOnly = usePopupStore((state) => state.remoteOnly)
  const excludeOnsite = usePopupStore((state) => state.excludeOnsite)
  const sortMode = usePopupStore((state) => state.sortMode)
  const pastMonthOnly = usePopupStore((state) => state.pastMonthOnly)
  const maxPosts = usePopupStore((state) => state.maxPosts)
  const maxScrolls = usePopupStore((state) => state.maxScrolls)
  const captureProgress = usePopupStore((state) => state.captureProgress)
  const setAiFiltersEnabled = usePopupStore((state) => state.setAiFiltersEnabled)
  const setAcceptedRegions = usePopupStore((state) => state.setAcceptedRegions)
  const setExcludedRegions = usePopupStore((state) => state.setExcludedRegions)
  const setRemoteOnly = usePopupStore((state) => state.setRemoteOnly)
  const setExcludeOnsite = usePopupStore((state) => state.setExcludeOnsite)
  const setSortMode = usePopupStore((state) => state.setSortMode)
  const setPastMonthOnly = usePopupStore((state) => state.setPastMonthOnly)
  const setMaxPosts = usePopupStore((state) => state.setMaxPosts)
  const setMaxScrolls = usePopupStore((state) => state.setMaxScrolls)
  const startCapture = usePopupStore((state) => state.startCapture)
  const isCapturing = CAPTURE_BUSY_STATUSES.has(captureProgress.status)

  return (
    <>
      <div className="search-section">
        <p className="section-label">LinkedIn post search</p>
        <SearchTextField />
        <SavedKeywordBadges />
        <label className="field">
          <span>Sort</span>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as "recent" | "relevant")}>
            <option value="recent">Most recent</option>
            <option value="relevant">Most relevant</option>
          </select>
        </label>
        <label className="toggle-row">
          <input checked={pastMonthOnly} onChange={(event) => setPastMonthOnly(event.target.checked)} type="checkbox" />
          <span>
            <strong>Past month</strong>
            <small>Apply LinkedIn's last-month date facet.</small>
          </span>
        </label>
        <p className="message">LinkedIn post capture uses this text, sort order, optional date facet, and post AI filters only.</p>
      </div>
      <div className={`search-section ${aiFiltersEnabled ? "" : "search-section--disabled"}`}>
        <label className="toggle-row">
          <input checked={aiFiltersEnabled} onChange={(event) => setAiFiltersEnabled(event.target.checked)} type="checkbox" />
          <span>
            <strong>AI filters</strong>
            <small>Optional post-capture review. Disabled by default.</small>
          </span>
        </label>
        <div className="checkbox-grid">
          <label><input checked={remoteOnly} disabled={!aiFiltersEnabled} onChange={(event) => setRemoteOnly(event.target.checked)} type="checkbox" />Remote only</label>
          <label><input checked={excludeOnsite} disabled={!aiFiltersEnabled} onChange={(event) => setExcludeOnsite(event.target.checked)} type="checkbox" />Exclude onsite/hybrid</label>
        </div>
        <label className="field"><span>Accepted regions</span><input disabled={!aiFiltersEnabled} placeholder="LATAM, Brazil, Portugal, Europe" value={acceptedRegions} onChange={(event) => setAcceptedRegions(event.target.value)} /></label>
        <label className="field"><span>Exclude regions</span><input disabled={!aiFiltersEnabled} placeholder="India, Bengaluru, Pune" value={excludedRegions} onChange={(event) => setExcludedRegions(event.target.value)} /></label>
      </div>
      <div className="form-row">
        <label className="field"><span>Max posts</span><input max={CAPTURE_MAX_POSTS} min={1} type="number" value={maxPosts} onChange={(event) => setMaxPosts(Number(event.target.value))} /></label>
        <label className="field"><span>Max scrolls</span><input max={CAPTURE_MAX_SCROLLS} min={0} type="number" value={maxScrolls} onChange={(event) => setMaxScrolls(Number(event.target.value))} /></label>
      </div>
      <button className="primary-button" disabled={isCapturing} onClick={() => void startCapture()} type="button">Open LinkedIn and capture</button>
      <p className={`message ${captureProgress.status === "failed" ? "message--error" : ""}`}>{captureProgress.message}</p>
      <CaptureDebugPanel />
    </>
  )
}

function LinkedInJobsDiagnosticsPanel() {
  const progress = usePopupStore((state) => state.linkedinJobsProgress)
  const diagnostics = progress.diagnostics
  const latestRun = usePopupStore((state) => state.latestLinkedInJobsExternalRun)
  const displayedStatus = progress.status !== "idle" ? progress.status : latestRun?.status || progress.status
  if (!diagnostics && !latestRun && progress.status === "idle") return null
  return (
    <div className="debug-panel">
      <p className="section-label">LinkedIn Jobs diagnostics</p>
      <p className={`message ${progress.status === "failed" ? "message--error" : ""}`}>{progress.message}</p>
      <dl className="debug-list">
        <div><dt>Run</dt><dd>{progress.runId || latestRun?.id || "-"}</dd></div>
        <div><dt>Status</dt><dd>{displayedStatus}</dd></div>
        <div><dt>Pages</dt><dd>{diagnostics?.pagesVisited ?? "-"}</dd></div>
        <div><dt>Inspected</dt><dd>{diagnostics?.jobsInspected ?? latestRun?.inspected_count ?? "-"}</dd></div>
        <div><dt>Accepted</dt><dd>{diagnostics?.accepted ?? latestRun?.accepted_count ?? "-"}</dd></div>
        <div><dt>Easy Apply skipped</dt><dd>{diagnostics?.skippedEasyApply ?? "-"}</dd></div>
        <div><dt>Unsupported</dt><dd>{diagnostics?.unsupportedSource ?? "-"}</dd></div>
        <div><dt>Duplicates</dt><dd>{diagnostics?.duplicates ?? latestRun?.duplicate_count ?? "-"}</dd></div>
        <div><dt>Failures</dt><dd>{diagnostics?.failures ?? "-"}</dd></div>
        <div><dt>Navigation</dt><dd>{diagnostics?.navigationMethod || "-"}</dd></div>
        <div><dt>Terminal reason</dt><dd>{diagnostics?.terminalReason || latestRun?.stop_reason || "-"}</dd></div>
      </dl>
    </div>
  )
}
function CaptureDebugPanel() {
  const captureProgress = usePopupStore((state) => state.captureProgress)

  if (captureProgress.status === "idle") {
    return null
  }

  const isCompleted = captureProgress.status === "completed"
  const isFailed = captureProgress.status === "failed"
  const isTimedOut = Boolean(captureProgress.verification?.timedOut)
  const isProcessing = captureProgress.status === "processing"
  const runStatus = captureProgress.verification?.runStatus
  const feedbackClass = isFailed
    ? "capture-summary capture-summary--failed"
    : isCompleted
      ? "capture-summary capture-summary--completed"
      : isProcessing
        ? "capture-summary capture-summary--processing"
        : "capture-summary"
  const opportunitiesCreated = captureProgress.verification?.opportunitiesCount ?? 0

  return (
    <div className="debug-panel">
      <p className="section-label">Capture feedback</p>
      <div className={feedbackClass}>
        <strong>
          {isCompleted ? "Analysis finished" : isTimedOut ? "Analysis timed out" : isFailed ? "Capture failed" : "Analysis in progress"}
        </strong>
        <span>{captureProgress.verification?.message || captureProgress.message}</span>
        {isCompleted ? (
          <div className="capture-summary-metrics">
            <span>{captureProgress.postsFound ?? 0} posts</span>
            <span>{captureProgress.verification?.candidatesCount ?? 0} candidates</span>
            <span>{opportunitiesCreated} saved</span>
          </div>
        ) : null}
      </div>
      <dl className="debug-list">
        <div>
          <dt>Capture status</dt>
          <dd>{captureProgress.status}</dd>
        </div>
        <div>
          <dt>Run status</dt>
          <dd>{runStatus || "-"}</dd>
        </div>
        <div>
          <dt>Posts captured</dt>
          <dd>{captureProgress.postsFound ?? "-"}</dd>
        </div>
        <div>
          <dt>Run ID</dt>
          <dd>{captureProgress.runId || "-"}</dd>
        </div>
        <div>
          <dt>Candidates</dt>
          <dd>{captureProgress.verification?.candidatesCount ?? "-"}</dd>
        </div>
        <div>
          <dt>Run opps</dt>
          <dd>{captureProgress.verification?.opportunitiesCount ?? "-"}</dd>
        </div>
        <div>
          <dt>Accepted / rejected / duplicate</dt>
          <dd>
            {captureProgress.verification
              ? `${captureProgress.verification.acceptedCount ?? 0} / ${captureProgress.verification.rejectedCount ?? 0} / ${captureProgress.verification.duplicateCount ?? 0}`
              : "-"}
          </dd>
        </div>
        <div>
          <dt>AI passed / rejected / fallback</dt>
          <dd>
            {captureProgress.verification
              ? `${captureProgress.verification.aiFilterPassedCount ?? 0} / ${captureProgress.verification.aiFilterRejectedCount ?? 0} / ${captureProgress.verification.aiFilterFallbackCount ?? 0}`
              : "-"}
          </dd>
        </div>
        <div>
          <dt>AI failed / skipped</dt>
          <dd>
            {captureProgress.verification
              ? `${captureProgress.verification.aiFilterFailedCount ?? 0} / ${captureProgress.verification.aiFilterSkippedCount ?? 0}`
              : "-"}
          </dd>
        </div>
        <div>
          <dt>Selector scans</dt>
          <dd>{captureProgress.diagnostics?.selectorScans.length ?? "-"}</dd>
        </div>
        <div>
          <dt>Scroll checks</dt>
          <dd>{captureProgress.diagnostics?.scrolls.length ?? "-"}</dd>
        </div>
      </dl>
      {captureProgress.verification?.message ? <p className="message">{captureProgress.verification.message}</p> : null}
      {captureProgress.verification?.aiFilterSamples?.length ? (
        <div className="ai-filter-samples">
          {captureProgress.verification.aiFilterSamples.map((sample, index) => (
            <div className={`ai-filter-sample ai-filter-sample--${sample.status}`} key={`${sample.status}-${index}`}>
              <strong>{sample.status}</strong>
              {sample.confidence != null ? <span>{Math.round(sample.confidence * 100)}% confidence</span> : null}
              {sample.reason ? <p>{sample.reason}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      {captureProgress.diagnostics?.samples.length ? (
        <div className="debug-previews">
          {captureProgress.diagnostics.samples.slice(0, 3).map((sample) => (
            <details key={`${sample.label}-${sample.textLength}`}>
              <summary>
                {sample.label} · {sample.textLength} chars
              </summary>
              <p>{sample.textPreview}</p>
            </details>
          ))}
        </div>
      ) : null}
      {captureProgress.sampleLabels?.length ? (
        <div className="debug-samples">
          {captureProgress.sampleLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      ) : null}
      {captureProgress.runId ? (
        <div className="debug-links">
          <a href={`${API_BASE_URL}/job-search-runs/${captureProgress.runId}`} rel="noreferrer" target="_blank">
            Run
          </a>
          <a href={`${API_BASE_URL}/job-search-runs/${captureProgress.runId}/candidates`} rel="noreferrer" target="_blank">
            Candidates
          </a>
          <a href={`${API_BASE_URL}/job-search-runs/${captureProgress.runId}/opportunities`} rel="noreferrer" target="_blank">
            Opportunities
          </a>
        </div>
      ) : null}
      <p className="message">
        If the run exists but the job count does not increase, the worker probably deduped the posts or rejected them without public contact.
      </p>
    </div>
  )
}
