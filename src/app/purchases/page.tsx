"use client"

import { useState, useEffect } from "react"
import {
  formatCurrency,
  formatDate,
  createPurchase,
  getTotalPurchasesAmount,
  state,
} from "@/lib/store"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

// --- Purchase Form Modal ---
function PurchaseFormModal({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (open: boolean) => void
}) {
  const [supplier, setSupplier] = useState("")
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [unitCost, setUnitCost] = useState(0)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Calculate total when product/unit cost changes
  useEffect(() => {
    const product = state.products.find((p) => p.id === productId)
    if (product && unitCost > 0) {
      setTotal(quantity * unitCost)
    }
  }, [productId, quantity, unitCost])

  // Update unit cost when product changes
  useEffect(() => {
    const product = state.products.find((p) => p.id === productId)
    if (product) {
      setUnitCost(15) // Default cost
    }
  }, [productId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplier || !productId || quantity <= 0) {
      setError("Please fill in all required fields")
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const purchase = createPurchase({
        supplier,
        productId,
        quantity,
        unitCost,
        total,
        status: "pending",
      })

      setSuccess(true)
      setOpen(false)

      // Reset form
      setSupplier("")
      setProductId("")
      setQuantity(1)
      setUnitCost(0)
      setTotal(0)
    } catch (err) {
      setError("Failed to create purchase. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!open) return null

  return (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-[var(--fg)] mb-4">
              Create Purchase
            </h3>
            {error && (
              <div className="bg-[var(--danger)]/10 border border-[var(--danger)] rounded p-3 mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-[var(--success)]/10 border border-[var(--success)] rounded p-3 mb-4">
                Purchase created successfully!
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">
                  Supplier
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Supplier name"
                  disabled={isSaving}
                  className="w-full filter-input"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">
                  Product
                </label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  disabled={isSaving}
                  className="w-full filter-input"
                >
                  <option value="">-- Select Product --</option>
                  {state.products.map((product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name} - {product.currentQuantity} {product.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    disabled={isSaving}
                    className="w-24 filter-input"
                  />
                  <select
                    disabled={isSaving}
                    className="filter-input"
                  >
                    <option value="pcs">pcs</option>
                    <option value="packs">packs</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">
                  Unit Cost
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  disabled={isSaving}
                  className="w-full filter-input"
                  placeholder="Enter cost"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">
                  Total
                </label>
                <p className="text-lg font-bold text-[var(--accent)]">
                  {total.toLocaleString()} USD
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`btn btn-primary ${isSaving ? 'opacity-50' : ''}`}
                >
                  {isSaving ? "Creating..." : "Create Purchase"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
  )
}

// --- Purchase Page ---
export default function PurchasesPage() {
  const [open, setOpen] = useState(false)
  const [productFilter, setProductFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  // Computed filtered purchases
  const filteredPurchases = state.purchases.filter((purchase) => {
    const matchesSearch =
      purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesProduct =
      !productFilter ||
      state.products.find((p) => p.id === productFilter)?.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

    const matchesStatus =
      !statusFilter || purchase.status === statusFilter

    return matchesSearch && matchesProduct && matchesStatus
  })

  // Compute stats
  const totalPurchases = state.purchases.length
  const receivedPurchases = state.purchases.filter(
    (p) => p.status === "received"
  ).length
  const pendingPurchases = state.purchases.filter(
    (p) => p.status === "pending"
  ).length
  const totalPurchasesAmount = getTotalPurchasesAmount()

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Manage purchase orders"
        actions={
          <Button onClick={() => setOpen(true)}>Create Purchase</Button>
        }
      />

      <div className="content-grid cols-4 mb-6">
        <div className="kpi-card">
          <p className="kpi-label">Total Purchases</p>
          <p className="kpi-value">{totalPurchases}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Received</p>
          <p className="kpi-value text-[var(--success)]">{receivedPurchases}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Pending</p>
          <p className="kpi-value text-[var(--warning)]">{pendingPurchases}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Amount</p>
          <p className="kpi-value text-[var(--accent)]">
            {formatCurrency(totalPurchasesAmount)}
          </p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="filter-bar">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by supplier, order ID, or product..."
            className="filter-input"
          />
          <Select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="filter-input"
          >
            <option value="">Filter by Product</option>
            {state.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-input"
          >
            <option value="">Filter by Status</option>
            <option value="pending">Pending</option>
            <option value="received">Received</option>
          </Select>
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
            {filteredPurchases.length === 0 ? (
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
              filteredPurchases.map((purchase) => {
                const product = state.products.find((p) => p.id === purchase.productId)
                return (
                  <tr key={purchase.id}>
                    <td className="font-medium">
                      {purchase.id}
                    </td>
                    <td>
                      {purchase.supplier}
                    </td>
                    <td>
                      {product?.name || "Unknown"}
                    </td>
                    <td>{purchase.quantity} {product?.unit || ""}</td>
                    <td>
                      {formatCurrency(purchase.total)}
                    </td>
                    <td>
                      <StatusBadge status={purchase.status} />
                    </td>
                    <td>
                      {formatDate(purchase.date)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title mb-2">Purchase Actions</h2>
        <p className="text-sm text-[var(--muted)]">
          Pending purchases do NOT increase stock automatically.
          Mark as Received to increase stock and update dashboard.
        </p>
      </div>

      <PurchaseFormModal
        open={open}
        setOpen={setOpen}
      />
    </div>
  )
}