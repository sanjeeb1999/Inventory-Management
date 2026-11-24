export type NavItem = {
  href: string
  label: string
  description: string
}

export const APP_NAME = "SasthaSoft"
export const APP_PRODUCT = "Inventory"

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Overview of inventory performance",
  },
  {
    href: "/sales",
    label: "Sales",
    description: "Manage sales orders and invoices",
  },
  {
    href: "/purchases",
    label: "Purchases",
    description: "Track purchase orders and receipts",
  },
  {
    href: "/stock",
    label: "Stock",
    description: "Monitor product inventory levels",
  },
  {
    href: "/reports",
    label: "Reports",
    description: "Business reports and summaries",
  },
]

export function getNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
}
