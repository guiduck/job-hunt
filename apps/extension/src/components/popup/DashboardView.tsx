import { useMemo } from "react"

import { usePopupStore } from "../../store/popupStore"

export function DashboardView() {
  const opportunities = usePopupStore((state) => state.opportunities)
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

  const metrics = useMemo(() => {
    return opportunities.reduce(
      (totals, opportunity) => {
        const detail = opportunity.job_detail
        const reviewStatus = detail?.review_profile?.review_status
        const jobStage = detail?.job_stage

        return {
          total: totals.total + 1,
          withEmail: totals.withEmail + (detail?.contact_email ? 1 : 0),
          saved: totals.saved + (reviewStatus === "saved" ? 1 : 0),
          applied: totals.applied + (jobStage === "applied" ? 1 : 0),
          interviews: totals.interviews + (jobStage === "interview" ? 1 : 0)
        }
      },
      { total: 0, withEmail: 0, saved: 0, applied: 0, interviews: 0 }
    )
  }, [opportunities])

  return (
    <>
      <section className="card">
        <h2 className="card-title">Local API snapshot</h2>
        <div className="metric-grid">
          <Metric value={metrics.total} label="job opportunities" />
          <Metric value={metrics.withEmail} label="with email" />
          <Metric value={metrics.saved} label="saved" />
          <Metric value={metrics.interviews} label="interviews" />
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
