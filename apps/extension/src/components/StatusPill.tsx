type StatusPillProps = {
  label: string
  tone?: "neutral" | "good" | "warn" | "danger"
}

export function StatusPill({ label, tone = "neutral" }: StatusPillProps) {
  return <span className={`status-pill status-pill--${tone}`}>{label}</span>
}
