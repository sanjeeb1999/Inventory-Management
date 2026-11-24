"use client"

import { useEffect, useState } from "react"
import {
  completeSale,
  formatCurrency,
  formatDate,
  getProductById,
  getTotalSalesAmount,
  state,
  subscribeToStore,
} from "@/lib/store"
import { PageHeader } from "@/components/layout/page-header"
import { Badge, StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmptyBlock } from "@/components/ui/empty-block"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SaleDetailModal } from "@/components/sales/sale-detail-modal"
import { SaleFormModal } from "@/components/sales/sale-form-modal"

type DateFilter = "all" | "month" | "week"

export function SalesScreen() {
  const [, setRevision] = useState(0)
  const [openForm, setOpenForm] = useState(false)
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [actionError, setActionError] = useState<string | null>(null)
  const [monthKey, setMonthKey] = useState("")
  const [weekStartKey, setWeekStartKey] = useState("")

  useEffect(() => {
    return subscribeToStore(() => setRevision((value) => value + 1))
  }, [])

  useEffect(() => {
    const now = new Date()
    setMonthKey(now.toISOString().slice(0, 7))
    const weekStart = new Date(now)
    weekStart.setUTCDate(now.getUTCDate() - 6)
    setWeekStartKey(weekStart.toISOString().slice(0, 10))
  }, [])

  const query = searchTerm.trim().toLowerCase()
  const filteredSales = state.sales.filter((sale) => {
    const product = getProductById(sale.productId)
    const matchesSearch =
      !query ||
      sale.id.toLowerCase().includes(query) ||
      sale.customer.toLowerCase().includes(query) ||
      (product?.name || "").toLowerCase().includes(query) ||
      (product?.sku || "").toLowerCase().includes(query)

    const matchesStatus = !statusFilter || sale.status === statusFilter

    const saleDay = sale.date.slice(0, 10)
    const saleMonth = sale.date.slice(0, 7)
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "month" && (!monthKey || saleMonth === monthKey)) ||
      (dateFilter === "week" && (!weekStartKey || saleDay >= weekStartKey))

    return matchesSearch && matchesStatus && matchesDate
  })

  const totalSales = state.sales.length
  const completedSales = state.sales.filter((sale) => sale.status === "completed").length
  const pendingSales = state.sales.filter((sale) => sale.status === "pending").length
  const totalSalesAmount = getTotalSalesAmount()
  const selectedSale = selectedSaleId
    ? state.sales.find((sale) => sale.id === selectedSaleId) || null
    : null

  function handleCompleteSale(saleId: string) {
    setActionError(null)
    const result = completeSale(saleId)
    if (!result.success) {
      setActionError(result.error)
      return
    }
    setSelectedSaleId(null)
  }

  return (
    <div className="module-page sales-page">
      <PageHeader
        title="Sales"
        description="Create sales orders and reduce inventory when completed"
        actions={
          <Button onClick={() => setOpenForm(true)}>+ New sale</Button>
        }
      />

      <section className="stock-summary-grid cols-4" aria-label="Sales summary">
        <div className="kpi-card">
          <p className="kpi-label">Total sales</p>
          <p className="kpi-value">{totalSales}</p>
          <p className="kpi-subtitle">All orders</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Sales amount</p>
          <p className="kpi-value">{formatCurrency(totalSalesAmount)}</p>
          <p className="kpi-subtitle">Recorded value</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Completed</p>
          <p className="kpi-value metric-good">{completedSales}</p>
          <p className="kpi-subtitle">Stock already reduced</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Pending</p>
          <p className="kpi-value metric-warn">{pendingSales}</p>
          <p className="kpi-subtitle">Waiting to complete</p>
        </div>
      </section>

      <Card>
        <CardHeader className="dashboard-card-header">
          <div>
            <CardTitle>Sales orders</CardTitle>
            <CardDescription>
              Search and review sales connected to live stock
            </CardDescription>
          </div>
          <Badge tone="neutral">{filteredSales.length} shown</Badge>
        </CardHeader>
        <CardContent>
          {actionError ? (
            <div className="form-banner form-banner-error mb-4">{actionError}</div>
          ) : null}

          <div className="filter-bar stock-filter-bar">
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search invoice, customer, or product..."
              className="filter-input stock-search-input"
              aria-label="Search sales"
            />
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="filter-input"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </Select>
            <Select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value as DateFilter)}
              className="filter-input"
              aria-label="Filter by date"
            >
              <option value="all">All dates</option>
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
            </Select>
          </div>

          {state.sales.length === 0 ? (
            <EmptyBlock
              title="No sales yet"
              description="Create a completed sale to reduce stock and update dashboard activity."
              action={
                <Button size="sm" onClick={() => setOpenForm(true)}>
                  + New sale
                </Button>
              }
            />
          ) : filteredSales.length === 0 ? (
            <EmptyBlock
              title="No matching sales"
              description="Try a different search term or clear the status/date filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => {
                  const product = getProductById(sale.productId)
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="cell-id">{sale.id}</TableCell>
                      <TableCell>
                        <span className="data-title">{sale.customer}</span>
                      </TableCell>
                      <TableCell>
                        <div className="data-stack">
                          <span className="data-title">{product?.name || "Unknown product"}</span>
                          <span className="data-meta">{product?.sku || sale.productId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="qty-figure">
                          <strong>{sale.quantity}</strong>
                          <span>{product?.unit || "pcs"}</span>
                        </span>
                      </TableCell>
                      <TableCell className="cell-money">{formatCurrency(sale.total)}</TableCell>
                      <TableCell>
                        <StatusBadge status={sale.status} />
                      </TableCell>
                      <TableCell className="data-meta">{formatDate(sale.date)}</TableCell>
                      <TableCell>
                        <div className="sales-row-actions">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="link-action"
                            onClick={() => {
                              setActionError(null)
                              setSelectedSaleId(sale.id)
                            }}
                          >
                            Details
                          </Button>
                          {sale.status === "pending" ? (
                            <Button
                              size="sm"
                              onClick={() => handleCompleteSale(sale.id)}
                            >
                              Complete
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <SaleFormModal open={openForm} onClose={() => setOpenForm(false)} />

      {selectedSale ? (
        <SaleDetailModal
          sale={selectedSale}
          onClose={() => setSelectedSaleId(null)}
          onComplete={handleCompleteSale}
        />
      ) : null}
    </div>
  )
}
