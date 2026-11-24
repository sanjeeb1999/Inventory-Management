"use client"

import Link from "next/link"
import { APP_NAME, APP_PRODUCT, NAV_ITEMS } from "@/components/layout/nav"
import {
  ChevronLeftIcon,
  CloseIcon,
  NAV_ICONS,
} from "@/components/layout/icons"
import { cn } from "@/lib/cn"

export function Sidebar({
  pathname,
  mobileOpen,
  collapsed,
  onClose,
  onToggleCollapse,
}: {
  pathname: string
  mobileOpen: boolean
  collapsed: boolean
  onClose: () => void
  onToggleCollapse: () => void
}) {
  return (
    <>
      <div
        className={cn("sidebar-backdrop", mobileOpen && "is-open")}
        onClick={onClose}
        aria-hidden={!mobileOpen}
      />

      <aside
        className={cn(
          "app-sidebar",
          mobileOpen && "is-open",
          collapsed && "is-collapsed"
        )}
        aria-label="Primary"
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark" aria-hidden>
            <span className="sidebar-brand-mark-inner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 12 4 8.5M12 12l8-3.5M12 12v8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
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
                title={item.label}
              >
                <span className="sidebar-item-icon">{Icon ? <Icon /> : null}</span>
                <span className="sidebar-item-label">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-copy">
            <div className="sidebar-footer-pill">
              <span className="sidebar-live-dot" aria-hidden />
              Live demo
            </div>
            <p className="sidebar-footer-label">Trial workspace</p>
            <p className="sidebar-footer-text">Connected inventory workflows</p>
          </div>

          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeftIcon />
            <span className="sidebar-collapse-label">
              {collapsed ? "Expand" : "Collapse"}
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
