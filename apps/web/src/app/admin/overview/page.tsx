"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  BellRing,
  Building2,
  ClipboardList,
  FileWarning,
  HandCoins,
  MessageSquare,
  Plus,
  QrCode,
  ScanLine,
  ShoppingBag,
  UserCheck,
  Users
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, ErrorState, LinkButton, StatusBadge, cx, formatBdt } from "@/components/admin/ui";
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

type MetricTone = "neutral" | "success" | "warning" | "danger" | "info";

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-BD", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
}

function metricToneClasses(tone: MetricTone) {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-[var(--color-success-bg)] text-[var(--color-success-text)]";
    case "warning":
      return "border-amber-200 bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]";
    case "danger":
      return "border-red-200 bg-[var(--color-danger-bg)] text-[var(--color-danger)]";
    case "info":
      return "border-blue-200 bg-[var(--color-info-bg)] text-[var(--color-info)]";
    default:
      return "border-[var(--color-border)] bg-[#f8fbf9] text-[var(--color-muted)]";
  }
}

function DashboardMetricCard({
  label,
  value,
  detail,
  status,
  tone = "neutral",
  href,
  icon: Icon
}: {
  label: string;
  value: string | number;
  detail: string;
  status: string;
  tone?: MetricTone;
  href?: string;
  icon: LucideIcon;
}) {
  const card = (
    <div
      className={cx(
        "group h-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] transition",
        href && "hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cx("grid h-9 w-9 place-items-center rounded-[var(--radius-button)] border", metricToneClasses(tone))}>
          <Icon aria-hidden className="h-4 w-4" />
        </span>
        <span className={cx("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.04em]", metricToneClasses(tone))}>{status}</span>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-[28px] font-bold leading-9 tracking-[-0.02em] text-[var(--color-ink-strong)]">{value}</p>
      <p className="mt-2 text-xs font-medium leading-5 text-[var(--color-muted)]">{detail}</p>
    </div>
  );

  return href ? (
    <Link href={href} className="focus-ring block h-full rounded-[var(--radius-card)]">
      {card}
    </Link>
  ) : (
    card
  );
}

function SectionHeading({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{eyebrow}</p> : null}
        <h2 className="text-xl font-semibold leading-7 tracking-[-0.01em] text-[var(--color-ink-strong)]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function LoadingOverview() {
  const metricSkeletons = Array.from({ length: 11 }, (_, index) => index);
  return (
    <div className="grid gap-6" role="status" aria-live="polite" aria-label="Loading admin overview">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />
      </div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
        {metricSkeletons.map((item) => (
          <div key={item} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between">
              <div className="h-9 w-9 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />
              <div className="h-4 w-16 animate-pulse rounded-full bg-slate-200" />
            </div>
            <div className="mt-4 h-3 w-28 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-3 w-36 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </section>
      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="h-6 w-36 animate-pulse rounded bg-slate-200" />
          <div className="mt-5 space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="grid grid-cols-4 gap-3 border-t border-slate-100 pt-3">
                <div className="h-8 animate-pulse rounded bg-slate-200" />
                <div className="h-8 animate-pulse rounded bg-slate-200" />
                <div className="h-8 animate-pulse rounded bg-slate-200" />
                <div className="h-8 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="h-6 w-32 animate-pulse rounded bg-slate-200" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-14 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardQueuePanel({
  title,
  description,
  count,
  href,
  linkLabel,
  icon: Icon,
  tone = "neutral"
}: {
  title: string;
  description: string;
  count: number;
  href: string;
  linkLabel: string;
  icon: LucideIcon;
  tone?: "neutral" | "warning" | "danger" | "info";
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] p-4">
        <div className="flex items-start gap-3">
          <span className={cx("grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-button)] border", metricToneClasses(tone === "danger" ? "danger" : tone === "warning" ? "warning" : tone === "info" ? "info" : "neutral"))}>
            <Icon aria-hidden className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-[var(--color-ink-strong)]">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
          </div>
        </div>
        <StatusBadge tone={tone === "danger" ? "danger" : tone === "warning" ? "warning" : tone === "info" ? "info" : "neutral"}>{count} total</StatusBadge>
      </div>
      <div className="p-4">
        <div className="rounded-[var(--radius-button)] border border-dashed border-[var(--color-border)] bg-[#f8fbf9] p-4">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Detailed rows are available in the dedicated queue.</p>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">This overview endpoint currently provides summary counts only, so individual records are kept in their existing admin screens.</p>
          <Link href={href} className="focus-ring mt-3 inline-flex items-center gap-2 rounded-[var(--radius-button)] text-sm font-bold text-[var(--color-primary)] hover:underline">
            {linkLabel}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function QuickActionCard({ href, title, body, icon: Icon, tone = "neutral" }: { href: string; title: string; body: string; icon: LucideIcon; tone?: MetricTone }) {
  return (
    <Link href={href} className="focus-ring group flex min-h-[92px] items-center justify-between gap-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
      <span className="flex items-center gap-3">
        <span className={cx("grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-button)] border", metricToneClasses(tone))}>
          <Icon aria-hidden className="h-4 w-4" />
        </span>
        <span>
          <span className="block text-sm font-bold text-[var(--color-ink-strong)]">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-[var(--color-muted)]">{body}</span>
        </span>
      </span>
      <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-[var(--color-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]" />
    </Link>
  );
}

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
      {loading ? <LoadingOverview /> : null}
      {error ? (
        <div className="grid gap-5">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">Overview</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">Monitor NoNumQR orders, tags, reports, owners, and platform activity.</p>
            </div>
            <LinkButton href="/admin/tags/new">
              <Plus aria-hidden size={16} />
              Create QR Tag
            </LinkButton>
          </header>
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : null}

      {!loading && !error && metrics ? (
        <div className="grid gap-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">NoNumQR Admin</p>
              <h1 className="mt-1 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">Overview</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">Monitor NoNumQR orders, tags, reports, owners, and platform activity.</p>
            </div>
            <LinkButton href="/admin/tags/new" className="shrink-0">
              <Plus aria-hidden size={16} />
              Create QR Tag
            </LinkButton>
          </header>

          <section>
            <SectionHeading title="Needs attention" eyebrow="Live queues" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <DashboardMetricCard href="/admin/orders" icon={ShoppingBag} label="Pending orders" value={formatCompactNumber(metrics.pendingOrders)} tone={metrics.pendingOrders ? "warning" : "success"} status={metrics.pendingOrders ? "Action" : "Clear"} detail="Orders waiting for admin action" />
              <DashboardMetricCard href="/admin/orders" icon={HandCoins} label="COD pending" value={formatCompactNumber(metrics.codPending)} tone={metrics.codPending ? "warning" : "success"} status={metrics.codPending ? "Pending" : "Clear"} detail="Cash collection still pending" />
              <DashboardMetricCard href="/admin/reports" icon={FileWarning} label="Abuse reports" value={formatCompactNumber(metrics.abuseReports)} tone={metrics.abuseReports ? "danger" : "success"} status={metrics.abuseReports ? "Urgent" : "Clear"} detail="Open safety reports" />
              <DashboardMetricCard href="/admin/reports" icon={MessageSquare} label="Contact requests" value={formatCompactNumber(metrics.contactRequests)} tone="info" status="Scanner" detail="Private scanner messages submitted" />
              <DashboardMetricCard href="/admin/reports" icon={BellRing} label="Reseller applications" value={formatCompactNumber(metrics.resellerApplications)} tone={metrics.resellerApplications ? "warning" : "neutral"} status={metrics.resellerApplications ? "Review" : "Quiet"} detail="Applications waiting for review" />
            </div>
          </section>

          <section>
            <SectionHeading title="System totals" eyebrow="Platform health" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <DashboardMetricCard href="/admin/users" icon={Users} label="Total users" value={formatCompactNumber(metrics.totalUsers)} tone="neutral" status="Users" detail="All non-deleted accounts" />
              <DashboardMetricCard href="/admin/users" icon={UserCheck} label="Active users" value={formatCompactNumber(metrics.activeUsers)} tone="success" status="Active" detail="Currently active accounts" />
              <DashboardMetricCard href="/admin/tags/new" icon={QrCode} label="Active QR tags" value={formatCompactNumber(metrics.activeTags)} tone="success" status="Tags" detail="Live NoNumQR tags" />
              <DashboardMetricCard icon={ScanLine} label="Total scans" value={formatCompactNumber(metrics.totalScans)} tone="info" status="Scans" detail="Recorded public QR visits" />
              <DashboardMetricCard href="/admin/orders" icon={Banknote} label="Revenue" value={formatBdt(metrics.revenueBdt)} tone="success" status="Collected" detail="Paid and COD-collected total" />
              <DashboardMetricCard href="/admin/reports" icon={Building2} label="Societies" value={formatCompactNumber(metrics.societies)} tone="neutral" status="Society" detail="Registered society records" />
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
            <div className="grid gap-4">
              <DashboardQueuePanel
                title="Recent orders"
                description="Track pending and recently processed buyer orders from the dedicated orders workspace."
                count={metrics.pendingOrders}
                href="/admin/orders"
                linkLabel="View orders"
                icon={ClipboardList}
                tone={metrics.pendingOrders ? "warning" : "neutral"}
              />
              <div className="grid gap-4 lg:grid-cols-2">
                <DashboardQueuePanel
                  title="Recent abuse reports"
                  description="Review misuse reports and keep public scanner flows safe."
                  count={metrics.abuseReports}
                  href="/admin/reports"
                  linkLabel="Review reports"
                  icon={AlertTriangle}
                  tone={metrics.abuseReports ? "danger" : "neutral"}
                />
                <DashboardQueuePanel
                  title="Recent contact requests"
                  description="Monitor private scanner messages without exposing owner phone numbers."
                  count={metrics.contactRequests}
                  href="/admin/reports"
                  linkLabel="Open reports"
                  icon={MessageSquare}
                  tone="info"
                />
              </div>
            </div>

            <section>
              <SectionHeading title="Quick actions" eyebrow="Shortcuts" />
              <div className="grid gap-3">
                <QuickActionCard href="/admin/tags/new" icon={Plus} title="Create QR tag" body="Assign a new NoNumQR tag to an owner." tone="success" />
                <QuickActionCard href="/admin/orders" icon={ShoppingBag} title="View orders" body="Process buyer orders and COD status." tone={metrics.pendingOrders ? "warning" : "neutral"} />
                <QuickActionCard href="/admin/reports" icon={FileWarning} title="View reports" body="Review abuse reports and contact activity." tone={metrics.abuseReports ? "danger" : "info"} />
                <QuickActionCard href="/admin/owners" icon={Users} title="View owners" body="Manage owner records and assigned tags." tone="neutral" />
              </div>
              <div className="mt-4 rounded-[var(--radius-card)] border border-teal-200 bg-[var(--color-primary-soft)] p-4">
                <div className="flex items-start gap-3">
                  <Activity aria-hidden className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
                  <div>
                    <p className="text-sm font-bold text-[var(--color-ink-strong)]">Live backend metrics</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-primary-hover)]">Dashboard cards use the existing `/admin/dashboard` response and update when the page refreshes.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {Object.values(metrics).every((value) => value === 0) ? (
            <EmptyState title="No operational data yet" body="Create the first QR tag to add an owner and begin receiving real scans, requests, and orders." action={<LinkButton href="/admin/tags/new">Create New Tag</LinkButton>} />
          ) : null}
        </div>
      ) : null}
    </AdminShell>
  );
}
