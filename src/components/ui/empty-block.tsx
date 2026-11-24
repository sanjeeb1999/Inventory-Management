import { type ReactNode } from "react"

export function EmptyBlock({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="dashboard-empty">
      <p className="dashboard-empty-title">{title}</p>
      <p className="dashboard-empty-copy">{description}</p>
      {action ? <div className="dashboard-empty-action">{action}</div> : null}
    </div>
  )
}
