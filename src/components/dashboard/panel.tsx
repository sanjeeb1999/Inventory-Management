import { type ReactNode } from "react"

export function Panel({
  id,
  title,
  description,
  action,
  children,
  className = "",
}: {
  id: string
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`dash-panel ${className}`.trim()} aria-labelledby={id}>
      <header className="dash-panel-head">
        <div>
          <h2 id={id} className="dash-panel-title">
            {title}
          </h2>
          {description ? <p className="dash-panel-copy">{description}</p> : null}
        </div>
        {action ? <div className="dash-panel-action">{action}</div> : null}
      </header>
      {children}
    </section>
  )
}
