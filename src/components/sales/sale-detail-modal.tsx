"use client"

import { formatCurrency, formatDate, getProductById } from "@/lib/store"
import { type Sale } from "@/types"
import { StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function SaleDetailModal({
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
