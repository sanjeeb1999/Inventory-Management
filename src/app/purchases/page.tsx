"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  createPurchase,
  formatCurrency,
  formatDate,
  getProductById,
  getSuggestedUnitCost,
  getTotalPurchasesAmount,
  markPurchaseReceived,
  state,
  subscribeToStore,
} from "@/lib/store"
import { type Purchase } from "@/types"
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

type DateFilter = "all" | "month" | "week"

function EmptyBlock({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="dashboard-empty">
      <p className="dashboard-empty-title">{title}</p>
      <p className="dashboard-empty-copy">{description}</p>
      {action ? <div className="dashboard-empty-action">{action}</div> : null}
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="field-error">{message}</p>
}

function PurchaseFormModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [supplier, setSupplier] = useState("")
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [unitCost, setUnitCost] = useState(0)
  const [status, setStatus] = useState<Purchase["status"]>("pending")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const selectedProduct = productId ? getProductById(productId) : undefined
  const total = Number((Math.max(quantity, 0) * Math.max(unitCost, 0)).toFixed(2))

  useEffect(() => {
    if (!open) return
    setSupplier("")
    setProductId("")
    setQuantity(1)
    setUnitCost(0)
    setStatus("pending")
    setErrors({})
    setFormError(null)
    setIsSaving(false)
  }, [open])

  useEffect(() => {
    if (!productId) return
    setUnitCost(getSuggestedUnitCost(productId))
  }, [productId])

  function validate(): boolean {
    const nextErrors: Record<string, string> = {}

    if (!supplier.trim()) nextErrors.supplier = "Supplier is required."
    if (!productId) nextErrors.productId = "Select a product."
    if (!Number.isFinite(quantity) || quantity <= 0) {
      nextErrors.quantity = "Quantity must be greater than zero."
    } else if (!Number.isInteger(quantity)) {
      nextErrors.quantity = "Quantity must be a whole number."
    }
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      nextErrors.unitCost = "Enter a valid unit cost."
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)
    if (!validate()) return

    setIsSaving(true)
    const result = createPurchase({
      supplier,
      productId,
      quantity,
      unitCost,
      status,
    })

    if (!result.success) {
      setFormError(result.error)
      setIsSaving(false)
      return
    }

    setIsSaving(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content sales-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sales-modal-header">
          <div>
            <p className="stock-detail-eyebrow">New purchase</p>
            <h3 className="stock-detail-title">Create purchase order</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {formError ? <div className="form-banner form-banner-error">{formError}</div> : null}

        <form onSubmit={handleSubmit} className="sales-form">
          <div className="form-field">
            <label htmlFor="purchase-supplier">Supplier</label>
            <Input
              id="purchase-supplier"
              value={supplier}
              onChange={(event) => setSupplier(event.target.value)}
              placeholder="Supplier name"
              disabled={isSaving}
            />
            <FieldError message={errors.supplier} />
          </div>

          <div className="form-field">
            <label htmlFor="purchase-product">Product</label>
            <Select
              id="purchase-product"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              disabled={isSaving}
            >
              <option value="">Select product</option>
              {state.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {product.currentQuantity} {product.unit} in stock
                </option>
              ))}
            </Select>
            {selectedProduct ? (
              <p className="field-hint">
                Current stock:{" "}
                <strong>
                  {selectedProduct.currentQuantity} {selectedProduct.unit}
                </strong>
                {" · "}
                Receiving:{" "}
                <strong>
                  {Math.max(quantity, 0)} {selectedProduct.unit}
                </strong>
                {status === "received" ? (
                  <>
                    {" · "}
                    After receive:{" "}
                    <strong>
                      {selectedProduct.currentQuantity + Math.max(quantity, 0)}{" "}
                      {selectedProduct.unit}
                    </strong>
                  </>
                ) : null}
              </p>
            ) : null}
            <FieldError message={errors.productId} />
          </div>

          <div className="sales-form-row">
            <div className="form-field">
              <label htmlFor="purchase-quantity">Quantity</label>
              <Input
                id="purchase-quantity"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                disabled={isSaving}
              />
              <FieldError message={errors.quantity} />
            </div>

            <div className="form-field">
              <label htmlFor="purchase-unit-cost">Unit cost</label>
              <Input
                id="purchase-unit-cost"
                type="number"
                min={0}
                step="0.01"
                value={unitCost}
                onChange={(event) => setUnitCost(Number(event.target.value))}
                disabled={isSaving}
              />
              <FieldError message={errors.unitCost} />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="purchase-status">Status</label>
            <Select
              id="purchase-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as Purchase["status"])
              }
              disabled={isSaving}
            >
              <option value="pending">Pending (does not increase stock)</option>
              <option value="received">Received (increases stock once)</option>
            </Select>
            <p className="field-hint">
              Pending purchases are saved as drafts. Mark as Received to add stock.
            </p>
          </div>

          <div className="sales-total-box">
            <span>Amount</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          <div className="sales-form-actions">
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Saving..."
                : status === "received"
                  ? "Receive purchase"
                  : "Save pending purchase"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PurchaseDetailModal({
  purchase,
  onClose,
  onReceive,
}: {
  purchase: Purchase
  onClose: () => void
  onReceive: (purchaseId: string) => void
}) {
  const product = getProductById(purchase.productId)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content sales-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sales-modal-header">
          <div>
            <p className="stock-detail-eyebrow">Purchase details</p>
            <h3 className="stock-detail-title">{purchase.id}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="stock-detail-grid">
          <div className="stock-detail-stat">
            <p className="kpi-label">Supplier</p>
            <p className="stock-detail-value">{purchase.supplier}</p>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Status</p>
            <div className="mt-2">
              <StatusBadge status={purchase.status} />
            </div>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Product</p>
            <p className="stock-detail-value">
              {product?.name || "Unknown product"}
            </p>
            <p className="dashboard-muted-meta">{product?.sku}</p>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Quantity</p>
            <p className="stock-detail-value">
              {purchase.quantity} {product?.unit || "pcs"}
            </p>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Unit cost</p>
            <p className="stock-detail-value">
              {formatCurrency(purchase.unitCost)}
            </p>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Amount</p>
            <p className="stock-detail-value">
              {formatCurrency(purchase.total)}
            </p>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Date</p>
            <p className="stock-detail-value">{formatDate(purchase.date)}</p>
          </div>
        </div>

        <div className="sales-form-actions">
          {purchase.status === "pending" ? (
            <Button onClick={() => onReceive(purchase.id)}>Mark received</Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function PurchasesPage() {
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
    <div className="sales-page">
      <PageHeader
        title="Purchases"
        description="Receive purchase orders and increase inventory once"
        actions={
          <Button onClick={() => setOpenForm(true)}>New Purchase</Button>
        }
      />

      <section className="stock-summary-grid" aria-label="Purchases summary">
        <div className="kpi-card">
          <p className="kpi-label">Total Purchases</p>
          <p className="kpi-value">{totalPurchases}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Purchase Amount</p>
          <p className="kpi-value text-[var(--accent)]">
            {formatCurrency(totalPurchasesAmount)}
          </p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Received</p>
          <p className="kpi-value text-[var(--success)]">{receivedPurchases}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Pending</p>
          <p className="kpi-value text-[var(--warning)]">{pendingPurchases}</p>
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
                  New Purchase
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
                      <TableCell>{purchase.id}</TableCell>
                      <TableCell>{purchase.supplier}</TableCell>
                      <TableCell>
                        <div className="dashboard-product-cell">
                          <span>{product?.name || "Unknown product"}</span>
                          <span className="dashboard-muted-meta">
                            {product?.sku || purchase.productId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {purchase.quantity} {product?.unit || ""}
                      </TableCell>
                      <TableCell>{formatCurrency(purchase.total)}</TableCell>
                      <TableCell>
                        <StatusBadge status={purchase.status} />
                      </TableCell>
                      <TableCell>{formatDate(purchase.date)}</TableCell>
                      <TableCell>
                        <div className="sales-row-actions">
                          <Button
                            variant="secondary"
                            size="sm"
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
