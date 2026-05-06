import { API_BASE_URL } from "../../api/client"
import { CAPTURE_MAX_POSTS, CAPTURE_MAX_SCROLLS, usePopupStore } from "../../store/popupStore"

const CAPTURE_BUSY_STATUSES = new Set(["opening", "capturing", "submitting"])

export function SearchView() {
  const keywords = usePopupStore((state) => state.keywords)
  const region = usePopupStore((state) => state.region)
  const aiFiltersEnabled = usePopupStore((state) => state.aiFiltersEnabled)
  const acceptedRegions = usePopupStore((state) => state.acceptedRegions)
  const excludedRegions = usePopupStore((state) => state.excludedRegions)
  const remoteOnly = usePopupStore((state) => state.remoteOnly)
  const excludeOnsite = usePopupStore((state) => state.excludeOnsite)
  const sortMode = usePopupStore((state) => state.sortMode)
  const maxPosts = usePopupStore((state) => state.maxPosts)
  const maxScrolls = usePopupStore((state) => state.maxScrolls)
  const captureProgress = usePopupStore((state) => state.captureProgress)
  const setKeywords = usePopupStore((state) => state.setKeywords)
  const setRegion = usePopupStore((state) => state.setRegion)
  const setAiFiltersEnabled = usePopupStore((state) => state.setAiFiltersEnabled)
  const setAcceptedRegions = usePopupStore((state) => state.setAcceptedRegions)
  const setExcludedRegions = usePopupStore((state) => state.setExcludedRegions)
  const setRemoteOnly = usePopupStore((state) => state.setRemoteOnly)
  const setExcludeOnsite = usePopupStore((state) => state.setExcludeOnsite)
  const setSortMode = usePopupStore((state) => state.setSortMode)
  const setMaxPosts = usePopupStore((state) => state.setMaxPosts)
  const setMaxScrolls = usePopupStore((state) => state.setMaxScrolls)
  const startCapture = usePopupStore((state) => state.startCapture)
  const isCapturing = CAPTURE_BUSY_STATUSES.has(captureProgress.status)

  return (
    <section className="card">
      <h2 className="card-title">Capture LinkedIn posts</h2>
      <div className="search-section">
        <p className="section-label">LinkedIn search</p>
      <label className="field">
        <span>Search text</span>
        <input value={keywords} onChange={(event) => setKeywords(event.target.value)} />
      </label>
      <div className="form-row">
        <label className="field">
          <span>Sort</span>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as "recent" | "relevant")}>
            <option value="recent">Most recent</option>
            <option value="relevant">Most relevant</option>
          </select>
        </label>
        <label className="field">
          <span>Region</span>
          <input
            placeholder="Optional text added to search query"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          />
        </label>
      </div>
      <p className="message">LinkedIn opens with only this search text, optional query region, and sort order.</p>
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
          <label>
            <input checked={remoteOnly} disabled={!aiFiltersEnabled} onChange={(event) => setRemoteOnly(event.target.checked)} type="checkbox" />
            Remote only
          </label>
          <label>
            <input checked={excludeOnsite} disabled={!aiFiltersEnabled} onChange={(event) => setExcludeOnsite(event.target.checked)} type="checkbox" />
            Exclude onsite/hybrid
          </label>
        </div>
      <label className="field">
        <span>Accepted regions</span>
        <input
          disabled={!aiFiltersEnabled}
          placeholder="LATAM, Brazil, Portugal, Europe"
          value={acceptedRegions}
          onChange={(event) => setAcceptedRegions(event.target.value)}
        />
      </label>
      <label className="field">
        <span>Exclude regions</span>
        <input
          disabled={!aiFiltersEnabled}
          placeholder="India, Bengaluru, Pune"
          value={excludedRegions}
          onChange={(event) => setExcludedRegions(event.target.value)}
        />
      </label>
      <p className="message">
        AI reads captured posts after collection and weighs these preferences with your default resume/profile context.
      </p>
      </div>
      <div className="form-row">
        <label className="field">
          <span>Max posts</span>
          <input
            max={CAPTURE_MAX_POSTS}
            min={1}
            type="number"
            value={maxPosts}
            onChange={(event) => setMaxPosts(Number(event.target.value))}
          />
        </label>
        <label className="field">
          <span>Max scrolls</span>
          <input
            max={CAPTURE_MAX_SCROLLS}
            min={0}
            type="number"
            value={maxScrolls}
            onChange={(event) => setMaxScrolls(Number(event.target.value))}
          />
        </label>
      </div>
      <button className="primary-button" disabled={isCapturing} onClick={() => void startCapture()} type="button">
        Open LinkedIn and capture
      </button>
      <p className={`message ${captureProgress.status === "failed" ? "message--error" : ""}`}>{captureProgress.message}</p>
      <CaptureDebugPanel />
    </section>
  )
}

function CaptureDebugPanel() {
  const captureProgress = usePopupStore((state) => state.captureProgress)

  if (captureProgress.status === "idle") {
    return null
  }

  return (
    <div className="debug-panel">
      <p className="section-label">Capture feedback</p>
      <dl className="debug-list">
        <div>
          <dt>Status</dt>
          <dd>{captureProgress.status}</dd>
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
