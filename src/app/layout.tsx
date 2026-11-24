import type { Metadata } from "next"
import { Outfit, Plus_Jakarta_Sans } from "next/font/google"
import { AppShell } from "@/components/layout/app-shell"
import "./globals.css"
import "./dashboard-ui.css"
import "./module-ui.css"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  title: "SasthaSoft Inventory",
  description: "Professional inventory management trial workspace",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${outfit.variable} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
