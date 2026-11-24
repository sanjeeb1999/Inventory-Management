"use client"

import Link from "next/link"
import { APP_NAME, APP_PRODUCT, NAV_ITEMS } from "@/components/layout/nav"
import { CloseIcon, NAV_ICONS } from "@/components/layout/icons"
import { cn } from "@/lib/cn"

export function Sidebar({
  pathname,
  mobileOpen,
  onClose,
}: {
  pathname: string
  mobileOpen: boolean
  onClose: () => void
}) {
  return (
    <>
      <div
        className={cn("sidebar-backdrop", mobileOpen && "is-open")}
        onClick={onClose}
        aria-hidden={!mobileOpen}
      />

      <aside
        className={cn("app-sidebar", mobileOpen && "is-open")}
        aria-label="Primary"
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark" aria-hidden>
            S
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">{APP_NAME}</span>
            <span className="sidebar-brand-product">{APP_PRODUCT}</span>
          </div>
          <button
            type="button"
            className="sidebar-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-section-label">Operations</p>
          {NAV_ITEMS.map((item) => {
            const Icon = NAV_ICONS[item.href as keyof typeof NAV_ICONS]
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("sidebar-item", active && "active")}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
              >
                {Icon ? <Icon /> : null}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-footer-label">Trial workspace</p>
          <p className="sidebar-footer-text">Inventory management demo</p>
        </div>
      </aside>
    </>
  )
}
