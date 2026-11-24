"use client"

import { useEffect, useState } from "react"
import {
  createSale,
  formatCurrency,
  getProductById,
  getSuggestedUnitPrice,
  state,
} from "@/lib/store"
import { type Sale } from "@/types"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field-error"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

export function SaleFormModal({
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
