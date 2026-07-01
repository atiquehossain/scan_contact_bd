"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Eye, HandCoins, PackageCheck, Search, ShoppingBag, Truck } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, ConfirmDialog, EmptyState, ErrorState, formatBdt, formatDate, StatusBadge, ToastNotification, cx } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  unitPriceBdt?: number | null;
  totalBdt?: number | null;
};

type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  subtotalBdt?: number | null;
  deliveryFeeBdt?: number | null;
  totalBdt: number;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  deliveryDistrict?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  items?: OrderItem[];
};

type FilterKey = "all" | "pending" | "processing" | "out-for-delivery" | "delivered" | "cod-pending" | "cod-collected" | "cancelled";

function humanize(value?: string | null) {
  if (!value) return "Not available";
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function statusTone(status?: string | null): "neutral" | "success" | "warning" | "danger" | "info" {
  if (!status) return "neutral";
  if (["DELIVERED", "PAID", "COD_COLLECTED"].includes(status)) return "success";
  if (["PENDING", "CONFIRMED", "PROCESSING", "PRINTED", "SHIPPED", "COD_PENDING", "UNPAID"].includes(status)) return "warning";
  if (["CANCELLED", "RETURNED", "REFUNDED", "FAILED"].includes(status)) return "danger";
  return "neutral";
}

function isDelivered(order: AdminOrder) {
  return order.status === "DELIVERED" && order.paymentStatus === "COD_COLLECTED";
}

function productSummary(order: AdminOrder) {
  const items = order.items || [];
  if (!items.length) return "Order items unavailable";
  const first = items[0];
  const extra = items.length > 1 ? ` +${items.length - 1} more` : "";
  return `${first.name}${first.quantity > 1 ? ` x${first.quantity}` : ""}${extra}`;
}

function deliveryArea(order: AdminOrder) {
  return [order.deliveryCity, order.deliveryDistrict].filter(Boolean).join(", ") || "Area not provided";
}

function orderMatchesFilter(order: AdminOrder, filter: FilterKey) {
  if (filter === "pending") return order.status === "PENDING";
  if (filter === "processing") return ["CONFIRMED", "PROCESSING", "PRINTED"].includes(order.status);
  if (filter === "out-for-delivery") return order.status === "SHIPPED";
  if (filter === "delivered") return order.status === "DELIVERED";
  if (filter === "cod-pending") return order.paymentStatus === "COD_PENDING";
  if (filter === "cod-collected") return order.paymentStatus === "COD_COLLECTED";
  if (filter === "cancelled") return ["CANCELLED", "RETURNED", "REFUNDED"].includes(order.status);
  return true;
}

function SummaryCard({
  label,
  value,
  detail,
  tone = "neutral",
  icon: Icon
}: {
  label: string;
  value: number;
  detail: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  icon: typeof ShoppingBag;
}) {
  return (
    <div
      className={cx(
        "rounded-[var(--radius-card)] border bg-white p-4 shadow-[var(--shadow-card)]",
        tone === "success" && "border-emerald-200",
        tone === "warning" && "border-amber-200",
        tone === "danger" && "border-red-200",
        tone === "info" && "border-blue-200",
        tone === "neutral" && "border-[var(--color-border)]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-bold leading-8 text-[var(--color-ink-strong)]">{value}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{detail}</p>
        </div>
        <span
          className={cx(
            "grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-button)] border",
            tone === "success" && "border-emerald-200 bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
            tone === "warning" && "border-amber-200 bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
            tone === "danger" && "border-red-200 bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
            tone === "info" && "border-blue-200 bg-[var(--color-info-soft)] text-[var(--color-info)]",
            tone === "neutral" && "border-[var(--color-border)] bg-[#f8fbf9] text-[var(--color-muted)]"
          )}
        >
          <Icon aria-hidden className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="grid gap-5" role="status" aria-live="polite" aria-label="Loading orders">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-36 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="h-10 w-full animate-pulse rounded-[var(--radius-button)] bg-slate-200" />
        <div className="mt-5 grid gap-3">
          {[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />)}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [target, setTarget] = useState<AdminOrder | null>(null);
  const [detailTarget, setDetailTarget] = useState<AdminOrder | null>(null);
  const [updatingId, setUpdatingId] = useState("");
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ orders: AdminOrder[] }>("/admin/orders");
      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((order) => !["DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"].includes(order.status)).length,
    codPending: orders.filter((order) => order.paymentStatus === "COD_PENDING").length,
    delivered: orders.filter((order) => order.status === "DELIVERED").length
  }), [orders]);

  const filteredOrders = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      const haystack = [
        order.orderNumber,
        order.customerName,
        order.customerPhone,
        order.deliveryCity,
        order.deliveryDistrict,
        productSummary(order)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (!needle || haystack.includes(needle)) && orderMatchesFilter(order, filter);
    });
  }, [filter, orders, query]);

  async function markDelivered() {
    if (!target) return;
    setUpdatingId(target.id);
    try {
      const data = await apiFetch<{ order: AdminOrder }>(`/admin/orders/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "DELIVERED", paymentStatus: "COD_COLLECTED" })
      });
      setOrders((items) => items.map((item) => (item.id === target.id ? data.order : item)));
      setToast("Order marked as delivered.");
      setTarget(null);
      setDetailTarget((current) => (current?.id === target.id ? data.order : current));
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not update order.");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <AdminShell>
      <div className="grid gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
              <a href="/admin/overview" className="font-bold text-[var(--color-primary)] hover:underline">Admin</a>
              <span aria-hidden>/</span>
              <span>Orders</span>
            </nav>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">Order operations</p>
            <h1 className="mt-1 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">Orders</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              Review QR tag orders, COD collection, and delivery progress.
            </p>
          </div>
          <StatusBadge tone="warning">Cash on Delivery</StatusBadge>
        </header>

        {loading ? <OrdersSkeleton /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}

        {!loading && !error ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Order summary">
              <SummaryCard icon={ShoppingBag} label="Total orders" value={summary.total} detail="Orders returned by admin API" tone="info" />
              <SummaryCard icon={Clock3} label="Pending orders" value={summary.pending} detail="Not delivered, cancelled, or returned" tone={summary.pending ? "warning" : "success"} />
              <SummaryCard icon={HandCoins} label="COD pending" value={summary.codPending} detail="Cash collection still pending" tone={summary.codPending ? "warning" : "success"} />
              <SummaryCard icon={PackageCheck} label="Delivered" value={summary.delivered} detail="Orders marked delivered" tone={summary.delivered ? "success" : "neutral"} />
            </section>

            <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
                <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="order-search">
                  Search orders
                  <span className="relative">
                    <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                    <input
                      id="order-search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search tracking code, customer, phone, city, or product"
                      className="focus-ring min-h-11 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] py-2.5 pl-10 pr-3 font-medium text-[var(--color-ink)] placeholder:text-slate-400"
                    />
                  </span>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="order-filter">
                  Filter
                  <select id="order-filter" value={filter} onChange={(event) => setFilter(event.target.value as FilterKey)} className="focus-ring min-h-11 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-2.5 font-medium text-[var(--color-ink)]">
                    <option value="all">All orders</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Confirmed / processing</option>
                    <option value="out-for-delivery">Out for delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="cod-pending">COD pending</option>
                    <option value="cod-collected">COD collected</option>
                    <option value="cancelled">Cancelled / returned</option>
                  </select>
                </label>
              </div>
            </section>

            {orders.length === 0 ? (
              <EmptyState title="No orders yet" body="COD orders will appear here after buyers place NoNumQR orders." />
            ) : (
              <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-ink-strong)]">Order queue</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{filteredOrders.length} order{filteredOrders.length === 1 ? "" : "s"} match this view.</p>
                  </div>
                  <StatusBadge tone="info">Admin only</StatusBadge>
                </div>

                {filteredOrders.length === 0 ? <EmptyState title="No orders match this view" body="Change the search or filter to see orders." /> : null}

                {filteredOrders.length > 0 ? (
                  <>
                    <div className="hidden overflow-x-auto xl:block">
                      <table className="min-w-full text-left text-sm">
                        <thead className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                          <tr className="border-b border-[var(--color-border)]">
                            <th className="py-3 pr-4">Tracking code</th>
                            <th className="py-3 pr-4">Buyer</th>
                            <th className="py-3 pr-4">Product</th>
                            <th className="py-3 pr-4">Area</th>
                            <th className="py-3 pr-4">Total</th>
                            <th className="py-3 pr-4">Payment</th>
                            <th className="py-3 pr-4">Delivery</th>
                            <th className="py-3 pr-4">Created</th>
                            <th className="py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((order) => {
                            const delivered = isDelivered(order);
                            return (
                              <tr key={order.id} className="border-b border-slate-100 last:border-0">
                                <td className="py-4 pr-4">
                                  <p className="font-bold text-[var(--color-ink-strong)]">{order.orderNumber}</p>
                                  <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">{order.paymentMethod || "COD"}</p>
                                </td>
                                <td className="py-4 pr-4">
                                  <p className="font-bold text-[var(--color-ink)]">{order.customerName}</p>
                                  <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">{order.customerPhone}</p>
                                </td>
                                <td className="py-4 pr-4">
                                  <p className="max-w-[220px] font-semibold text-[var(--color-ink)]">{productSummary(order)}</p>
                                  <p className="mt-1 text-xs text-[var(--color-muted)]">{order.items?.length || 0} item{order.items?.length === 1 ? "" : "s"}</p>
                                </td>
                                <td className="py-4 pr-4">
                                  <p className="font-semibold text-[var(--color-ink)]">{deliveryArea(order)}</p>
                                </td>
                                <td className="py-4 pr-4 font-bold text-[var(--color-ink-strong)]">{formatBdt(order.totalBdt)}</td>
                                <td className="py-4 pr-4"><StatusBadge tone={statusTone(order.paymentStatus)}>{humanize(order.paymentStatus)}</StatusBadge></td>
                                <td className="py-4 pr-4"><StatusBadge tone={statusTone(order.status)}>{humanize(order.status)}</StatusBadge></td>
                                <td className="py-4 pr-4">{formatDate(order.createdAt)}</td>
                                <td className="py-4">
                                  <div className="flex flex-wrap gap-2">
                                    <Button type="button" variant="secondary" onClick={() => setDetailTarget(order)}>
                                      <Eye aria-hidden size={15} />Details
                                    </Button>
                                    {delivered ? <StatusBadge tone="success">Completed</StatusBadge> : (
                                      <Button type="button" loading={updatingId === order.id} onClick={() => setTarget(order)}>
                                        <CheckCircle2 aria-hidden size={15} />Mark delivered
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid gap-3 xl:hidden">
                      {filteredOrders.map((order) => {
                        const delivered = isDelivered(order);
                        return (
                          <article key={order.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#fbfdfc] p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h2 className="font-bold text-[var(--color-ink-strong)]">{order.orderNumber}</h2>
                                <p className="mt-1 text-sm font-semibold text-[var(--color-muted)]">{productSummary(order)}</p>
                              </div>
                              <StatusBadge tone={statusTone(order.status)}>{humanize(order.status)}</StatusBadge>
                            </div>
                            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                              <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-3 text-sm">
                                <p className="text-xs font-semibold text-[var(--color-muted)]">Buyer</p>
                                <p className="mt-1 font-bold text-[var(--color-ink)]">{order.customerName}</p>
                              </div>
                              <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-3 text-sm">
                                <p className="text-xs font-semibold text-[var(--color-muted)]">Area</p>
                                <p className="mt-1 font-bold text-[var(--color-ink)]">{deliveryArea(order)}</p>
                              </div>
                              <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-3 text-sm">
                                <p className="text-xs font-semibold text-[var(--color-muted)]">Total</p>
                                <p className="mt-1 font-bold text-[var(--color-ink)]">{formatBdt(order.totalBdt)}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <StatusBadge tone={statusTone(order.paymentStatus)}>{humanize(order.paymentStatus)}</StatusBadge>
                              <StatusBadge tone={statusTone(order.status)}>{humanize(order.status)}</StatusBadge>
                            </div>
                            <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]"><Truck aria-hidden className="h-3.5 w-3.5" />Created {formatDate(order.createdAt)}</p>
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                              <Button type="button" variant="secondary" onClick={() => setDetailTarget(order)}>
                                <Eye aria-hidden size={15} />Details
                              </Button>
                              {delivered ? <StatusBadge tone="success">Completed</StatusBadge> : (
                                <Button type="button" loading={updatingId === order.id} onClick={() => setTarget(order)}>
                                  <CheckCircle2 aria-hidden size={15} />Mark delivered
                                </Button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </section>
            )}
          </>
        ) : null}
      </div>

      {detailTarget ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4" role="presentation">
          <section aria-modal="true" role="dialog" aria-labelledby="order-detail-title" className="focus-ring max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[var(--radius-card)] bg-white p-5 shadow-xl">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">Order detail</p>
                <h2 id="order-detail-title" className="mt-1 text-xl font-bold text-[var(--color-ink-strong)]">{detailTarget.orderNumber}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">Admin-only buyer and COD delivery context.</p>
              </div>
              <Button type="button" variant="secondary" onClick={() => setDetailTarget(null)}>Close</Button>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <section className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-4">
                <h3 className="font-bold text-[var(--color-ink-strong)]">Receiver</h3>
                <dl className="mt-3 grid gap-3 text-sm">
                  <div><dt className="font-semibold text-[var(--color-muted)]">Name</dt><dd className="mt-1 font-bold text-[var(--color-ink)]">{detailTarget.customerName}</dd></div>
                  <div><dt className="font-semibold text-[var(--color-muted)]">Phone</dt><dd className="mt-1 font-bold text-[var(--color-ink)]">{detailTarget.customerPhone}</dd></div>
                  <div><dt className="font-semibold text-[var(--color-muted)]">City / district</dt><dd className="mt-1 font-bold text-[var(--color-ink)]">{deliveryArea(detailTarget)}</dd></div>
                  <div><dt className="font-semibold text-[var(--color-muted)]">Address</dt><dd className="mt-1 whitespace-pre-wrap font-bold text-[var(--color-ink)]">{detailTarget.deliveryAddress || "Not provided"}</dd></div>
                </dl>
              </section>
              <section className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-4">
                <h3 className="font-bold text-[var(--color-ink-strong)]">Payment and delivery</h3>
                <dl className="mt-3 grid gap-3 text-sm">
                  <div><dt className="font-semibold text-[var(--color-muted)]">Payment method</dt><dd className="mt-1 font-bold text-[var(--color-ink)]">{detailTarget.paymentMethod || "COD"}</dd></div>
                  <div><dt className="font-semibold text-[var(--color-muted)]">Payment status</dt><dd className="mt-1"><StatusBadge tone={statusTone(detailTarget.paymentStatus)}>{humanize(detailTarget.paymentStatus)}</StatusBadge></dd></div>
                  <div><dt className="font-semibold text-[var(--color-muted)]">Delivery status</dt><dd className="mt-1"><StatusBadge tone={statusTone(detailTarget.status)}>{humanize(detailTarget.status)}</StatusBadge></dd></div>
                  <div><dt className="font-semibold text-[var(--color-muted)]">Created</dt><dd className="mt-1 font-bold text-[var(--color-ink)]">{formatDate(detailTarget.createdAt)}</dd></div>
                </dl>
              </section>
            </div>
            <section className="mt-4 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-4">
              <h3 className="font-bold text-[var(--color-ink-strong)]">Products</h3>
              {detailTarget.items?.length ? (
                <div className="mt-3 grid gap-2">
                  {detailTarget.items.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-3 text-sm">
                      <div>
                        <p className="font-bold text-[var(--color-ink)]">{item.name}</p>
                        <p className="text-xs text-[var(--color-muted)]">Quantity {item.quantity}</p>
                      </div>
                      <p className="font-bold text-[var(--color-ink-strong)]">{formatBdt(item.totalBdt)}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="mt-2 text-sm text-[var(--color-muted)]">Order items unavailable.</p>}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
                <p className="text-sm font-semibold text-[var(--color-muted)]">Total amount</p>
                <p className="text-xl font-bold text-[var(--color-ink-strong)]">{formatBdt(detailTarget.totalBdt)}</p>
              </div>
            </section>
            {!isDelivered(detailTarget) ? (
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <Button type="button" loading={updatingId === detailTarget.id} onClick={() => setTarget(detailTarget)}>
                  <CheckCircle2 aria-hidden size={15} />Mark delivered
                </Button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(target)}
        title="Mark order delivered"
        body={<p>Mark order <strong>{target?.orderNumber}</strong> as delivered and COD collected? Update only after the courier/admin has confirmed delivery.</p>}
        confirmLabel="Mark delivered"
        cancelLabel="Keep pending"
        loading={Boolean(updatingId)}
        onCancel={() => setTarget(null)}
        onConfirm={markDelivered}
      />
      <ToastNotification message={toast} tone={toast.includes("Could not") ? "danger" : "success"} onClose={() => setToast("")} />
    </AdminShell>
  );
}
