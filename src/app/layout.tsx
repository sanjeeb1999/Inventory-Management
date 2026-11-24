import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import { AppShell } from "@/components/layout/app-shell"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
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
      <body className={`${dmSans.variable} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
