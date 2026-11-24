"use client"

import { formatCurrency, formatDate, getProductById } from "@/lib/store"
import { type Purchase } from "@/types"
import { StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function PurchaseDetailModal({
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
