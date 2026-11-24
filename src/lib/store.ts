"use client"

import { type Product, type Sale, type Purchase, type RecentActivity, type DashboardKPIs, type AppState, type FilterOptions, MOCK_PRODUCTS, MOCK_SALES, MOCK_PURCHASES, MOCK_RECENT_ACTIVITY } from "../types"

// Persistence key
const STORAGE_KEY = "inventory-management-state"

function normalizeProduct(product: Product): Product {
  return {
    ...product,
    sku: product.sku || `SKU-${product.id.toUpperCase()}`,
    updatedAt: product.updatedAt || new Date(0).toISOString(),
    currentQuantity: Number(product.currentQuantity) || 0,
    minStockLevel: Number(product.minStockLevel) || 0,
    unit: product.unit || "pcs",
    category: product.category || "Uncategorized",
    name: product.name || "Untitled product",
  }
}

function getDefaultState(): AppState {
  return {
    products: MOCK_PRODUCTS.map((p) => normalizeProduct({ ...p })),
    sales: [...MOCK_SALES],
    purchases: [...MOCK_PURCHASES],
    recentActivity: [...MOCK_RECENT_ACTIVITY],
  }
}

function readStoredState(): AppState | null {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null

  try {
    const parsed = JSON.parse(stored)
    if (!parsed.products || !Array.isArray(parsed.products)) return null

    const products: Product[] = parsed.products.map((product: Product) =>
      normalizeProduct(product)
    )
    const recentActivity: RecentActivity[] =
      Array.isArray(parsed.recentActivity) && parsed.recentActivity.length > 0
        ? parsed.recentActivity
        : products.map((product: Product) => ({
            id: `init-${product.id}`,
            type: "stock",
            title: "Initial stock",
            description: `Opening balance of ${product.currentQuantity} ${product.unit} for ${product.name}`,
            timestamp: product.updatedAt,
            relatedId: product.id,
          }))

    return {
      products,
      sales: Array.isArray(parsed.sales) ? parsed.sales : [],
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
      recentActivity,
    }
  } catch {
    return null
  }
}

const listeners = new Set<() => void>()

function notifyListeners(): void {
  listeners.forEach((listener) => listener())
}

// Save state to localStorage (client only)
function saveState(appState: AppState): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState))
  } catch {
    // Ignore localStorage errors (private browsing, etc.)
  }

  notifyListeners()
}

// Always start from defaults so SSR and the first client render match.
export const state: AppState = getDefaultState()

let hasHydrated = false

export function hydrateStoreFromStorage(): void {
  if (hasHydrated || typeof window === "undefined") return
  hasHydrated = true

  const stored = readStoredState()
  if (!stored) {
    notifyListeners()
    return
  }

  state.products = stored.products
  state.sales = stored.sales
  state.purchases = stored.purchases
  state.recentActivity = stored.recentActivity
  notifyListeners()
}

