"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  completeSale,
  createSale,
  formatCurrency,
  formatDate,
  getProductById,
  getSuggestedUnitPrice,
  getTotalSalesAmount,
  state,
  subscribeToStore,
} from "@/lib/store"
import { type Sale } from "@/types"
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

function SaleFormModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [customer, setCustomer] = useState("")
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)
  const [status, setStatus] = useState<Sale["status"]>("completed")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const selectedProduct = productId ? getProductById(productId) : undefined
  const total = Number((Math.max(quantity, 0) * Math.max(unitPrice, 0)).toFixed(2))

  useEffect(() => {
    if (!open) return
    setCustomer("")
    setProductId("")
    setQuantity(1)
    setUnitPrice(0)
    setStatus("completed")
    setErrors({})
    setFormError(null)
    setIsSaving(false)
  }, [open])

  useEffect(() => {
    if (!productId) return
    setUnitPrice(getSuggestedUnitPrice(productId))
  }, [productId])

  function validate(): boolean {
    const nextErrors: Record<string, string> = {}

    if (!customer.trim()) nextErrors.customer = "Customer is required."
    if (!productId) nextErrors.productId = "Select a product."
    if (!Number.isFinite(quantity) || quantity <= 0) {
      nextErrors.quantity = "Quantity must be greater than zero."
    } else if (!Number.isInteger(quantity)) {
      nextErrors.quantity = "Quantity must be a whole number."
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      nextErrors.unitPrice = "Enter a valid unit price."
    }

    if (
      selectedProduct &&
      status === "completed" &&
      quantity > selectedProduct.currentQuantity
    ) {
      nextErrors.quantity = `Only ${selectedProduct.currentQuantity} ${selectedProduct.unit} available.`
    }

    if (selectedProduct && selectedProduct.currentQuantity <= 0 && status === "completed") {
      nextErrors.productId = `${selectedProduct.name} is out of stock.`
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)
    if (!validate()) return

    setIsSaving(true)
    const result = createSale({
      customer,
      productId,
      quantity,
      unitPrice,
      status,
    })

    if (!result.success) {
      setFormError(result.error)
      if (result.error.toLowerCase().includes("available")) {
        setErrors((current) => ({ ...current, quantity: result.error }))
      }
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
            <p className="stock-detail-eyebrow">New sale</p>
            <h3 className="stock-detail-title">Create sales order</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {formError ? <div className="form-banner form-banner-error">{formError}</div> : null}

        <form onSubmit={handleSubmit} className="sales-form">
          <div className="form-field">
            <label htmlFor="sale-customer">Customer</label>
            <Input
              id="sale-customer"
              value={customer}
              onChange={(event) => setCustomer(event.target.value)}
              placeholder="Customer name or company"
              disabled={isSaving}
            />
            <FieldError message={errors.customer} />
          </div>

          <div className="form-field">
            <label htmlFor="sale-product">Product</label>
            <Select
              id="sale-product"
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
                Available stock:{" "}
                <strong>
                  {selectedProduct.currentQuantity} {selectedProduct.unit}
                </strong>
                {" · "}
                Min level: {selectedProduct.minStockLevel} {selectedProduct.unit}
              </p>
            ) : null}
            <FieldError message={errors.productId} />
          </div>

          <div className="sales-form-row">
            <div className="form-field">
              <label htmlFor="sale-quantity">Quantity</label>
              <Input
                id="sale-quantity"
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
              <label htmlFor="sale-unit-price">Unit price</label>
              <Input
                id="sale-unit-price"
                type="number"
                min={0}
                step="0.01"
                value={unitPrice}
                onChange={(event) => setUnitPrice(Number(event.target.value))}
                disabled={isSaving}
              />
              <FieldError message={errors.unitPrice} />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="sale-status">Status</label>
            <Select
              id="sale-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as Sale["status"])}
              disabled={isSaving}
            >
              <option value="completed">Completed (reduces stock)</option>
              <option value="pending">Pending (does not reduce stock)</option>
            </Select>
            <p className="field-hint">
              Pending sales are saved as drafts and leave inventory unchanged.
            </p>
          </div>

          <div className="sales-total-box">
            <span>Amount</span>
            <strong>{formatCurrency(total)}</strong>
          </div>

          <div className="sales-form-actions">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : status === "completed" ? "Complete sale" : "Save pending sale"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SaleDetailModal({
  sale,
  onClose,
  onComplete,
}: {
  sale: Sale
  onClose: () => void
  onComplete: (saleId: string) => void
}) {
  const product = getProductById(sale.productId)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content sales-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sales-modal-header">
          <div>
            <p className="stock-detail-eyebrow">Sale details</p>
            <h3 className="stock-detail-title">{sale.id}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="stock-detail-grid">
          <div className="stock-detail-stat">
            <p className="kpi-label">Customer</p>
            <p className="stock-detail-value">{sale.customer}</p>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Status</p>
            <div className="mt-2">
              <StatusBadge status={sale.status} />
            </div>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Product</p>
            <p className="stock-detail-value">{product?.name || "Unknown product"}</p>
            <p className="dashboard-muted-meta">{product?.sku}</p>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Quantity</p>
            <p className="stock-detail-value">
              {sale.quantity} {product?.unit || "pcs"}
            </p>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Unit price</p>
            <p className="stock-detail-value">{formatCurrency(sale.unitPrice)}</p>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Amount</p>
            <p className="stock-detail-value">{formatCurrency(sale.total)}</p>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Date</p>
            <p className="stock-detail-value">{formatDate(sale.date)}</p>
          </div>
        </div>

        <div className="sales-form-actions">
          {sale.status === "pending" ? (
            <Button onClick={() => onComplete(sale.id)}>Mark completed</Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SalesPage() {
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
    <div className="sales-page">
      <PageHeader
        title="Sales"
        description="Create sales orders and reduce inventory when completed"
        actions={
          <Button onClick={() => setOpenForm(true)}>New Sale</Button>
        }
      />

      <section className="stock-summary-grid" aria-label="Sales summary">
        <div className="kpi-card">
          <p className="kpi-label">Total Sales</p>
          <p className="kpi-value">{totalSales}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Sales Amount</p>
          <p className="kpi-value text-[var(--accent)]">
            {formatCurrency(totalSalesAmount)}
          </p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Completed</p>
          <p className="kpi-value text-[var(--success)]">{completedSales}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Pending</p>
          <p className="kpi-value text-[var(--warning)]">{pendingSales}</p>
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
                  New Sale
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
                      <TableCell>{sale.id}</TableCell>
                      <TableCell>{sale.customer}</TableCell>
                      <TableCell>
                        <div className="dashboard-product-cell">
                          <span>{product?.name || "Unknown product"}</span>
                          <span className="dashboard-muted-meta">
                            {product?.sku || sale.productId}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {sale.quantity} {product?.unit || ""}
                      </TableCell>
                      <TableCell>{formatCurrency(sale.total)}</TableCell>
                      <TableCell>
                        <StatusBadge status={sale.status} />
                      </TableCell>
                      <TableCell>{formatDate(sale.date)}</TableCell>
                      <TableCell>
                        <div className="sales-row-actions">
                          <Button
                            variant="secondary"
                            size="sm"
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
