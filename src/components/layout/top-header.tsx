"use client"

import { getNavItem } from "@/components/layout/nav"
import { MenuIcon, UserIcon } from "@/components/layout/icons"
import { Button } from "@/components/ui/button"

export function TopHeader({
  pathname,
  onMenuClick,
}: {
  pathname: string
  onMenuClick: () => void
}) {
  const current = getNavItem(pathname)

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="topbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <MenuIcon />
        </Button>
        <div className="topbar-context">
          <p className="topbar-eyebrow">Inventory workspace</p>
          <p className="topbar-title">{current?.label ?? "Overview"}</p>
        </div>
      </div>

      <div className="topbar-right">
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