export function subscribeToStore(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Export updaters that will be re-exported from the store
export { saveState }

// Helper: Get a product by ID
export function getProductById(productId: string): Product | undefined {
  return state.products.find((p) => p.id === productId)
}

// Helper: Get total KPIs
export function getDashboardKPIs(): DashboardKPIs {
  const totalProducts = state.products.length
  const totalStockQuantity = state.products.reduce(
    (sum, p) => sum + p.currentQuantity,
    0
  )
  const lowStockItems = state.products.filter(
    (p) => p.currentQuantity <= p.minStockLevel
  ).length
  const totalSales = state.sales.length
  const totalPurchases = state.purchases.length

  return { totalProducts, totalStockQuantity, lowStockItems, totalSales, totalPurchases }
}

// Helper: Get low stock products
export function getLowStockProducts(): Product[] {
  return state.products.filter((p) => p.currentQuantity <= p.minStockLevel)
}

// Helper: Get recent activity (last 5)
export function getRecentActivity(): RecentActivity[] {
  return state.recentActivity.slice(0, 5)
}

// Helper: Get low stock alert count
export function getLowStockCount(): number {
  return state.products.filter((p) => p.currentQuantity <= p.minStockLevel).length
}

// Helper: Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Helper: Format date (stable for SSR — no current-time reads)
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "—"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

// Helper: Get status badge class
export function getStockStatusClass(currentQty: number, minQty: number): "in-stock" | "low-stock" | "out-of-stock" {
  if (currentQty <= 0) return "out-of-stock"
  if (currentQty <= minQty) return "low-stock"
  return "in-stock"
}

export type StockSummary = {
  totalProducts: number
  totalQuantity: number
  inStock: number
  lowStock: number
  outOfStock: number
}

export function getStockSummary(): StockSummary {
  const totalProducts = state.products.length
  const totalQuantity = state.products.reduce(
    (sum, product) => sum + product.currentQuantity,
    0
  )
  let inStock = 0
  let lowStock = 0
  let outOfStock = 0

  for (const product of state.products) {
    const status = getStockStatusClass(product.currentQuantity, product.minStockLevel)
    if (status === "out-of-stock") outOfStock += 1
    else if (status === "low-stock") lowStock += 1
    else inStock += 1
  }

  return { totalProducts, totalQuantity, inStock, lowStock, outOfStock }
}

export type StockHistoryEntry = {
  id: string
  productId: string
  productName: string
  action: string
  quantityChange: number
  timestamp: string
  type: RecentActivity["type"]
  reference?: string
}

export function getStockHistory(productId?: string): StockHistoryEntry[] {
  const entries: StockHistoryEntry[] = []

  for (const activity of state.recentActivity) {
    if (activity.type === "purchase") {
      const purchase =
        state.purchases.find((item) => item.id === activity.relatedId) ||
        state.purchases.find((item) => item.productId === activity.relatedId)

      if (!purchase) continue
      if (productId && purchase.productId !== productId) continue

      const product = getProductById(purchase.productId)
      entries.push({
        id: activity.id,
        productId: purchase.productId,
        productName: product?.name || "Unknown product",
        action: "Purchase received",
        quantityChange: purchase.quantity,
        timestamp: activity.timestamp,
        type: "purchase",
        reference: purchase.id,
      })
      continue
    }

    if (activity.type === "sale") {
      const sale =
        state.sales.find((item) => item.id === activity.relatedId) ||
        state.sales.find((item) => item.productId === activity.relatedId)

      if (!sale) continue
      if (productId && sale.productId !== productId) continue

      const product = getProductById(sale.productId)
      entries.push({
        id: activity.id,
        productId: sale.productId,
        productName: product?.name || "Unknown product",
        action: "Sale completed",
        quantityChange: -sale.quantity,
        timestamp: activity.timestamp,
        type: "sale",
        reference: sale.id,
      })
      continue
    }

    if (activity.type === "stock") {
      if (productId && activity.relatedId !== productId) continue
      const product = getProductById(activity.relatedId)
      const quantityMatch = activity.description.match(/(\d+)/)
      const quantity = quantityMatch ? Number(quantityMatch[1]) : product?.currentQuantity || 0

      entries.push({
        id: activity.id,
        productId: activity.relatedId,
        productName: product?.name || "Unknown product",
        action: activity.title || "Stock updated",
        quantityChange: quantity,
        timestamp: activity.timestamp,
        type: "stock",
        reference: activity.relatedId,
      })
    }
  }

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export function getProductCategories(): string[] {
  return Array.from(new Set(state.products.map((product) => product.category))).sort()
}

// Helper: Calculate total sales amount
export function getTotalSalesAmount(): number {
  return state.sales.reduce((sum, s) => sum + s.total, 0)
}

// Calculate total purchases amount
export function getTotalPurchasesAmount(): number {
  return state.purchases.reduce((sum, p) => sum + p.total, 0)
}

export type CreateSaleInput = {
  customer: string
  productId: string
  quantity: number
  unitPrice: number
  status?: Sale["status"]
  date?: string
}

export type SaleMutationResult =
  | { success: true; sale: Sale }
  | { success: false; error: string }

function suggestedUnitPrice(productId: string): number {
  const defaults: Record<string, number> = {
    p1: 49,
    p2: 129,
    p3: 189,
    p4: 159,
    p5: 12,
    p6: 39,
    p7: 249,
    p8: 179,
  }
  return defaults[productId] ?? 25
}

export function getSuggestedUnitPrice(productId: string): number {
  return suggestedUnitPrice(productId)
}

function validateSaleInput(input: CreateSaleInput): string | null {
  const customer = input.customer.trim()
  if (!customer) return "Enter a customer name."
  if (!input.productId) return "Select a product."

  const product = getProductById(input.productId)
  if (!product) return "Selected product was not found."

  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    return "Quantity must be greater than zero."
  }
  if (!Number.isInteger(input.quantity)) {
    return "Quantity must be a whole number."
  }
  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
    return "Enter a valid unit price."
  }

  return null
}

function applyCompletedSaleStock(sale: Sale): string | null {
  const product = getProductById(sale.productId)
  if (!product) return "Selected product was not found."

  if (product.currentQuantity < sale.quantity) {
    return `Only ${product.currentQuantity} ${product.unit} available for ${product.name}.`
  }

  product.currentQuantity -= sale.quantity
  product.updatedAt = sale.date

  const activity: RecentActivity = {
    id: `a${Date.now()}-sale`,
    type: "sale",
    title: "Sale Completed",
    description: `Sold ${sale.quantity}x ${product.name} to ${sale.customer}`,
    timestamp: sale.date,
    relatedId: sale.id,
  }
  state.recentActivity.unshift(activity)

  return null
}

