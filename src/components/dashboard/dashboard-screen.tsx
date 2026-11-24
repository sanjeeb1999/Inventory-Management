"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
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
import { EmptyBlock } from "@/components/ui/empty-block"
import {
  AlertIcon,
  LayersIcon,
  PackageIcon,
  PurchasesIcon,
  SalesIcon,
} from "@/components/dashboard/icons"
import { Metric } from "@/components/dashboard/metric"
import { Panel } from "@/components/dashboard/panel"
import { StockRing } from "@/components/dashboard/stock-ring"

const activityHref = {
  sale: "/sales",
  purchase: "/purchases",
  stock: "/stock",
} as const

export function DashboardScreen() {
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

  const stockSegments = [
    { key: "in-stock", label: "In stock", count: inStockCount, color: "#0f766e" },
    { key: "low-stock", label: "Low stock", count: lowOnlyCount, color: "#d97706" },
    { key: "out-of-stock", label: "Out of stock", count: outOfStockCount, color: "#e11d48" },
  ]

  const healthIsAlert = kpis.lowStockItems > 0
  const healthTitle = !healthIsAlert
    ? "Inventory is in good shape"
    : outOfStockCount > 0
      ? `${outOfStockCount} product${outOfStockCount === 1 ? "" : "s"} out of stock`
      : `${lowOnlyCount} product${lowOnlyCount === 1 ? "" : "s"} below minimum`
  const healthCopy = !healthIsAlert
    ? "Every product is above its minimum level. Completed sales reduce stock, and received purchases increase it."
    : `${inStockCount} of ${kpis.totalProducts} products are above minimum. Review the items that need replenishment.`

  return (
    <div className="dashboard-page">
      <PageHeader
        className="dashboard-masthead"
        title="Dashboard"
        eyebrow="Operations overview"
        description="Stock health, alerts, and the latest inventory movement."
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

      <section className="dash-metrics" aria-label="Key metrics">
        <Metric
          label="Total products"
          value={kpis.totalProducts.toLocaleString()}
          context="Active catalog items"
          icon={<PackageIcon />}
        />
        <Metric
          label="Total stock qty"
          value={kpis.totalStockQuantity.toLocaleString()}
          context="Units across all products"
          icon={<LayersIcon />}
        />
        <Metric
          label="Low stock items"
          value={kpis.lowStockItems.toLocaleString()}
          context={`${outOfStockCount} out of stock`}
          icon={<AlertIcon />}
          tone={kpis.lowStockItems > 0 ? "warning" : "neutral"}
        />
        <Metric
          label="Total sales"
          value={formatCurrency(totalSalesAmount)}
          context={`${kpis.totalSales} order${kpis.totalSales === 1 ? "" : "s"}`}
          icon={<SalesIcon />}
          tone="sales"
        />
        <Metric
          label="Total purchases"
          value={formatCurrency(totalPurchasesAmount)}
          context={`${kpis.totalPurchases} order${kpis.totalPurchases === 1 ? "" : "s"}`}
          icon={<PurchasesIcon />}
          tone="purchases"
        />
      </section>

      <section
        className={`dash-health${healthIsAlert ? " is-alert" : ""}`}
        aria-label="Inventory health"
      >
        <div className="dash-health-copy">
          <p className="dash-kicker">Inventory health</p>
          <h2 className="dash-health-title">{healthTitle}</h2>
          <p className="dash-health-text">{healthCopy}</p>
        </div>
        <dl className="dash-health-stats">
          <div>
            <dt>Products</dt>
            <dd>{kpis.totalProducts.toLocaleString()}</dd>
          </div>
          <div>
            <dt>Units on hand</dt>
            <dd>{kpis.totalStockQuantity.toLocaleString()}</dd>
          </div>
          <div className={healthIsAlert ? "is-alert" : ""}>
            <dt>Alerts</dt>
            <dd>{kpis.lowStockItems.toLocaleString()}</dd>
          </div>
        </dl>
      </section>

      <div className="dash-split dash-split-attention">
        <Panel
          id="dash-alerts-title"
          className="dash-attention"
          title="Needs attention"
          description="Products at or below their minimum level"
          action={
            <span className={`dash-count${healthIsAlert ? " is-alert" : ""}`}>
              {alertProducts.length}
            </span>
          }
        >
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
            <div className="dash-alert-list">
              <div className="dash-alert-head" aria-hidden>
                <span>Product</span>
                <span>Current</span>
                <span>Minimum</span>
                <span>Status</span>
              </div>
              {alertProducts.map((product) => {
                const status = getStockStatusClass(
                  product.currentQuantity,
                  product.minStockLevel
                )
                return (
                  <article key={product.id} className={`dash-alert-row is-${status}`}>
                    <div className="dash-alert-product">
                      <span className="dash-alert-name">{product.name}</span>
                      <span className="dash-alert-category">{product.category}</span>
                    </div>
                    <div className="dash-alert-qty">
                      <span className="dash-alert-qty-label">Current</span>
                      <strong className={`dash-qty dash-qty-${status}`}>
                        {product.currentQuantity} {product.unit}
                      </strong>
                    </div>
                    <div className="dash-alert-qty">
                      <span className="dash-alert-qty-label">Minimum</span>
                      <strong>
                        {product.minStockLevel} {product.unit}
                      </strong>
                    </div>
                    <div className="dash-alert-status">
                      <StatusBadge status={status} />
                    </div>
                  </article>
                )
              })}
              <div className="dash-panel-footer">
                <Link href="/stock">
                  <Button variant="secondary" size="sm">
                    View stock
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Panel>

        <Panel
          id="dash-overview-title"
          title="Stock overview"
          description="How the catalog splits by availability"
        >
          <div className="dash-overview">
            <StockRing segments={stockSegments} />
            <ul className="dash-legend">
              {stockSegments.map((segment) => (
                <li key={segment.key}>
                  <span className="dash-legend-label">
                    <span
                      className="stock-dot"
                      style={{ backgroundColor: segment.color }}
                    />
                    {segment.label}
                  </span>
                  <strong>{segment.count}</strong>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <div className="dash-split dash-split-flow">
        <Panel
          id="dash-activity-title"
          title="Recent activity"
          description="Latest inventory movements"
        >
          {recentActivities.length === 0 ? (
            <EmptyBlock
              title="No activity yet"
              description="Sales and received purchases will appear here as they happen."
            />
          ) : (
            <ol className="dash-feed">
              {recentActivities.map((activity) => (
                <li key={activity.id}>
                  <Link
                    href={activityHref[activity.type]}
                    className={`dash-feed-link is-${activity.type}`}
                  >
                    <span className="dash-feed-icon" aria-hidden>
                      {activity.type === "sale" ? (
                        <SalesIcon />
                      ) : activity.type === "purchase" ? (
                        <PurchasesIcon />
                      ) : (
                        <LayersIcon />
                      )}
                    </span>
                    <span className="dash-feed-body">
                      <span className="dash-feed-top">
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
                        <time dateTime={activity.timestamp}>
                          {formatDate(activity.timestamp)}
                        </time>
                      </span>
                      <span className="dash-feed-title">{activity.title}</span>
                      <span className="dash-feed-copy">{activity.description}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel
          id="dash-sales-title"
          title="Recent sales"
          description="Latest outbound orders"
          action={
            <Link href="/sales">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          }
        >
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
            <ul className="dash-tx">
              {recentSales.map((sale) => (
                <li key={sale.id}>
                  <Link href="/sales" className="dash-tx-row">
                    <span className="dash-tx-main">
                      <span className="dash-tx-id">{sale.id}</span>
                      <span className="dash-tx-who">{sale.customer}</span>
                      <span className="dash-tx-meta">
                        {getProductById(sale.productId)?.name ?? "Product"}
                        {" · "}
                        {formatDate(sale.date)}
                      </span>
                    </span>
                    <span className="dash-tx-side">
                      <span className="dash-tx-amount">{formatCurrency(sale.total)}</span>
                      <StatusBadge status={sale.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        id="dash-purchases-title"
        title="Recent purchases"
        description="Latest inbound orders"
        action={
          <Link href="/purchases">
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </Link>
        }
      >
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
          <ul className="dash-tx dash-tx-wide">
            {recentPurchases.map((purchase) => (
              <li key={purchase.id}>
                <Link href="/purchases" className="dash-tx-row">
                  <span className="dash-tx-main">
                    <span className="dash-tx-id">{purchase.id}</span>
                    <span className="dash-tx-who">{purchase.supplier}</span>
                    <span className="dash-tx-meta">
                      {getProductById(purchase.productId)?.name ?? "Product"}
                      {" · "}
                      {formatDate(purchase.date)}
                    </span>
                  </span>
                  <span className="dash-tx-side">
                    <span className="dash-tx-amount">
                      {formatCurrency(purchase.total)}
                    </span>
                    <StatusBadge status={purchase.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
