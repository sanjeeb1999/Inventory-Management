"use client"

import { useEffect, useState } from "react"
import {
  createPurchase,
  formatCurrency,
  getProductById,
  getSuggestedUnitCost,
  state,
} from "@/lib/store"
import { type Purchase } from "@/types"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field-error"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

export function PurchaseFormModal({
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
