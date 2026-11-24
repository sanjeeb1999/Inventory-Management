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
import { formatQuantityChange } from "@/components/stock/format-quantity"
import { ProductDetailModal } from "@/components/stock/product-detail-modal"

type SortOption = "name-asc" | "qty-desc" | "qty-asc" | "updated-desc" | "updated-asc"

export function StockScreen() {
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
    <div className="module-page stock-page">
      <PageHeader
        title="Stock"
        description="Source of truth for inventory quantity and stock status"
      />

      <section className="stock-summary-grid" aria-label="Stock summary">
        <div className="kpi-card">
          <p className="kpi-label">Total products</p>
          <p className="kpi-value">{summary.totalProducts}</p>
          <p className="kpi-subtitle">Active catalog</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Total quantity</p>
          <p className="kpi-value">{summary.totalQuantity.toLocaleString()}</p>
          <p className="kpi-subtitle">Units on hand</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">In stock</p>
          <p className="kpi-value metric-good">{summary.inStock}</p>
          <p className="kpi-subtitle">Above minimum</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Low stock</p>
          <p className="kpi-value metric-warn">{summary.lowStock}</p>
          <p className="kpi-subtitle">At or below minimum</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Out of stock</p>
          <p className="kpi-value metric-bad">{summary.outOfStock}</p>
          <p className="kpi-subtitle">Zero on hand</p>
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
                        <div className="data-stack">
                          <span className="data-title">{product.name}</span>
                          <span className="data-meta">{product.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <span className="qty-figure">
                          <strong>{product.currentQuantity}</strong>
                          <span>{product.unit}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="qty-figure">
                          <strong>{product.minStockLevel}</strong>
                          <span>{product.unit}</span>
                        </span>
                      </TableCell>
                      <TableCell className="qty-unit">{product.unit}</TableCell>
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
                          className="link-action"
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
                    <TableCell className="data-meta">{formatDate(entry.timestamp)}</TableCell>
                    <TableCell>
                      <span className="data-title">{entry.productName}</span>
                    </TableCell>
                    <TableCell>
                      <div className="data-stack">
                        <span className="data-title">{entry.action}</span>
                        <span className="data-meta">{entry.type}</span>
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
