import { type ReactNode } from "react"
import { cn } from "@/lib/cn"

export function PageHeader({
  title,
  description,
  actions,
  eyebrow = "Workspace",
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  eyebrow?: string
  className?: string
}) {
  return (
    <div className={cn("page-header", className)}>
      <div className="page-header-copy">
        <p className="page-eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        {description ? (
          <p className="page-description">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </div>
  )
}
