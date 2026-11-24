"use client"

import { useState } from "react"
import {
  formatCurrency,
  formatDate,
  getDashboardKPIs,
  getStockStatusClass,
  getTotalSalesAmount,
  getTotalPurchasesAmount,
  state,
} from "@/lib/store"
import { type DashboardKPIs } from "@/types"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"

// --- Reports Page ---
export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("all") // all, month, week, year
  const [exportLoading, setExportLoading] = useState(false)

  // Compute KPIs from shared state
  const kpis: DashboardKPIs = getDashboardKPIs()
  const totalSalesAmount = getTotalSalesAmount()
  const totalPurchasesAmount = getTotalPurchasesAmount()

  // Sales by status
  const salesByStatus = {
    completed: state.sales.filter((s) => s.status === "completed").length,
    pending: state.sales.filter((s) => s.status === "pending").length,
  }

  // Purchases by status
  const purchasesByStatus = {
    received: state.purchases.filter((p) => p.status === "received").length,
    pending: state.purchases.filter((p) => p.status === "pending").length,
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Business reports and summaries"
        actions={
          <>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="filter-input"
              aria-label="Time range"
            >
              <option value="all">All time</option>
              <option value="week">This week</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
            </Select>
            <Button
              variant="secondary"
              disabled={exportLoading}
              onClick={() => {
                setExportLoading(true)
                window.setTimeout(() => setExportLoading(false), 600)
              }}
            >
              {exportLoading ? "Preparing..." : "Export"}
            </Button>
          </>
        }
      />

      <div className="content-grid cols-4 mb-6">
        <div className="kpi-card">
          <p className="kpi-label">Total Products</p>
          <p className="kpi-value">{kpis.totalProducts}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Total Stock Qty</p>
          <p className="kpi-value text-[var(--success)]">
            {kpis.totalStockQuantity.toLocaleString()}
          </p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Total Sales</p>
          <p className="kpi-value text-[var(--accent)]">
            {formatCurrency(getTotalSalesAmount())}
          </p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Total Purchases</p>
          <p className="kpi-value text-[var(--accent)]">
            {formatCurrency(getTotalPurchasesAmount())}
          </p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="card-title mb-1">Sales Report</h2>
        <p className="card-description mb-4">Sales performance summary</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Total Sales</p>
            <p className="text-lg font-bold text-[var(--fg)]">
              {state.sales.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Completed</p>
            <p className="text-lg font-bold text-[var(--success)]">
              {salesByStatus.completed}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Pending</p>
            <p className="text-lg font-bold text-[var(--warning)]">
              {salesByStatus.pending}
            </p>
          </div>
        </div>

        <div className="card p-4 mb-4">
          <p className="text-sm text-[var(--muted)]">
            Total Sales Amount: {formatCurrency(totalSalesAmount)}
          </p>
        </div>

        <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {state.sales.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h11l5 5z" />
                    <circle cx="3" cy="18" r="2" />
                    <circle cx="21" cy="18" r="2" />
                  </svg>
                  <p className="mt-2 text-[var(--muted)]">No sales found</p>
                </td>
              </tr>
            ) : (
              state.sales.slice(0, 5).map((sale) => {
                const product = state.products.find((p) => p.id === sale.productId)
                return (
                  <tr key={sale.id}>
                    <td>{sale.id}</td>
                    <td>{sale.customer}</td>
                    <td>{product?.name || "Unknown"}</td>
                    <td>{sale.quantity} {product?.unit || ""}</td>
                    <td>{formatCurrency(sale.total)}</td>
                    <td>{formatDate(sale.date)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="card-title mb-1">Purchase Report</h2>
        <p className="card-description mb-4">Purchase order summary</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Total Purchases</p>
            <p className="text-lg font-bold text-[var(--fg)]">
              {state.purchases.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Received</p>
            <p className="text-lg font-bold text-[var(--success)]">
              {purchasesByStatus.received}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--muted)] uppercase tracking-wider">Pending</p>
            <p className="text-lg font-bold text-[var(--warning)]">
              {purchasesByStatus.pending}
            </p>
          </div>
        </div>

        <div className="card p-4 mb-4">
          <p className="text-sm text-[var(--muted)]">
            Total Purchases Amount: {formatCurrency(totalPurchasesAmount)}
          </p>
        </div>

        <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Purchase ID</th>
              <th>Supplier</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {state.purchases.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h11l5 5z" />
                    <circle cx="3" cy="18" r="2" />
                    <circle cx="21" cy="18" r="2" />
                  </svg>
                  <p className="mt-2 text-[var(--muted)]">No purchases found</p>
                </td>
              </tr>
            ) : (
              state.purchases.slice(0, 5).map((purchase) => {
                const product = state.products.find((p) => p.id === purchase.productId)
                return (
                  <tr key={purchase.id}>
                    <td>{purchase.id}</td>
                    <td>{purchase.supplier}</td>
                    <td>{product?.name || "Unknown"}</td>
                    <td>{purchase.quantity} {product?.unit || ""}</td>
                    <td>{formatCurrency(purchase.total)}</td>
                    <td>
                      <StatusBadge status={purchase.status} />
                    </td>
                    <td>{formatDate(purchase.date)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title mb-1">Stock Report</h2>
        <p className="card-description mb-4">
          Current inventory levels and stock status
        </p>

        <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Minimum Level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {state.products.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h11l5 5z" />
                    <circle cx="3" cy="18" r="2" />
                    <circle cx="21" cy="18" r="2" />
                  </svg>
                  <p className="mt-2 text-[var(--muted)]">No products found</p>
                </td>
              </tr>
            ) : (
              state.products.map((product) => {
                const status = getStockStatusClass(product.currentQuantity, product.minStockLevel)
                return (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.category}</td>
                    <td>{product.currentQuantity} {product.unit}</td>
                    <td>{product.minStockLevel}</td>
                    <td>
                      <StatusBadge status={status} />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}