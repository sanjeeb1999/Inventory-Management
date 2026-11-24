"use client"

import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import {
  formatCurrency,
  formatDate,
  getDashboardKPIs,
  getLowStockProducts,
  getProductById,
  getRecentActivity,
  getStockStatusClass,
  getTotalPurchasesAmount,
  getTotalSalesAmount,
  state,
  subscribeToStore,
} from "@/lib/store"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge, StatusBadge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function PackageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.3 7 12 12l8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m12 2 9 5-9 5-9-5 9-5z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 17 9 5 9-5" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function SalesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19V7" />
      <path d="M4 19h16" />
      <path d="M8 15v-4" />
      <path d="M12 15V9" />
      <path d="M16 15v-6" />
    </svg>
  )
}

function PurchasesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  )
}

function KPICard({
  label,
  value,
  subtitle,
  icon,
  tone = "default",
}: {
  label: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  tone?: "default" | "warning" | "accent" | "success"
}) {
  return (
    <div className={`kpi-card dashboard-kpi dashboard-kpi-${tone}`}>
      <div className="dashboard-kpi-top">
        <p className="kpi-label">{label}</p>
        <span className="dashboard-kpi-icon">{icon}</span>
      </div>
      <p className="kpi-value">{value}</p>
      {subtitle ? <p className="kpi-subtitle">{subtitle}</p> : null}
    </div>
  )
}

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

