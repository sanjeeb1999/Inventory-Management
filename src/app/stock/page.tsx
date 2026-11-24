"use client"

import { useEffect, useState } from "react"
import {
  formatDate,
  getProductCategories,
  getStockHistory,
  getStockStatusClass,
  getStockSummary,
  state,
  subscribeToStore,
  type StockHistoryEntry,
} from "@/lib/store"
import { type Product } from "@/types"
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

type SortOption = "name-asc" | "qty-desc" | "qty-asc" | "updated-desc" | "updated-asc"

function formatQuantityChange(change: number): string {
  if (change > 0) return `+${change}`
  return `${change}`
}

function EmptyBlock({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="dashboard-empty">
      <p className="dashboard-empty-title">{title}</p>
      <p className="dashboard-empty-copy">{description}</p>
    </div>
  )
}

function ProductDetailModal({
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

export default function StockPage() {
  const [, setRevision] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [sortOption, setSortOption] = useState<SortOption>("name-asc")
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  useEffect(() => {
    return subscribeToStore(() => setRevision((value) => value + 1))
  }, [])

  const summary = getStockSummary()
  const categories = getProductCategories()
  const history = getStockHistory()

  const query = searchTerm.trim().toLowerCase()
  const filteredProducts = state.products
    .filter((product) => {
      const status = getStockStatusClass(
        product.currentQuantity,
        product.minStockLevel
      )

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query)

      const matchesCategory = !categoryFilter || product.category === categoryFilter
      const matchesStatus = !statusFilter || status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "qty-desc":
          return b.currentQuantity - a.currentQuantity
        case "qty-asc":
          return a.currentQuantity - b.currentQuantity
        case "updated-desc":
          return b.updatedAt.localeCompare(a.updatedAt)
        case "updated-asc":
          return a.updatedAt.localeCompare(b.updatedAt)
        case "name-asc":
        default:
          return a.name.localeCompare(b.name)
      }
    })

  const selectedProduct = selectedProductId
    ? state.products.find((product) => product.id === selectedProductId) || null
    : null

  const selectedHistory = selectedProduct
    ? getStockHistory(selectedProduct.id)
    : []

  const hasProducts = state.products.length > 0
  const hasFilters = Boolean(searchTerm || categoryFilter || statusFilter)

  return (
    <div className="stock-page">
      <PageHeader
        title="Stock"
        description="Source of truth for inventory quantity and stock status"
      />

      <section className="stock-summary-grid" aria-label="Stock summary">
        <div className="kpi-card">
          <p className="kpi-label">Total Products</p>
          <p className="kpi-value">{summary.totalProducts}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Total Quantity</p>
          <p className="kpi-value">{summary.totalQuantity.toLocaleString()}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">In Stock</p>
          <p className="kpi-value text-[var(--success)]">{summary.inStock}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Low Stock</p>
          <p className="kpi-value text-[var(--warning)]">{summary.lowStock}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Out of Stock</p>
          <p className="kpi-value text-[var(--danger)]">{summary.outOfStock}</p>
        </div>
      </section>

      <Card>
        <CardHeader className="dashboard-card-header">
          <div>
            <CardTitle>Inventory</CardTitle>
            <CardDescription>
              Search, filter, and inspect live stock from the shared store
            </CardDescription>
          </div>
          <Badge tone="neutral">
            {filteredProducts.length} shown
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="filter-bar stock-filter-bar">
            <Input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search name, SKU, or category..."
              className="filter-input stock-search-input"
              aria-label="Search stock"
            />
            <Select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="filter-input"
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="filter-input"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </Select>
            <Select
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as SortOption)}
              className="filter-input"
              aria-label="Sort products"
            >
              <option value="name-asc">Sort: Name</option>
              <option value="qty-desc">Sort: Quantity high to low</option>
              <option value="qty-asc">Sort: Quantity low to high</option>
              <option value="updated-desc">Sort: Last updated newest</option>
              <option value="updated-asc">Sort: Last updated oldest</option>
            </Select>
          </div>

          {!hasProducts ? (
            <EmptyBlock
              title="No products in inventory"
              description="Add products through purchasing or catalog setup to start tracking stock."
            />
          ) : filteredProducts.length === 0 ? (
            <EmptyBlock
              title="No matching products"
              description={
                hasFilters
                  ? "Try adjusting search or filters to see more inventory items."
                  : "No products are available to display."
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Qty</TableHead>
                  <TableHead>Minimum</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const status = getStockStatusClass(
                    product.currentQuantity,
                    product.minStockLevel
                  )

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="dashboard-product-cell">
                          <span>{product.name}</span>
                          <span className="dashboard-muted-meta">{product.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <span className="font-semibold text-[var(--fg)]">
                          {product.currentQuantity}
                        </span>
                      </TableCell>
                      <TableCell>{product.minStockLevel}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>
                        <StatusBadge status={status} />
                      </TableCell>
                      <TableCell>
                        <span className="dashboard-muted-meta">
                          {formatDate(product.updatedAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedProductId(product.id)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock History</CardTitle>
          <CardDescription>
            Initial balances, purchases received, and sales completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <EmptyBlock
              title="No stock history yet"
              description="Inventory movements will appear here as purchases are received and sales are completed."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Qty change</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.slice(0, 12).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.timestamp)}</TableCell>
                    <TableCell>{entry.productName}</TableCell>
                    <TableCell>
                      <div className="dashboard-product-cell">
                        <span>{entry.action}</span>
                        <span className="dashboard-muted-meta">{entry.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          entry.quantityChange >= 0
                            ? "text-[var(--success)]"
                            : "text-[var(--danger)]"
                        }
                      >
                        {formatQuantityChange(entry.quantityChange)}
                      </span>
                    </TableCell>
                    <TableCell>{entry.reference || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedProduct ? (
        <ProductDetailModal
          product={selectedProduct}
          history={selectedHistory}
          onClose={() => setSelectedProductId(null)}
        />
      ) : null}
    </div>
  )
}
