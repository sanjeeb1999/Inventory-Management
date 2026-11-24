"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { TopHeader } from "@/components/layout/top-header"
import { hydrateStoreFromStorage } from "@/lib/store"
import { cn } from "@/lib/cn"

const SIDEBAR_COLLAPSED_KEY = "inventory-sidebar-collapsed"

function isDesktopViewport() {
  return window.matchMedia("(min-width: 1024px)").matches
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    hydrateStoreFromStorage()
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1")
    } catch {
      // ignore storage errors
    }
    setReady(true)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0")
    } catch {
      // ignore storage errors
    }
  }, [collapsed, ready])

  useEffect(() => {
    if (!mobileOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  function toggleSidebar() {
    if (isDesktopViewport()) {
      setCollapsed((value) => !value)
      setMobileOpen(false)
      return
    }
    setMobileOpen((value) => !value)
  }

  return (
    <div
      className={cn(
        "app-shell",
        collapsed && "sidebar-collapsed",
        mobileOpen && "sidebar-mobile-open"
      )}
    >
      <Sidebar
        pathname={pathname}
        mobileOpen={mobileOpen}
        collapsed={collapsed}
        onClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setCollapsed((value) => !value)}
      />

      <div className="app-main">
        <TopHeader
          pathname={pathname}
          sidebarCollapsed={collapsed}
          onMenuClick={toggleSidebar}
        />
        <div className="app-content" key={ready ? "hydrated" : "pending"}>
          {children}
        </div>
      </div>
    </div>
  )
}
