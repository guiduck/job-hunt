import { API_BASE_URL } from "../../api/client"
import { usePopupStore } from "../../store/popupStore"

const CAPTURE_BUSY_STATUSES = new Set(["opening", "capturing", "submitting"])

export function SearchView() {
  const keywords = usePopupStore((state) => state.keywords)
  const region = usePopupStore((state) => state.region)
  const sortMode = usePopupStore((state) => state.sortMode)
  const maxPosts = usePopupStore((state) => state.maxPosts)
  const maxScrolls = usePopupStore((state) => state.maxScrolls)
  const captureProgress = usePopupStore((state) => state.captureProgress)
  const setKeywords = usePopupStore((state) => state.setKeywords)
  const setRegion = usePopupStore((state) => state.setRegion)
  const setSortMode = usePopupStore((state) => state.setSortMode)
  const setMaxPosts = usePopupStore((state) => state.setMaxPosts)
  const setMaxScrolls = usePopupStore((state) => state.setMaxScrolls)
  const startCapture = usePopupStore((state) => state.startCapture)
  const isCapturing = CAPTURE_BUSY_STATUSES.has(captureProgress.status)

  return (
    <section className="card">
      <h2 className="card-title">Capture recent LinkedIn posts</h2>
      <label className="field">
        <span>Keywords</span>
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
            placeholder="Brazil, Portugal, LATAM, Europe remote"
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          />
        </label>
      </div>
      <div className="form-row">
        <label className="field">
          <span>Max posts</span>
          <input
            max={50}
            min={1}
            type="number"
            value={maxPosts}
            onChange={(event) => setMaxPosts(Number(event.target.value))}
          />
        </label>
        <label className="field">
          <span>Max scrolls</span>
          <input
            max={50}
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
          <dt>Selector scans</dt>
          <dd>{captureProgress.diagnostics?.selectorScans.length ?? "-"}</dd>
        </div>
        <div>
          <dt>Scroll checks</dt>
          <dd>{captureProgress.diagnostics?.scrolls.length ?? "-"}</dd>
        </div>
      </dl>
      {captureProgress.verification?.message ? <p className="message">{captureProgress.verification.message}</p> : null}
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
