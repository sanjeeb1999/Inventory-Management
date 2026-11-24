"use client"

import { useEffect, useState } from "react"
import {
  formatCurrency,
  formatDate,
  getProductById,
  getTotalPurchasesAmount,
  markPurchaseReceived,
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
import { PurchaseDetailModal } from "@/components/purchases/purchase-detail-modal"
import { PurchaseFormModal } from "@/components/purchases/purchase-form-modal"

type DateFilter = "all" | "month" | "week"

export function PurchasesScreen() {
  const [, setRevision] = useState(0)
  const [openForm, setOpenForm] = useState(false)
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null)
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
  const filteredPurchases = state.purchases.filter((purchase) => {
    const product = getProductById(purchase.productId)
    const matchesSearch =
      !query ||
      purchase.id.toLowerCase().includes(query) ||
      purchase.supplier.toLowerCase().includes(query) ||
      (product?.name || "").toLowerCase().includes(query) ||
      (product?.sku || "").toLowerCase().includes(query)

    const matchesStatus = !statusFilter || purchase.status === statusFilter

    const purchaseDay = purchase.date.slice(0, 10)
    const purchaseMonth = purchase.date.slice(0, 7)
    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "month" && (!monthKey || purchaseMonth === monthKey)) ||
      (dateFilter === "week" && (!weekStartKey || purchaseDay >= weekStartKey))

    return matchesSearch && matchesStatus && matchesDate
  })

  const totalPurchases = state.purchases.length
  const receivedPurchases = state.purchases.filter(
    (purchase) => purchase.status === "received"
  ).length
  const pendingPurchases = state.purchases.filter(
    (purchase) => purchase.status === "pending"
  ).length
  const totalPurchasesAmount = getTotalPurchasesAmount()
  const selectedPurchase = selectedPurchaseId
    ? state.purchases.find((purchase) => purchase.id === selectedPurchaseId) ||
      null
    : null

  function handleReceivePurchase(purchaseId: string) {
    setActionError(null)
    const result = markPurchaseReceived(purchaseId)
    if (!result.success) {
      setActionError(result.error)
      return
    }
    setSelectedPurchaseId(null)
  }

  return (
    <div className="module-page sales-page">
      <PageHeader
        title="Purchases"
        description="Receive purchase orders and increase inventory once"
        actions={
          <Button onClick={() => setOpenForm(true)}>+ New purchase</Button>
        }
      />

      <section className="stock-summary-grid cols-4" aria-label="Purchases summary">
        <div className="kpi-card">
          <p className="kpi-label">Total purchases</p>
          <p className="kpi-value">{totalPurchases}</p>
          <p className="kpi-subtitle">All orders</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Purchase amount</p>
          <p className="kpi-value">{formatCurrency(totalPurchasesAmount)}</p>
          <p className="kpi-subtitle">Recorded value</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Received</p>
          <p className="kpi-value metric-good">{receivedPurchases}</p>
          <p className="kpi-subtitle">Stock already increased</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Pending</p>
          <p className="kpi-value metric-warn">{pendingPurchases}</p>
          <p className="kpi-subtitle">Waiting to receive</p>
        </div>
      </section>

      <Card>
        <CardHeader className="dashboard-card-header">
          <div>
            <CardTitle>Purchase orders</CardTitle>
            <CardDescription>
              Search and receive purchases connected to live stock
            </CardDescription>
          </div>
          <Badge tone="neutral">{filteredPurchases.length} shown</Badge>
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
              placeholder="Search purchase ID, supplier, or product..."
              className="filter-input stock-search-input"
              aria-label="Search purchases"
            />
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="filter-input"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="received">Received</option>
            </Select>
            <Select
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value as DateFilter)
              }
              className="filter-input"
              aria-label="Filter by date"
            >
              <option value="all">All dates</option>
              <option value="week">Last 7 days</option>
              <option value="month">This month</option>
            </Select>
          </div>

          {state.purchases.length === 0 ? (
            <EmptyBlock
              title="No purchases yet"
              description="Create a pending purchase, then mark it Received to increase stock."
              action={
                <Button size="sm" onClick={() => setOpenForm(true)}>
                  + New purchase
                </Button>
              }
            />
          ) : filteredPurchases.length === 0 ? (
            <EmptyBlock
              title="No matching purchases"
              description="Try a different search term or clear the status/date filters."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purchase ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => {
                  const product = getProductById(purchase.productId)
                  return (
                    <TableRow key={purchase.id}>
                      <TableCell className="cell-id">{purchase.id}</TableCell>
                      <TableCell>
                        <span className="data-title">{purchase.supplier}</span>
                      </TableCell>
                      <TableCell>
                        <div className="data-stack">
                          <span className="data-title">{product?.name || "Unknown product"}</span>
                          <span className="data-meta">{product?.sku || purchase.productId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="qty-figure">
                          <strong>{purchase.quantity}</strong>
                          <span>{product?.unit || "pcs"}</span>
                        </span>
                      </TableCell>
                      <TableCell className="cell-money">{formatCurrency(purchase.total)}</TableCell>
                      <TableCell>
                        <StatusBadge status={purchase.status} />
                      </TableCell>
                      <TableCell className="data-meta">{formatDate(purchase.date)}</TableCell>
                      <TableCell>
                        <div className="sales-row-actions">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="link-action"
                            onClick={() => {
                              setActionError(null)
                              setSelectedPurchaseId(purchase.id)
                            }}
                          >
                            Details
                          </Button>
                          {purchase.status === "pending" ? (
                            <Button
                              size="sm"
                              onClick={() => handleReceivePurchase(purchase.id)}
                            >
                              Receive
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

      <PurchaseFormModal open={openForm} onClose={() => setOpenForm(false)} />

      {selectedPurchase ? (
        <PurchaseDetailModal
          purchase={selectedPurchase}
          onClose={() => setSelectedPurchaseId(null)}
          onReceive={handleReceivePurchase}
        />
      ) : null}
    </div>
  )
}
