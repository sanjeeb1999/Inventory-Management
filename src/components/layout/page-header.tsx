import { type ReactNode } from "react"
import { cn } from "@/lib/cn"

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("page-header", className)}>
      <div className="page-header-copy">
        <h1 className="page-title">{title}</h1>
        {description ? (
          <p className="page-description">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </div>
  )
}
