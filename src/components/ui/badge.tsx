import { type HTMLAttributes } from "react"
import { cn } from "@/lib/cn"

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "in-stock"
  | "low-stock"
  | "out-of-stock"
  | "completed"
  | "pending"
  | "received"

const toneClass: Record<BadgeTone, string> = {
  neutral: "badge badge-neutral",
  success: "badge badge-success",
  warning: "badge badge-warning",
  danger: "badge badge-danger",
  info: "badge badge-info",
  "in-stock": "status-badge in-stock",
  "low-stock": "status-badge low-stock",
  "out-of-stock": "status-badge out-of-stock",
  completed: "status-badge in-stock",
  pending: "status-badge low-stock",
  received: "status-badge in-stock",
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: BadgeProps) {
  return <span className={cn(toneClass[tone], className)} {...props} />
}

export function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  const tone = (status in toneClass ? status : "neutral") as BadgeTone
  return (
    <Badge tone={tone} className={className}>
      {status.replace(/-/g, " ")}
    </Badge>
  )
}
