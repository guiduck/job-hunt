import { usePopupStore } from "../../store/popupStore"

export function BulkEmailPanel({ selectedIds }: { selectedIds: string[] }) {
  const bulkPreview = usePopupStore((state) => state.bulkPreview)
  const emailTemplates = usePopupStore((state) => state.emailTemplates)
  const previewBulkSend = usePopupStore((state) => state.previewBulkSend)
  const approveBulkSend = usePopupStore((state) => state.approveBulkSend)
  const template = emailTemplates.find((item) => item.template_kind === "job_application" && item.is_active)

  return (
    <section className="card bulk-email-panel">
      <h3 className="card-title">Bulk email</h3>
      <p className="muted">{selectedIds.length} selected. Future plan limits should come from subscription rules.</p>
      <div className="detail-actions">
        <button
          className="secondary-button"
          disabled={!template || selectedIds.length === 0}
          onClick={() => (template ? void previewBulkSend(selectedIds, template.id) : undefined)}
          type="button">
          Preview bulk
        </button>
        <button className="primary-button" disabled={!bulkPreview} onClick={() => void approveBulkSend()} type="button">
          Approve bulk
        </button>
      </div>
      {bulkPreview ? (
        <div className="bulk-summary">
          <span>Sendable: {bulkPreview.sendable_count}</span>
          <span>Missing: {bulkPreview.skipped_missing_contact_count}</span>
          <span>Duplicates: {bulkPreview.skipped_duplicate_count}</span>
          <span>Invalid: {bulkPreview.blocked_invalid_contact_count}</span>
        </div>
      ) : null}
    </section>
  )
}