export default function DashboardPage() {
  const [, setRevision] = useState(0)

  useEffect(() => {
    return subscribeToStore(() => setRevision((value) => value + 1))
  }, [])

  const kpis = getDashboardKPIs()
  const alertProducts = getLowStockProducts()
  const recentActivities = getRecentActivity()
  const totalSalesAmount = getTotalSalesAmount()
  const totalPurchasesAmount = getTotalPurchasesAmount()

  const recentSales = [...state.sales]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  const recentPurchases = [...state.purchases]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  const outOfStockCount = state.products.filter((p) => p.currentQuantity <= 0).length
  const lowOnlyCount = state.products.filter(
    (p) => p.currentQuantity > 0 && p.currentQuantity <= p.minStockLevel
  ).length
  const inStockCount = state.products.filter(
    (p) => p.currentQuantity > p.minStockLevel
  ).length
  const productTotal = Math.max(state.products.length, 1)

  const stockSegments = [
    {
      key: "in-stock",
      label: "In Stock",
      count: inStockCount,
      color: "var(--success)",
    },
    {
      key: "low-stock",
      label: "Low Stock",
      count: lowOnlyCount,
      color: "var(--warning)",
    },
    {
      key: "out-of-stock",
      label: "Out of Stock",
      count: outOfStockCount,
      color: "var(--danger)",
    },
  ]

  return (
    <div className="dashboard-page">
      <PageHeader
        title="Dashboard"
        eyebrow="Operations overview"
        description="Stock levels, alerts, and recent inventory activity"
        actions={
          <>
            <Link href="/sales">
              <Button variant="secondary">New sale</Button>
            </Link>
            <Link href="/purchases">
              <Button>New purchase</Button>
            </Link>
          </>
        }
      />

      <section className="dashboard-hero" aria-label="Workspace snapshot">
        <div className="dashboard-hero-top">
          <div>
            <p className="dashboard-hero-eyebrow">Live inventory pulse</p>
            <h2 className="dashboard-hero-title">
              Keep stock healthy across sales and purchases
            </h2>
            <p className="dashboard-hero-copy">
              Completed sales reduce stock once. Received purchases increase stock once.
              Low-stock items surface here automatically.
            </p>
          </div>
        </div>
        <div className="dashboard-hero-stats">
          <div className="dashboard-hero-stat">
            <p className="dashboard-hero-stat-label">Catalog</p>
            <p className="dashboard-hero-stat-value">
              {kpis.totalProducts.toLocaleString()}
            </p>
          </div>
          <div className="dashboard-hero-stat">
            <p className="dashboard-hero-stat-label">On hand</p>
            <p className="dashboard-hero-stat-value">
              {kpis.totalStockQuantity.toLocaleString()}
            </p>
          </div>
          <div className="dashboard-hero-stat">
            <p className="dashboard-hero-stat-label">Alerts</p>
            <p className="dashboard-hero-stat-value">
              {kpis.lowStockItems.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <section className="dashboard-kpi-grid" aria-label="Key metrics">
        <KPICard
          label="Total Products"
          value={kpis.totalProducts.toLocaleString()}
          subtitle="Active catalog items"
          icon={<PackageIcon />}
        />
        <KPICard
          label="Total Stock Qty"
          value={kpis.totalStockQuantity.toLocaleString()}
          subtitle="Units across all products"
          icon={<LayersIcon />}
        />
        <KPICard
          label="Low Stock Items"
          value={kpis.lowStockItems.toLocaleString()}
          subtitle={`${outOfStockCount} out of stock`}
          icon={<AlertIcon />}
          tone="warning"
        />
        <KPICard
          label="Total Sales"
          value={formatCurrency(totalSalesAmount)}
          subtitle={`${kpis.totalSales} order${kpis.totalSales === 1 ? "" : "s"}`}
          icon={<SalesIcon />}
          tone="accent"
        />
        <KPICard
          label="Total Purchases"
          value={formatCurrency(totalPurchasesAmount)}
          subtitle={`${kpis.totalPurchases} order${kpis.totalPurchases === 1 ? "" : "s"}`}
          icon={<PurchasesIcon />}
          tone="success"
        />
      </section>

      <section className="dashboard-main-grid">
        <Card className="dashboard-span-2">
          <CardHeader className="dashboard-card-header">
            <div>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>
                Products that need replenishment attention
              </CardDescription>
            </div>
            <Link href="/stock">
              <Button variant="secondary" size="sm">
                View stock
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {alertProducts.length === 0 ? (
              <EmptyBlock
                title="All stock levels look healthy"
                description="No products are currently below their minimum levels."
                action={
                  <Link href="/stock">
                    <Button variant="secondary" size="sm">
                      Review stock
                    </Button>
                  </Link>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertProducts.map((product) => {
                    const status = getStockStatusClass(
                      product.currentQuantity,
                      product.minStockLevel
                    )
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="dashboard-product-cell">
                            <span>{product.name}</span>
                            <span className="dashboard-muted-meta">
                              {product.category}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {product.currentQuantity} {product.unit}
                        </TableCell>
                        <TableCell>
                          {product.minStockLevel} {product.unit}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={status} />
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
            <CardTitle>Stock Overview</CardTitle>
            <CardDescription>Product health at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="stock-bar" aria-hidden>
              {stockSegments.map((segment) => (
                <div
                  key={segment.key}
                  className="stock-bar-segment"
                  style={{
                    width: `${(segment.count / productTotal) * 100}%`,
                    backgroundColor: segment.color,
                  }}
                />
              ))}
            </div>

            <div className="stock-overview-list">
              {stockSegments.map((segment) => (
                <div key={segment.key} className="stock-overview-item">
                  <div className="stock-overview-label">
                    <span
                      className="stock-dot"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span>{segment.label}</span>
                  </div>
                  <strong>{segment.count}</strong>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="dashboard-main-grid">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest inventory movements</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <EmptyBlock
                title="No activity yet"
                description="Sales and received purchases will appear here as they happen."
              />
            ) : (
              <ul className="activity-list">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="activity-item">
                    <div className="activity-item-top">
                      <Badge
                        tone={
                          activity.type === "sale"
                            ? "info"
                            : activity.type === "purchase"
                              ? "success"
                              : "neutral"
                        }
                      >
                        {activity.type}
                      </Badge>
                      <span className="dashboard-muted-meta">
                        {formatDate(activity.timestamp)}
                      </span>
                    </div>
                    <p className="activity-title">{activity.title}</p>
                    <p className="activity-copy">{activity.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="dashboard-card-header">
            <div>
              <CardTitle>Recent Sales</CardTitle>
              <CardDescription>Latest outbound orders</CardDescription>
            </div>
            <Link href="/sales">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <EmptyBlock
                title="No sales recorded"
                description="Create a sale to see recent transactions here."
                action={
                  <Link href="/sales">
                    <Button size="sm">Go to Sales</Button>
                  </Link>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.id}</TableCell>
                      <TableCell>
                        <div className="dashboard-product-cell">
                          <span>{sale.customer}</span>
                          <span className="dashboard-muted-meta">
                            {getProductById(sale.productId)?.name ?? "Product"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(sale.total)}</TableCell>
                      <TableCell>
                        <StatusBadge status={sale.status} />
                      </TableCell>
                      <TableCell>{formatDate(sale.date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="dashboard-card-header">
            <div>
              <CardTitle>Recent Purchases</CardTitle>
              <CardDescription>Latest inbound orders</CardDescription>
            </div>
            <Link href="/purchases">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentPurchases.length === 0 ? (
              <EmptyBlock
                title="No purchases recorded"
                description="Create a purchase order to track inbound stock here."
                action={
                  <Link href="/purchases">
                    <Button size="sm">Go to Purchases</Button>
                  </Link>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purchase ID</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell>{purchase.id}</TableCell>
                      <TableCell>
                        <div className="dashboard-product-cell">
                          <span>{purchase.supplier}</span>
                          <span className="dashboard-muted-meta">
                            {getProductById(purchase.productId)?.name ?? "Product"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(purchase.total)}</TableCell>
                      <TableCell>
                        <StatusBadge status={purchase.status} />
                      </TableCell>
                      <TableCell>{formatDate(purchase.date)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
