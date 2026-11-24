"use client"

import { useEffect, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { TopHeader } from "@/components/layout/top-header"
import { hydrateStoreFromStorage } from "@/lib/store"

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    hydrateStoreFromStorage()
    setReady(true)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

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

  return (
    <div className="app-shell">
      <Sidebar
        pathname={pathname}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="app-main">
        <TopHeader
          pathname={pathname}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="app-content" key={ready ? "hydrated" : "pending"}>
          {children}
        </div>
      </div>
    </div>
  )
}
