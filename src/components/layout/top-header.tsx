"use client"

import { MenuIcon, PanelLeftIcon, UserIcon } from "@/components/layout/icons"
import { Button } from "@/components/ui/button"

export function TopHeader({
  sidebarCollapsed,
  onMenuClick,
}: {
  pathname: string
  sidebarCollapsed: boolean
  onMenuClick: () => void
}) {
  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="topbar-menu-btn"
          onClick={onMenuClick}
          aria-label={
            sidebarCollapsed ? "Expand navigation" : "Toggle navigation"
          }
        >
          <span className="topbar-menu-mobile">
            <MenuIcon />
          </span>
          <span className="topbar-menu-desktop">
            <PanelLeftIcon />
          </span>
        </Button>
        <div className="topbar-context">
          <p className="topbar-eyebrow">SasthaSoft</p>
          <p className="topbar-title">Inventory Management</p>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-status">
          <span className="topbar-status-dot" aria-hidden />
          Systems live
        </div>
        <div className="topbar-user">
          <div className="topbar-avatar" aria-hidden>
            <UserIcon width={16} height={16} />
          </div>
          <div className="topbar-user-meta">
            <span className="topbar-user-name">Admin User</span>
            <span className="topbar-user-role">Operations</span>
          </div>
        </div>
      </div>
    </header>
  )
}
