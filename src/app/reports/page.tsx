"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  formatCurrency,
  formatDate,
  getDashboardKPIs,
  getLowStockCount,
  getProductById,
  getProductCategories,
  getStockStatusClass,
  getTotalPurchasesAmount,
  getTotalSalesAmount,
  state,
  subscribeToStore,
} from "@/lib/store"
import { PageHeader } from "@/components/layout/page-header"
import { Badge, StatusBadge } from "@/components/ui/badge"
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

type ReportTab = "stock" | "sales" | "purchases"
type DateFilter = "all" | "month" | "week"

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

function matchesDateFilter(
  isoDate: string,
  dateFilter: DateFilter,
  monthKey: string,
  weekStartKey: string
): boolean {
  const day = isoDate.slice(0, 10)
  const month = isoDate.slice(0, 7)

  if (dateFilter === "all") return true
  if (dateFilter === "month") return !monthKey || month === monthKey
  if (dateFilter === "week") return !weekStartKey || day >= weekStartKey
  return true
}

function ReportTabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={`report-tab ${active ? "active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

export default function ReportsPage() {
  const [, setRevision] = useState(0)
  const [activeTab, setActiveTab] = useState<ReportTab>("stock")

  const [stockSearch, setStockSearch] = useState("")
  const [stockCategory, setStockCategory] = useState("")
  const [stockStatus, setStockStatus] = useState("")

  const [salesSearch, setSalesSearch] = useState("")
  const [salesStatus, setSalesStatus] = useState("")
  const [salesDateFilter, setSalesDateFilter] = useState<DateFilter>("all")

  const [purchaseSearch, setPurchaseSearch] = useState("")
  const [purchaseStatus, setPurchaseStatus] = useState("")
  const [purchaseDateFilter, setPurchaseDateFilter] = useState<DateFilter>("all")

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

  const kpis = getDashboardKPIs()
  const lowStockCount = getLowStockCount()
  const totalSalesAmount = getTotalSalesAmount()
  const totalPurchasesAmount = getTotalPurchasesAmount()
  const categories = getProductCategories()

  const completedSalesAmount = state.sales
    .filter((sale) => sale.status === "completed")
    .reduce((sum, sale) => sum + sale.total, 0)

  const receivedPurchasesAmount = state.purchases
    .filter((purchase) => purchase.status === "received")
    .reduce((sum, purchase) => sum + purchase.total, 0)

  const stockQuery = stockSearch.trim().toLowerCase()
  const filteredProducts = state.products.filter((product) => {
    const status = getStockStatusClass(
      product.currentQuantity,
      product.minStockLevel
    )
    const matchesSearch =
      !stockQuery ||
      product.name.toLowerCase().includes(stockQuery) ||
      product.sku.toLowerCase().includes(stockQuery) ||
      product.category.toLowerCase().includes(stockQuery)
    const matchesCategory = !stockCategory || product.category === stockCategory
    const matchesStatus = !stockStatus || status === stockStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const salesQuery = salesSearch.trim().toLowerCase()
  const filteredSales = state.sales.filter((sale) => {
    const product = getProductById(sale.productId)
    const matchesSearch =
      !salesQuery ||
      sale.id.toLowerCase().includes(salesQuery) ||
      sale.customer.toLowerCase().includes(salesQuery) ||
      (product?.name || "").toLowerCase().includes(salesQuery) ||
      (product?.sku || "").toLowerCase().includes(salesQuery)
    const matchesStatus = !salesStatus || sale.status === salesStatus
    const matchesDate = matchesDateFilter(
      sale.date,
      salesDateFilter,
      monthKey,
      weekStartKey
    )
    return matchesSearch && matchesStatus && matchesDate
  })

  const purchaseQuery = purchaseSearch.trim().toLowerCase()
  const filteredPurchases = state.purchases.filter((purchase) => {
    const product = getProductById(purchase.productId)
    const matchesSearch =
      !purchaseQuery ||
      purchase.id.toLowerCase().includes(purchaseQuery) ||
      purchase.supplier.toLowerCase().includes(purchaseQuery) ||
      (product?.name || "").toLowerCase().includes(purchaseQuery) ||
      (product?.sku || "").toLowerCase().includes(purchaseQuery)
    const matchesStatus = !purchaseStatus || purchase.status === purchaseStatus
    const matchesDate = matchesDateFilter(
      purchase.date,
      purchaseDateFilter,
      monthKey,
      weekStartKey
    )
    return matchesSearch && matchesStatus && matchesDate
  })

  return (
    <div className="reports-page">
      <PageHeader
        title="Reports"
        description="Live inventory, sales, and purchase reports from the shared store"
      />

      <section className="stock-summary-grid" aria-label="Report summary">
        <div className="kpi-card">
          <p className="kpi-label">Total Products</p>
          <p className="kpi-value">{kpis.totalProducts}</p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Current Stock Qty</p>
          <p className="kpi-value">
            {kpis.totalStockQuantity.toLocaleString()}
          </p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Total Sales</p>
          <p className="kpi-value text-[var(--accent)]">
            {formatCurrency(totalSalesAmount)}
          </p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Total Purchases</p>
          <p className="kpi-value text-[var(--accent)]">
            {formatCurrency(totalPurchasesAmount)}
          </p>
        </div>
        <div className="kpi-card">
          <p className="kpi-label">Low Stock Items</p>
          <p className="kpi-value text-[var(--warning)]">{lowStockCount}</p>
        </div>
      </section>

      <div className="report-tabs" role="tablist" aria-label="Report sections">
        <ReportTabButton
          active={activeTab === "stock"}
          onClick={() => setActiveTab("stock")}
        >
          Stock Report
        </ReportTabButton>
        <ReportTabButton
          active={activeTab === "sales"}
          onClick={() => setActiveTab("sales")}
        >
          Sales Report
        </ReportTabButton>
        <ReportTabButton
          active={activeTab === "purchases"}
          onClick={() => setActiveTab("purchases")}
        >
          Purchase Report
        </ReportTabButton>
      </div>

      {activeTab === "stock" ? (
        <Card>
          <CardHeader className="dashboard-card-header">
            <div>
              <CardTitle>Stock Report</CardTitle>
              <CardDescription>
                Current inventory levels and stock status
              </CardDescription>
            </div>
            <Badge tone="neutral">{filteredProducts.length} shown</Badge>
          </CardHeader>
          <CardContent>
            <div className="filter-bar stock-filter-bar">
              <Input
                type="search"
                value={stockSearch}
                onChange={(event) => setStockSearch(event.target.value)}
                placeholder="Search product, SKU, or category..."
                className="filter-input stock-search-input"
                aria-label="Search stock report"
              />
              <Select
                value={stockCategory}
                onChange={(event) => setStockCategory(event.target.value)}
                className="filter-input"
                aria-label="Filter stock by category"
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
              <Select
                value={stockStatus}
                onChange={(event) => setStockStatus(event.target.value)}
                className="filter-input"
                aria-label="Filter stock by status"
              >
                <option value="">All statuses</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </Select>
            </div>

            {state.products.length === 0 ? (
              <EmptyBlock
                title="No products in inventory"
                description="Stock data will appear here once products exist in the shared store."
              />
            ) : filteredProducts.length === 0 ? (
              <EmptyBlock
                title="No matching stock records"
                description="Try adjusting search or stock filters."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Qty</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
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
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.sku}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>
                          {product.currentQuantity} {product.unit}
                        </TableCell>
                        <TableCell>
                          {product.minStockLevel} {product.unit}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={status} />
                        </TableCell>
                        <TableCell>{formatDate(product.updatedAt)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "sales" ? (
        <Card>
          <CardHeader className="dashboard-card-header">
            <div>
              <CardTitle>Sales Report</CardTitle>
              <CardDescription>
                Sales orders from the shared store
              </CardDescription>
            </div>
            <Badge tone="neutral">{filteredSales.length} shown</Badge>
          </CardHeader>
          <CardContent>
            <div className="report-mini-summary mb-4">
              <div className="kpi-card">
                <p className="kpi-label">Orders</p>
                <p className="kpi-value">{state.sales.length}</p>
              </div>
              <div className="kpi-card">
                <p className="kpi-label">Total Sales Amount</p>
                <p className="kpi-value text-[var(--accent)]">
                  {formatCurrency(totalSalesAmount)}
                </p>
              </div>
              <div className="kpi-card">
                <p className="kpi-label">Completed Amount</p>
                <p className="kpi-value text-[var(--success)]">
                  {formatCurrency(completedSalesAmount)}
                </p>
              </div>
            </div>

            <div className="filter-bar stock-filter-bar">
              <Input
                type="search"
                value={salesSearch}
                onChange={(event) => setSalesSearch(event.target.value)}
                placeholder="Search invoice, customer, or product..."
                className="filter-input stock-search-input"
                aria-label="Search sales report"
              />
              <Select
                value={salesStatus}
                onChange={(event) => setSalesStatus(event.target.value)}
                className="filter-input"
                aria-label="Filter sales by status"
              >
                <option value="">All statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </Select>
              <Select
                value={salesDateFilter}
                onChange={(event) =>
                  setSalesDateFilter(event.target.value as DateFilter)
                }
                className="filter-input"
                aria-label="Filter sales by date"
              >
                <option value="all">All dates</option>
                <option value="week">Last 7 days</option>
                <option value="month">This month</option>
              </Select>
            </div>

            {state.sales.length === 0 ? (
              <EmptyBlock
                title="No sales recorded"
                description="Completed and pending sales will appear here from the shared store."
              />
            ) : filteredSales.length === 0 ? (
              <EmptyBlock
                title="No matching sales"
                description="Try adjusting search, status, or date filters."
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
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "purchases" ? (
        <Card>
          <CardHeader className="dashboard-card-header">
            <div>
              <CardTitle>Purchase Report</CardTitle>
              <CardDescription>
                Purchase orders from the shared store
              </CardDescription>
            </div>
            <Badge tone="neutral">{filteredPurchases.length} shown</Badge>
          </CardHeader>
          <CardContent>
            <div className="report-mini-summary mb-4">
              <div className="kpi-card">
                <p className="kpi-label">Orders</p>
                <p className="kpi-value">{state.purchases.length}</p>
              </div>
              <div className="kpi-card">
                <p className="kpi-label">Total Purchase Amount</p>
                <p className="kpi-value text-[var(--accent)]">
                  {formatCurrency(totalPurchasesAmount)}
                </p>
              </div>
              <div className="kpi-card">
                <p className="kpi-label">Received Amount</p>
                <p className="kpi-value text-[var(--success)]">
                  {formatCurrency(receivedPurchasesAmount)}
                </p>
              </div>
            </div>

            <div className="filter-bar stock-filter-bar">
              <Input
                type="search"
                value={purchaseSearch}
                onChange={(event) => setPurchaseSearch(event.target.value)}
                placeholder="Search purchase ID, supplier, or product..."
                className="filter-input stock-search-input"
                aria-label="Search purchase report"
              />
              <Select
                value={purchaseStatus}
                onChange={(event) => setPurchaseStatus(event.target.value)}
                className="filter-input"
                aria-label="Filter purchases by status"
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="received">Received</option>
              </Select>
              <Select
                value={purchaseDateFilter}
                onChange={(event) =>
                  setPurchaseDateFilter(event.target.value as DateFilter)
                }
                className="filter-input"
                aria-label="Filter purchases by date"
              >
                <option value="all">All dates</option>
                <option value="week">Last 7 days</option>
                <option value="month">This month</option>
              </Select>
            </div>

            {state.purchases.length === 0 ? (
              <EmptyBlock
                title="No purchases recorded"
                description="Pending and received purchases will appear here from the shared store."
              />
            ) : filteredPurchases.length === 0 ? (
              <EmptyBlock
                title="No matching purchases"
                description="Try adjusting search, status, or date filters."
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
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
