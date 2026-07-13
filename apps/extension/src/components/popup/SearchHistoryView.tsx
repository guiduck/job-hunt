import { useEffect } from "react"

import type { SearchAggregate, SearchHistoryRun } from "../../api/types"
import { usePopupStore } from "../../store/popupStore"
import { formatHistoryDate, formatRawCount } from "../../utils/searchHistory"

function queryLabel(run: SearchHistoryRun) {
  return run.search_query || run.requested_keywords.join(" ") || "Untitled search"
}

function AggregateList({ title, items }: { title: string; items: SearchAggregate[] }) {
  return (
    <section className="history-section">
      <h2 className="card-title">{title}</h2>
      {items.length === 0 ? (
        <p className="empty-state">No search data yet.</p>
      ) : (
        <ol className="history-ranking-list">
          {items.slice(0, 8).map((item) => (
            <li key={item.value}>
              <strong>{item.value}</strong>
              <span>{item.run_count} runs</span>
              <span>{formatRawCount(item.total_raw_linkedin_results)} raw</span>
              <span>{item.duplicate_count} duplicates</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export function SearchHistoryView() {
  const loading = usePopupStore((state) => state.loading)
  const searchHistory = usePopupStore((state) => state.searchHistory)
  const refreshSearchHistory = usePopupStore((state) => state.refreshSearchHistory)

  useEffect(() => {
    if (!searchHistory) {
      void refreshSearchHistory()
    }
  }, [refreshSearchHistory, searchHistory])

  const runs = searchHistory?.runs || []

  return (
    <div className="history-view">
      <section className="history-section">
        <div className="section-heading-row">
          <h2 className="card-title">Recent LinkedIn Searches</h2>
          <button className="icon-action" disabled={loading} onClick={() => void refreshSearchHistory()} type="button">
            Refresh
          </button>
        </div>
        {runs.length === 0 ? (
          <p className="empty-state">No LinkedIn searches captured yet.</p>
        ) : (
          <ul className="history-run-list">
            {runs.map((run) => (
              <li className="history-run-card" key={run.id}>
                <div className="history-run-header">
                  <strong>{queryLabel(run)}</strong>
                  <span>{formatHistoryDate(run.completed_at || run.started_at || run.created_at)}</span>
                </div>
                <div className="history-metric-row">
                  <span>Raw {formatRawCount(run.raw_linkedin_result_count)}</span>
                  <span>Checked {run.inspected_count}</span>
                  <span>Accepted {run.accepted_count}</span>
                  <span>Duplicates {run.duplicate_count}</span>
                </div>
                <div className="pill-row">
                  <span className="status-pill">{run.status}</span>
                  <span className="status-pill">{run.search_sort_order}</span>
                  <span className="status-pill">AI rejected {run.ai_filter_rejected_count}</span>
                </div>
                {run.diagnostic_message ? <p className="message message--warn">{run.diagnostic_message}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <AggregateList title="Best Keywords" items={searchHistory?.keyword_aggregates || []} />
      <AggregateList title="Best Search Queries" items={searchHistory?.query_aggregates || []} />
    </div>
  )
}