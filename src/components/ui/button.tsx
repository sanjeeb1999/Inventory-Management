import { type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/cn"

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost"
type ButtonSize = "sm" | "md"

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  danger: "btn btn-danger",
  ghost: "btn btn-ghost",
}

const sizeClass: Record<ButtonSize, string> = {
  sm: "btn-sm",
  md: "",
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(variantClass[variant], sizeClass[size], className)}
      {...props}
    />
  )
}
