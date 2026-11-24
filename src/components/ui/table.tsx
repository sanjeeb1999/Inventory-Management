import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes } from "react"
import { cn } from "@/lib/cn"

export function Table({
  className,
  ...props
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="table-wrap">
      <table className={cn("table", className)} {...props} />
    </div>
  )
}

export function TableHeader({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={className} {...props} />
}

export function TableBody({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props} />
}

export function TableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={className} {...props} />
}

export function TableHead({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={className} {...props} />
}

export function TableCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={className} {...props} />
}
