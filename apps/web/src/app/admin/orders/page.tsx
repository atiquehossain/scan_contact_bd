"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, ConfirmDialog, EmptyState, ErrorState, formatBdt, formatDate, LoadingState, PageHeader, Panel, StatusBadge, ToastNotification } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [target, setTarget] = useState<any>(null);
  const [updatingId, setUpdatingId] = useState("");
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ orders: any[] }>("/admin/orders");
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

  async function markDelivered() {
    if (!target) return;
    setUpdatingId(target.id);
    try {
      const data = await apiFetch<{ order: any }>(`/admin/orders/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "DELIVERED", paymentStatus: "COD_COLLECTED" })
      });
      setOrders((items) => items.map((item) => item.id === target.id ? data.order : item));
      setToast("Order marked as delivered.");
      setTarget(null);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not update order.");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <AdminShell>
      <PageHeader title="Orders" description="Process real COD orders and update delivery/COD collection status." breadcrumbs={[{ label: "Admin", href: "/admin/overview" }, { label: "Orders" }]} />

      {loading ? <LoadingState label="Loading orders..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && orders.length === 0 ? <EmptyState title="No orders yet" body="COD orders will appear here after owners place real orders from the owner app." /> : null}
      {!loading && !error && orders.length > 0 ? (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]">
                <tr>
                  <th className="py-3 pr-3">Order number</th>
                  <th className="py-3 pr-3">Customer/user</th>
                  <th className="py-3 pr-3">Total</th>
                  <th className="py-3 pr-3">Order status</th>
                  <th className="py-3 pr-3">COD status</th>
                  <th className="py-3 pr-3">Created</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {orders.map((order) => {
                  const delivered = order.status === "DELIVERED" && order.paymentStatus === "COD_COLLECTED";
                  return (
                    <tr key={order.id}>
                      <td className="py-4 pr-3 font-black">{order.orderNumber}</td>
                      <td className="py-4 pr-3"><p className="font-bold">{order.customerName}</p><p className="text-[var(--color-muted)]">{order.customerPhone}</p></td>
                      <td className="py-4 pr-3 font-black">{formatBdt(order.totalBdt)}</td>
                      <td className="py-4 pr-3"><StatusBadge tone={delivered ? "success" : "warning"}>{order.status}</StatusBadge></td>
                      <td className="py-4 pr-3"><StatusBadge tone={order.paymentStatus === "COD_COLLECTED" ? "success" : "warning"}>{order.paymentStatus}</StatusBadge></td>
                      <td className="py-4 pr-3">{formatDate(order.createdAt)}</td>
                      <td className="py-4">
                        {delivered ? <StatusBadge tone="success">Completed</StatusBadge> : (
                          <Button loading={updatingId === order.id} onClick={() => setTarget(order)}>
                            <CheckCircle2 aria-hidden size={15} />Mark delivered
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
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