function restoreCompletedSaleStock(sale: Sale): void {
  const product = getProductById(sale.productId)
  if (!product) return

  product.currentQuantity += sale.quantity
  product.updatedAt = new Date().toISOString()

  // Remove the completion activity tied to this sale so history stays accurate
  state.recentActivity = state.recentActivity.filter(
    (activity) => !(activity.type === "sale" && activity.relatedId === sale.id)
  )
}

// Create a new sale. Pending sales do not touch stock.
export function createSale(input: CreateSaleInput): SaleMutationResult {
  const validationError = validateSaleInput(input)
  if (validationError) return { success: false, error: validationError }

  const product = getProductById(input.productId)!
  const status = input.status ?? "completed"
  const date = input.date || new Date().toISOString()
  const quantity = Math.floor(input.quantity)
  const unitPrice = input.unitPrice
  const total = Number((quantity * unitPrice).toFixed(2))

  if (status === "completed" && product.currentQuantity < quantity) {
    return {
      success: false,
      error: `Only ${product.currentQuantity} ${product.unit} available for ${product.name}.`,
    }
  }

  const newSale: Sale = {
    id: `s${Date.now()}`,
    customer: input.customer.trim(),
    productId: input.productId,
    quantity,
    unitPrice,
    total,
    status,
    date,
  }

  if (status === "completed") {
    const stockError = applyCompletedSaleStock(newSale)
    if (stockError) return { success: false, error: stockError }
  }

  state.sales.unshift(newSale)
  saveState(state)

  return { success: true, sale: newSale }
}

// Complete a pending sale once. Already-completed sales are no-ops for stock.
export function completeSale(saleId: string): SaleMutationResult {
  const sale = state.sales.find((item) => item.id === saleId)
  if (!sale) return { success: false, error: "Sale not found." }

  if (sale.status === "completed") {
    return { success: true, sale }
  }

  const stockError = applyCompletedSaleStock(sale)
  if (stockError) return { success: false, error: stockError }

  sale.status = "completed"
  saveState(state)

  return { success: true, sale }
}

// Create a new purchase and update state
export function createPurchase(purchase: Omit<Purchase, "id" | "date">): Purchase {
  const id = `p${Date.now()}`
  const newPurchase: Purchase = {
    ...purchase,
    id,
    date: new Date().toISOString(),
    status: "pending",
  }

  state.purchases.push(newPurchase)
  saveState(state)

  return newPurchase
}

// Mark a purchase as received and update stock
export function markPurchaseReceived(purchaseId: string): {
  success: boolean
  purchase: Purchase | undefined
} {
  const purchaseIndex = state.purchases.findIndex((p) => p.id === purchaseId)
  if (purchaseIndex === -1) {
    return { success: false, purchase: undefined }
  }

  const purchase = state.purchases[purchaseIndex]

  // Already received - don't add stock again
  if (purchase.status === "received") {
    return { success: false, purchase }
  }

  // Find the product and increase stock
  const receivedAt = new Date().toISOString()
  const product = getProductById(purchase.productId)
  if (product) {
    product.currentQuantity += purchase.quantity
    product.updatedAt = receivedAt
  }

  // Update purchase status
  state.purchases[purchaseIndex].status = "received"

  // Add to recent activity
  const activity: RecentActivity = {
    id: `a${Date.now()}-2`,
    type: "purchase",
    title: "Purchase Received",
    description: `Received ${purchase.quantity}x ${product?.name || "item"} from ${purchase.supplier}`,
    timestamp: receivedAt,
    relatedId: purchaseId,
  }

  state.recentActivity.unshift(activity)
  saveState(state)

  return { success: true, purchase }
}

// Update a sale status with one-time stock effects
export function updateSaleStatus(
  saleId: string,
  status: Sale["status"]
): SaleMutationResult {
  const sale = state.sales.find((item) => item.id === saleId)
  if (!sale) return { success: false, error: "Sale not found." }

  if (sale.status === status) {
    return { success: true, sale }
  }

  if (sale.status === "pending" && status === "completed") {
    return completeSale(saleId)
  }

  if (sale.status === "completed" && status === "pending") {
    restoreCompletedSaleStock(sale)
    sale.status = "pending"
    saveState(state)
    return { success: true, sale }
  }

  sale.status = status
  saveState(state)
  return { success: true, sale }
}

// Update a purchase status
export function updatePurchaseStatus(purchaseId: string, status: Purchase["status"]): Purchase | undefined {
  const purchase = state.purchases.find((p) => p.id === purchaseId)
  if (!purchase) return undefined
  purchase.status = status
  saveState(state)
  return purchase
}