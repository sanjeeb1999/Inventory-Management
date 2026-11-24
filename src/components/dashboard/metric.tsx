import { type ReactNode } from "react"

export function Metric({
  label,
  value,
  context,
  icon,
  tone = "neutral",
}: {
  label: string
  value: string
  context: string
  icon: ReactNode
  tone?: "neutral" | "warning" | "sales" | "purchases"
}) {
  return (
    <article className={`dash-metric dash-metric-${tone}`}>
      <span className="dash-metric-icon">{icon}</span>
      <p className="dash-metric-label">{label}</p>
      <p className="dash-metric-value">{value}</p>
      <p className="dash-metric-context">{context}</p>
    </article>
  )
}
