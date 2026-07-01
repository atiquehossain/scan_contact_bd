"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock3, Eye, MessageSquareText, QrCode, Search, ShoppingBag, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, ErrorState, formatDate, LinkButton, StatusBadge, cx } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

type OwnerTag = {
  id: string;
  publicSlug: string;
  type: string;
  label: string;
  status: string;
  scanCount?: number | null;
  createdAt?: string | null;
  publicUrl?: string;
};

type Owner = {
  id: string;
  phone: string;
  fullName?: string | null;
  createdAt?: string | null;
  tagCount: number;
  contactRequestCount: number;
  unreadRequestCount: number;
  orderCount: number;
  pendingOrderCount: number;
  abuseReportCount?: number;
  latestRequestAt?: string | null;
  tags?: OwnerTag[];
};

const pageSize = 10;

function ownerStatus(owner: Owner) {
  if ((owner.abuseReportCount || 0) > 0) return { label: "Safety review", tone: "danger" as const };
  if (owner.unreadRequestCount || owner.pendingOrderCount) return { label: "Needs review", tone: "warning" as const };
  if (owner.tagCount > 0) return { label: "Current", tone: "success" as const };
  return { label: "No tags", tone: "neutral" as const };
}

function latestActivity(owner: Owner) {
  return owner.latestRequestAt || owner.createdAt || null;
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
  icon: typeof Users;
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

function OwnersSkeleton() {
  return (
    <div className="grid gap-5" role="status" aria-live="polite" aria-label="Loading owners">
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

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("latest");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ owners: Owner[] }>("/admin/owners");
      setOwners(data.owners);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load owners.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const result = owners
      .filter((owner) => !needle || owner.fullName?.toLowerCase().includes(needle) || owner.phone.includes(needle))
      .filter((owner) => {
        if (filter === "pending-cod") return owner.pendingOrderCount > 0;
        if (filter === "abuse") return (owner.abuseReportCount || 0) > 0;
        if (filter === "no-tags") return owner.tagCount === 0;
        return true;
      })
      .sort((a, b) => {
        if (sort === "qr") return b.tagCount - a.tagCount;
        if (sort === "text") return b.contactRequestCount - a.contactRequestCount;
        return new Date(latestActivity(b) || 0).getTime() - new Date(latestActivity(a) || 0).getTime();
      });
    return result;
  }, [owners, query, sort, filter]);

  const summary = useMemo(() => ({
    totalOwners: owners.length,
    totalTags: owners.reduce((sum, owner) => sum + owner.tagCount, 0),
    openItems: owners.reduce((sum, owner) => sum + owner.unreadRequestCount + owner.pendingOrderCount + (owner.abuseReportCount || 0), 0),
    pendingOrders: owners.reduce((sum, owner) => sum + owner.pendingOrderCount, 0)
  }), [owners]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, sort, filter]);

  return (
    <AdminShell>
      <div className="grid gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
              <a href="/admin/overview" className="font-bold text-[var(--color-primary)] hover:underline">Admin</a>
              <span aria-hidden>/</span>
              <span>Owners</span>
            </nav>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">Owner operations</p>
            <h1 className="mt-1 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">Owners</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              Search and review NoNumQR owners, tags, requests, and order activity.
            </p>
          </div>
          <LinkButton href="/admin/tags/new">Create QR Tag</LinkButton>
        </header>

        {loading ? <OwnersSkeleton /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}

        {!loading && !error ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Owner summary">
              <SummaryCard icon={Users} label="Owners" value={summary.totalOwners} detail="Owner accounts in this view" tone="info" />
              <SummaryCard icon={QrCode} label="QR tags" value={summary.totalTags} detail="Assigned active or inactive tags" tone="success" />
              <SummaryCard icon={AlertTriangle} label="Review items" value={summary.openItems} detail="Unread, pending, or safety items" tone={summary.openItems ? "warning" : "neutral"} />
              <SummaryCard icon={ShoppingBag} label="Pending COD" value={summary.pendingOrders} detail="Orders not yet completed" tone={summary.pendingOrders ? "warning" : "neutral"} />
            </section>

            <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
              <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
                <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="owner-search">
                  Search owners
                  <span className="relative">
                    <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                    <input
                      id="owner-search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search by owner name or phone"
                      className="focus-ring min-h-11 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] py-2.5 pl-10 pr-3 font-medium text-[var(--color-ink)] placeholder:text-slate-400"
                    />
                  </span>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="owner-sort">
                  Sort by
                  <select id="owner-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="focus-ring min-h-11 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-2.5 font-medium text-[var(--color-ink)]">
                    <option value="latest">Latest activity</option>
                    <option value="qr">QR count</option>
                    <option value="text">Submitted text count</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="owner-filter">
                  Filter
                  <select id="owner-filter" value={filter} onChange={(event) => setFilter(event.target.value)} className="focus-ring min-h-11 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-2.5 font-medium text-[var(--color-ink)]">
                    <option value="all">All owners</option>
                    <option value="pending-cod">Pending COD</option>
                    <option value="abuse">Has abuse reports</option>
                    <option value="no-tags">Owners with no tags</option>
                  </select>
                </label>
              </div>
            </section>

            {owners.length === 0 ? (
              <EmptyState title="No owners yet" body="Create a new QR tag to add the first owner." action={<LinkButton href="/admin/tags/new">Create QR Tag</LinkButton>} />
            ) : (
              <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-ink-strong)]">Owner directory</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{filtered.length} owner{filtered.length === 1 ? "" : "s"} match this view.</p>
                  </div>
                  <StatusBadge tone="info">Admin only</StatusBadge>
                </div>

                {visible.length === 0 ? <EmptyState title="No owners match this view" body="Change the search or filters to see owners." /> : null}

                {visible.length > 0 ? (
                  <>
                    <div className="hidden overflow-x-auto lg:block">
                      <table className="min-w-full text-left text-sm">
                        <thead className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                          <tr className="border-b border-[var(--color-border)]">
                            <th className="py-3 pr-4">Owner</th>
                            <th className="py-3 pr-4">Status</th>
                            <th className="py-3 pr-4">Tags</th>
                            <th className="py-3 pr-4">Requests</th>
                            <th className="py-3 pr-4">Orders</th>
                            <th className="py-3 pr-4">Last activity</th>
                            <th className="py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.map((owner) => {
                            const status = ownerStatus(owner);
                            return (
                              <tr key={owner.id} className="border-b border-slate-100 last:border-0">
                                <td className="py-4 pr-4">
                                  <p className="font-bold text-[var(--color-ink-strong)]">{owner.fullName || "Unnamed owner"}</p>
                                  <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">{owner.phone}</p>
                                </td>
                                <td className="py-4 pr-4"><StatusBadge tone={status.tone}>{status.label}</StatusBadge></td>
                                <td className="py-4 pr-4">
                                  <p className="font-bold text-[var(--color-ink)]">{owner.tagCount}</p>
                                  <p className="text-xs text-[var(--color-muted)]">QR tags</p>
                                </td>
                                <td className="py-4 pr-4">
                                  <p className="font-bold text-[var(--color-ink)]">{owner.contactRequestCount}</p>
                                  <p className="text-xs text-[var(--color-muted)]">{owner.unreadRequestCount} unread</p>
                                </td>
                                <td className="py-4 pr-4">
                                  <p className="font-bold text-[var(--color-ink)]">{owner.orderCount}</p>
                                  <p className="text-xs text-[var(--color-muted)]">{owner.pendingOrderCount} pending COD</p>
                                </td>
                                <td className="py-4 pr-4">
                                  <p className="font-semibold text-[var(--color-ink)]">{formatDate(latestActivity(owner))}</p>
                                  <p className="mt-1 text-xs text-[var(--color-muted)]">Created {formatDate(owner.createdAt)}</p>
                                </td>
                                <td className="py-4">
                                  <div className="flex flex-wrap gap-2">
                                    <LinkButton href={`/admin/owners/${owner.id}`} variant="secondary"><Eye aria-hidden size={15} />View owner</LinkButton>
                                    <LinkButton href={`/admin/owners/${owner.id}#qr-tags`} variant="ghost"><QrCode aria-hidden size={15} />Tags</LinkButton>
                                    <LinkButton href={`/admin/owners/${owner.id}#messages`} variant="ghost"><MessageSquareText aria-hidden size={15} />Requests</LinkButton>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid gap-3 lg:hidden">
                      {visible.map((owner) => {
                        const status = ownerStatus(owner);
                        return (
                          <article key={owner.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#fbfdfc] p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h2 className="font-bold text-[var(--color-ink-strong)]">{owner.fullName || "Unnamed owner"}</h2>
                                <p className="mt-1 text-sm text-[var(--color-muted)]">{owner.phone}</p>
                              </div>
                              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                              <span className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-2 font-bold">{owner.tagCount}<span className="block text-xs font-medium text-[var(--color-muted)]">Tags</span></span>
                              <span className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-2 font-bold">{owner.contactRequestCount}<span className="block text-xs font-medium text-[var(--color-muted)]">Requests</span></span>
                              <span className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-2 font-bold">{owner.orderCount}<span className="block text-xs font-medium text-[var(--color-muted)]">Orders</span></span>
                            </div>
                            <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]"><Clock3 aria-hidden className="h-3.5 w-3.5" />Last activity: {formatDate(latestActivity(owner))}</p>
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                              <LinkButton href={`/admin/owners/${owner.id}`} variant="secondary" className="w-full">View owner</LinkButton>
                              <LinkButton href={`/admin/owners/${owner.id}#qr-tags`} variant="ghost" className="w-full">View tags</LinkButton>
                            </div>
                          </article>
                        );
                      })}
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
                      <p className="text-sm font-medium text-[var(--color-muted)]">Page {page} of {totalPages}</p>
                      <div className="flex gap-2">
                        <button className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-2 text-sm font-bold disabled:opacity-50" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
                        <button className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-2 text-sm font-bold disabled:opacity-50" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
                      </div>
                    </div>
                  </>
                ) : null}
              </section>
            )}
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
