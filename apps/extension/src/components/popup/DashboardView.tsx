import { usePopupStore } from "../../store/popupStore"

export function DashboardView() {
  const dashboardMetrics = usePopupStore((state) => state.dashboardMetrics)
  const runsCount = usePopupStore((state) => state.runsCount)
  const loading = usePopupStore((state) => state.loading)
  const currentUser = usePopupStore((state) => state.currentUser)
  const refreshData = usePopupStore((state) => state.refreshData)

  if (!currentUser) {
    return (
      <section className="card">
        <h2 className="card-title">Login required</h2>
        <p className="empty-state">Log in to load your job opportunities and email workflow.</p>
      </section>
    )
  }

  return (
    <>
      <section className="card">
        <h2 className="card-title">Local API snapshot</h2>
        <div className="metric-grid">
          <Metric value={dashboardMetrics.total} label="jobs total" />
          <Metric value={dashboardMetrics.unsent} label="jobs still unsent" />
        </div>
      </section>
      <section className="card">
        <h2 className="card-title">Recent runs</h2>
        <p className="empty-state">{runsCount} recent runs returned by the local API.</p>
        <button className="secondary-button" disabled={loading} onClick={() => void refreshData()} type="button">
          Refresh
        </button>
      </section>
    </>
  )
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="metric">
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
    </div>
  )
}
