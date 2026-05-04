import type { OutreachEvent } from "../../api/types"

export function EmailHistoryTimeline({ events }: { events: OutreachEvent[] }) {
  if (events.length === 0) {
    return <p className="message">No email history yet.</p>
  }

  return (
    <ol className="email-history">
      {events.map((event) => (
        <li key={event.id}>
          <strong>{event.status}</strong>
          <span>{event.recipient_email}</span>
          {event.error_message ? <span>{event.error_message}</span> : null}
        </li>
      ))}
    </ol>
  )
}
