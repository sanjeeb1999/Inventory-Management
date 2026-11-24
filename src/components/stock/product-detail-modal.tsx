"use client"

import {
  formatDate,
  getStockStatusClass,
  type StockHistoryEntry,
} from "@/lib/store"
import { type Product } from "@/types"
import { StatusBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyBlock } from "@/components/ui/empty-block"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatQuantityChange } from "@/components/stock/format-quantity"

export function ProductDetailModal({
  product,
  history,
  onClose,
}: {
  product: Product
  history: StockHistoryEntry[]
  onClose: () => void
}) {
  const status = getStockStatusClass(product.currentQuantity, product.minStockLevel)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content stock-detail-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="stock-detail-header">
          <div>
            <p className="stock-detail-eyebrow">Product details</p>
            <h3 className="stock-detail-title">{product.name}</h3>
            <p className="dashboard-muted-meta">
              {product.sku} · {product.category}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="stock-detail-grid">
          <div className="stock-detail-stat">
            <p className="kpi-label">Current quantity</p>
            <p className="kpi-value">
              {product.currentQuantity}{" "}
              <span className="stock-unit">{product.unit}</span>
            </p>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Minimum level</p>
            <p className="kpi-value">
              {product.minStockLevel}{" "}
              <span className="stock-unit">{product.unit}</span>
            </p>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Status</p>
            <div className="mt-2">
              <StatusBadge status={status} />
            </div>
          </div>
          <div className="stock-detail-stat">
            <p className="kpi-label">Last updated</p>
            <p className="stock-detail-value">{formatDate(product.updatedAt)}</p>
          </div>
        </div>

        <div className="stock-detail-history">
          <h4 className="card-title">Recent stock history</h4>
          <p className="card-description mb-3">
            Movements for this product from shared inventory activity
          </p>

          {history.length === 0 ? (
            <EmptyBlock
              title="No history for this product"
              description="Sales and received purchases linked to this item will appear here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Qty change</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.slice(0, 8).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.timestamp)}</TableCell>
                    <TableCell>{entry.action}</TableCell>
                    <TableCell>
                      <span
                        className={
                          entry.quantityChange >= 0
                            ? "text-[var(--success)]"
                            : "text-[var(--danger)]"
                        }
                      >
                        {formatQuantityChange(entry.quantityChange)} {product.unit}
                      </span>
                    </TableCell>
                    <TableCell>{entry.reference || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  )
}
