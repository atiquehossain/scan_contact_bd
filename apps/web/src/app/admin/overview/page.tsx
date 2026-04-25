"use client";

import { useEffect, useState } from "react";
import { FileWarning, Plus, ShoppingBag, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, ErrorState, LinkButton, LoadingState, MetricCard, PageHeader, Panel } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

type Metrics = {
  pendingOrders: number;
  codPending: number;
  abuseReports: number;
  contactRequests: number;
  resellerApplications: number;
  totalUsers: number;
  activeUsers: number;
  activeTags: number;
  totalScans: number;
  revenueBdt: number;
  societies: number;
};

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ metrics: Metrics }>("/admin/dashboard");
      setMetrics(data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load overview.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminShell>
      <PageHeader
        title="Operational overview"
        description="Monitor urgent admin work first, then passive totals. All numbers come from the live backend."
        action={<LinkButton href="/admin/tags/new"><Plus aria-hidden size={16} />Create New Tag</LinkButton>}
      />

      {loading ? <LoadingState label="Loading admin metrics..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error && metrics ? (
        <div className="grid gap-6">
          <section>
            <h2 className="mb-3 text-sm font-black uppercase text-[var(--color-muted)]">Needs attention</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <MetricCard href="/admin/orders" label="Pending orders" value={metrics.pendingOrders} tone={metrics.pendingOrders ? "warning" : "success"} detail="Orders waiting for action" />
              <MetricCard href="/admin/orders" label="COD pending" value={metrics.codPending} tone={metrics.codPending ? "warning" : "success"} detail="Cash collection pending" />
              <MetricCard href="/admin/reports" label="Abuse reports" value={metrics.abuseReports} tone={metrics.abuseReports ? "urgent" : "success"} detail="Open safety reports" />
              <MetricCard href="/admin/reports" label="Contact requests" value={metrics.contactRequests} tone="neutral" detail="Submitted scanner texts" />
              <MetricCard href="/admin/reports" label="Reseller applications" value={metrics.resellerApplications} tone={metrics.resellerApplications ? "warning" : "neutral"} detail="Applications to review" />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-black uppercase text-[var(--color-muted)]">System totals</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <MetricCard href="/admin/users" label="Total users" value={metrics.totalUsers} />
              <MetricCard href="/admin/users" label="Active users" value={metrics.activeUsers} />
              <MetricCard href="/admin/tags/new" label="Active QR tags" value={metrics.activeTags} />
              <MetricCard label="Total scans" value={metrics.totalScans} />
              <MetricCard href="/admin/orders" label="Revenue" value={`BDT ${metrics.revenueBdt || 0}`} />
              <MetricCard href="/admin/reports" label="Societies" value={metrics.societies} />
            </div>
          </section>

          <Panel title="Quick actions" description="Use these shortcuts for the most common admin tasks.">
            <div className="grid gap-3 md:grid-cols-4">
              <LinkButton href="/admin/tags/new"><Plus aria-hidden size={16} />Create New Tag</LinkButton>
              <LinkButton href="/admin/orders" variant="secondary"><ShoppingBag aria-hidden size={16} />View Pending Orders</LinkButton>
              <LinkButton href="/admin/reports" variant="secondary"><FileWarning aria-hidden size={16} />Review Abuse Reports</LinkButton>
              <LinkButton href="/admin/owners" variant="secondary"><Users aria-hidden size={16} />View Owners</LinkButton>
            </div>
          </Panel>

          {Object.values(metrics).every((value) => value === 0) ? (
            <EmptyState title="No operational data yet" body="Create the first QR tag to add an owner and begin receiving real scans, requests, and orders." action={<LinkButton href="/admin/tags/new">Create New Tag</LinkButton>} />
          ) : null}
        </div>
      ) : null}
    </AdminShell>
  );
}
