"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, MessageSquareText, QrCode, Search, ShoppingBag } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, ErrorState, formatDate, LinkButton, LoadingState, PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

type Owner = {
  id: string;
  phone: string;
  fullName?: string | null;
  tagCount: number;
  contactRequestCount: number;
  unreadRequestCount: number;
  orderCount: number;
  pendingOrderCount: number;
  abuseReportCount?: number;
  latestRequestAt?: string | null;
};

const pageSize = 10;

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
        return new Date(b.latestRequestAt || 0).getTime() - new Date(a.latestRequestAt || 0).getTime();
      });
    return result;
  }, [owners, query, sort, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, sort, filter]);

  return (
    <AdminShell>
      <PageHeader
        title="Owners"
        description="Manage owners created through admin QR assignment, inspect their tags, messages, and COD activity."
        breadcrumbs={[{ label: "Admin", href: "/admin/overview" }, { label: "Owners" }]}
        action={<LinkButton href="/admin/tags/new">Create New Tag</LinkButton>}
      />

      <Panel>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <label className="grid gap-2 text-sm font-bold" htmlFor="owner-search">
            Search owners
            <span className="relative">
              <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input id="owner-search" value={query} onChange={(event) => setQuery(event.target.value)} className="focus-ring w-full rounded-[var(--radius-button)] border border-[var(--color-border)] py-3 pl-10 pr-3 font-normal" />
            </span>
          </label>
          <label className="grid gap-2 text-sm font-bold" htmlFor="owner-sort">
            Sort by
            <select id="owner-sort" value={sort} onChange={(event) => setSort(event.target.value)} className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal">
              <option value="latest">Latest text time</option>
              <option value="qr">QR count</option>
              <option value="text">Submitted text count</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold" htmlFor="owner-filter">
            Filter
            <select id="owner-filter" value={filter} onChange={(event) => setFilter(event.target.value)} className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal">
              <option value="all">All owners</option>
              <option value="pending-cod">Pending COD</option>
              <option value="abuse">Has abuse reports</option>
              <option value="no-tags">Owners with no tags</option>
            </select>
          </label>
        </div>
      </Panel>

      <div className="mt-5">
        {loading ? <LoadingState label="Loading owners..." /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && owners.length === 0 ? (
          <EmptyState title="No owners yet." body="Create a new QR tag to add the first owner." action={<LinkButton href="/admin/tags/new">Create New Tag</LinkButton>} />
        ) : null}

        {!loading && !error && owners.length > 0 ? (
          <Panel>
            {visible.length === 0 ? <EmptyState title="No owners match this view" body="Change the search or filters to see owners." /> : null}
            {visible.length > 0 ? (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]">
                      <tr>
                        <th className="py-3 pr-3">Owner</th>
                        <th className="py-3 pr-3">QR</th>
                        <th className="py-3 pr-3">Text</th>
                        <th className="py-3 pr-3">Actions</th>
                        <th className="py-3 pr-3">COD</th>
                        <th className="py-3 pr-3">Latest text</th>
                        <th className="py-3 pr-3">Status</th>
                        <th className="py-3">Row actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {visible.map((owner) => (
                        <tr key={owner.id}>
                          <td className="py-4 pr-3"><p className="font-black">{owner.fullName || "Unnamed owner"}</p><p className="text-[var(--color-muted)]">{owner.phone}</p></td>
                          <td className="py-4 pr-3">{owner.tagCount}</td>
                          <td className="py-4 pr-3">{owner.contactRequestCount}</td>
                          <td className="py-4 pr-3">{owner.unreadRequestCount + owner.pendingOrderCount + (owner.abuseReportCount || 0)}</td>
                          <td className="py-4 pr-3">{owner.orderCount}</td>
                          <td className="py-4 pr-3">{formatDate(owner.latestRequestAt)}</td>
                          <td className="py-4 pr-3"><StatusBadge tone={owner.unreadRequestCount || owner.pendingOrderCount ? "warning" : "success"}>{owner.unreadRequestCount || owner.pendingOrderCount ? "Needs review" : "Current"}</StatusBadge></td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-2">
                              <LinkButton href={`/admin/owners/${owner.id}`} variant="secondary"><Eye aria-hidden size={15} />View owner</LinkButton>
                              <LinkButton href={`/admin/owners/${owner.id}#qr-tags`} variant="ghost"><QrCode aria-hidden size={15} />View tags</LinkButton>
                              <LinkButton href={`/admin/owners/${owner.id}#messages`} variant="ghost"><MessageSquareText aria-hidden size={15} />View messages</LinkButton>
                              <LinkButton href={`/admin/owners/${owner.id}#orders`} variant="ghost"><ShoppingBag aria-hidden size={15} />View COD orders</LinkButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 lg:hidden">
                  {visible.map((owner) => (
                    <article key={owner.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div><h2 className="font-black">{owner.fullName || "Unnamed owner"}</h2><p className="text-sm text-[var(--color-muted)]">{owner.phone}</p></div>
                        <StatusBadge tone={owner.unreadRequestCount || owner.pendingOrderCount ? "warning" : "success"}>{owner.unreadRequestCount || owner.pendingOrderCount ? "Review" : "Current"}</StatusBadge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                        <span className="rounded bg-[#f8fbf9] p-2 font-bold">{owner.tagCount} QR</span>
                        <span className="rounded bg-[#f8fbf9] p-2 font-bold">{owner.contactRequestCount} text</span>
                        <span className="rounded bg-[#f8fbf9] p-2 font-bold">{owner.orderCount} COD</span>
                      </div>
                      <div className="mt-3"><LinkButton href={`/admin/owners/${owner.id}`} variant="secondary" className="w-full">View owner</LinkButton></div>
                    </article>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-sm text-[var(--color-muted)]">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-2 text-sm font-bold disabled:opacity-50" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
                    <button className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-2 text-sm font-bold disabled:opacity-50" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</button>
                  </div>
                </div>
              </>
            ) : null}
          </Panel>
        ) : null}
      </div>
    </AdminShell>
  );
}
