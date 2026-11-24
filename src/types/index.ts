/// <reference types="node" />

import { type ReactNode } from "react"

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  currentQuantity: number
  minStockLevel: number
  unit: string
  updatedAt: string
}

export interface Sale {
  id: string
  customer: string
  productId: string
  quantity: number
  unitPrice: number
  total: number
  status: "completed" | "pending"
  date: string
}

export interface Purchase {
  id: string
  supplier: string
  productId: string
  quantity: number
  unitCost: number
  total: number
  status: "pending" | "received"
  date: string
}

export interface RecentActivity {
  id: string
  type: "sale" | "purchase" | "stock"
  title: string
  description: string
  timestamp: string
  relatedId: string // sale id or purchase id
}

export interface DashboardKPIs {
  totalProducts: number
  totalStockQuantity: number
  lowStockItems: number
  totalSales: number
  totalPurchases: number
}

export interface FilterOptions {
  search: string
  category?: string
  status?: string
}

// Type for the shared application state
export interface AppState {
  products: Product[]
  sales: Sale[]
  purchases: Purchase[]
  recentActivity: RecentActivity[]
}

// Initial mock data
export const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Wireless Keyboard",
    sku: "SKU-1001",
    category: "Peripherals",
    currentQuantity: 24,
    minStockLevel: 10,
    unit: "pcs",
    updatedAt: "2026-11-20T09:00:00.000Z",
  },
  {
    id: "p2",
    name: "Barcode Scanner",
    sku: "SKU-1002",
    category: "Peripherals",
    currentQuantity: 12,
    minStockLevel: 8,
    unit: "pcs",
    updatedAt: "2026-11-21T11:30:00.000Z",
  },
  {
    id: "p3",
    name: "Thermal Printer",
    sku: "SKU-2001",
    category: "Equipment",
    currentQuantity: 6,
    minStockLevel: 10,
    unit: "pcs",
    updatedAt: "2026-11-18T14:15:00.000Z",
  },
  {
    id: "p4",
    name: "Office Chair",
    sku: "SKU-3001",
    category: "Furniture",
    currentQuantity: 15,
    minStockLevel: 8,
    unit: "pcs",
    updatedAt: "2026-11-19T08:45:00.000Z",
  },
  {
    id: "p5",
    name: "A4 Paper (500 pack)",
    sku: "SKU-4001",
    category: "Supplies",
    currentQuantity: 3,
    minStockLevel: 15,
    unit: "packs",
    updatedAt: "2026-11-22T10:00:00.000Z",
  },
  {
    id: "p6",
    name: "USB-C Hub",
    sku: "SKU-5001",
    category: "Accessories",
    currentQuantity: 38,
    minStockLevel: 12,
    unit: "pcs",
    updatedAt: "2026-11-23T16:20:00.000Z",
  },
  {
    id: "p7",
    name: "Laser Printer",
    sku: "SKU-2002",
    category: "Equipment",
    currentQuantity: 2,
    minStockLevel: 5,
    unit: "pcs",
    updatedAt: "2026-11-17T13:10:00.000Z",
  },
  {
    id: "p8",
    name: "Network Switch",
    sku: "SKU-6001",
    category: "Networking",
    currentQuantity: 9,
    minStockLevel: 6,
    unit: "pcs",
    updatedAt: "2026-11-22T15:40:00.000Z",
  },
]

export const MOCK_SALES: Sale[] = []

export const MOCK_PURCHASES: Purchase[] = []

export const MOCK_RECENT_ACTIVITY: RecentActivity[] = MOCK_PRODUCTS.map((product) => ({
  id: `init-${product.id}`,
  type: "stock",
  title: "Initial stock",
  description: `Opening balance of ${product.currentQuantity} ${product.unit} for ${product.name}`,
  timestamp: product.updatedAt,
  relatedId: product.id,
}))