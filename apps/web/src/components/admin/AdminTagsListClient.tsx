"use client";

import { type ComponentType, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Copy,
  ExternalLink,
  Filter,
  Plus,
  Power,
  PowerOff,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Tag as TagIcon,
  UserRound
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, EmptyState, ErrorState, InlineAlert, LinkButton, StatusBadge, cx, formatDate } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

type QrTagStatus = "DRAFT" | "PENDING_ACTIVATION" | "ACTIVE" | "DISABLED" | "LOST" | "TRANSFERRED" | "DELETED";

type AdminTagListOwner = {
  id: string;
  phone?: string | null;
  fullName?: string | null;
  email?: string | null;
};

type AdminTagListContactSetting = {
  allowContactForm?: boolean;
  allowWhatsapp?: boolean;
  allowSms?: boolean;
  phoneVisible?: boolean;
};

type AdminTagListItem = {
  id: string;
  publicSlug?: string | null;
  type?: string | null;
  label?: string | null;
  vehicleNumber?: string | null;
  itemName?: string | null;
  status?: QrTagStatus | string | null;
  privacyMode?: string | null;
  scanCount?: number | null;
  lastScannedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  owner?: AdminTagListOwner | null;
  contactSetting?: AdminTagListContactSetting | null;
};

type MetricTone = "neutral" | "success" | "warning" | "danger" | "info";
type SortOption = "newest" | "recently-scanned" | "most-scanned" | "label";

function humanize(value?: string | null) {
  if (!value) return "Not available";
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function statusTone(status?: string | null): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "ACTIVE") return "success";
  if (status === "DISABLED" || status === "LOST" || status === "DELETED") return "danger";
  if (status === "PENDING_ACTIVATION" || status === "DRAFT") return "warning";
  if (status === "TRANSFERRED") return "info";
  return "neutral";
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

function publicHref(tag: AdminTagListItem) {
  return tag.publicSlug ? `/t/${tag.publicSlug}` : "";
}

function ownerLabel(tag: AdminTagListItem) {
  return tag.owner?.fullName || tag.owner?.phone || "No owner";
}

function searchableText(tag: AdminTagListItem) {
  return [
    tag.label,
    tag.publicSlug,
    tag.id,
    tag.type,
    tag.vehicleNumber,
    tag.itemName,
    tag.status,
    tag.owner?.fullName,
    tag.owner?.phone,
    tag.owner?.email
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function sortDateValue(value?: string | null) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function MetricTile({
  label,
  value,
  detail,
  tone = "neutral",
  icon: Icon
}: {
  label: string;
  value: string | number;
  detail: string;
  tone?: MetricTone;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <span className={cx("grid h-9 w-9 place-items-center rounded-[var(--radius-button)] border", metricToneClasses(tone))}>
          <Icon aria-hidden className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-[28px] font-bold leading-9 tracking-[-0.02em] text-[var(--color-ink-strong)]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{detail}</p>
    </div>
  );
}

function TagsListSkeleton() {
  return (
    <div className="grid gap-6" role="status" aria-live="polite" aria-label="Loading tags">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-36 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-slate-200" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />
      </div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="h-9 w-9 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />
            <div className="mt-4 h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-36 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </section>
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
        <div className="grid gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-11 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />)}
        </div>
      </div>
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="grid gap-3 border-b border-slate-100 py-4 last:border-0 md:grid-cols-[1.2fr_0.6fr_0.7fr_0.8fr_0.7fr_0.8fr]">
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TagMobileCard({
  tag,
  actionLoadingId,
  onCopy,
  onStatusChange
}: {
  tag: AdminTagListItem;
  actionLoadingId: string;
  onCopy: (tag: AdminTagListItem) => void;
  onStatusChange: (tag: AdminTagListItem, status: "ACTIVE" | "DISABLED") => void;
}) {
  const href = publicHref(tag);
  const active = tag.status === "ACTIVE";
  return (
    <article className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href={`/admin/tags/${tag.id}`} className="focus-ring rounded text-base font-bold text-[var(--color-ink-strong)] hover:text-[var(--color-primary)]">
            {tag.label || tag.publicSlug || tag.id}
          </Link>
          <p className="mt-1 break-all text-xs font-semibold text-[var(--color-muted)]">{tag.publicSlug || tag.id}</p>
        </div>
        <StatusBadge tone={statusTone(tag.status)}>{humanize(tag.status)}</StatusBadge>
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        <div className="flex justify-between gap-3 border-t border-slate-100 pt-3">
          <dt className="text-[var(--color-muted)]">Owner</dt>
          <dd className="text-right font-bold text-[var(--color-ink)]">{ownerLabel(tag)}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-slate-100 pt-3">
          <dt className="text-[var(--color-muted)]">Scans</dt>
          <dd className="font-bold text-[var(--color-ink)]">{tag.scanCount ?? 0}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-slate-100 pt-3">
          <dt className="text-[var(--color-muted)]">Last activity</dt>
          <dd className="text-right font-bold text-[var(--color-ink)]">{tag.lastScannedAt ? formatDate(tag.lastScannedAt) : "None"}</dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-slate-100 pt-3">
          <dt className="text-[var(--color-muted)]">Created</dt>
          <dd className="text-right font-bold text-[var(--color-ink)]">{formatDate(tag.createdAt)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <LinkButton href={`/admin/tags/${tag.id}`} variant="secondary">
          View
          <ArrowRight aria-hidden size={16} />
        </LinkButton>
        {href ? (
          <>
            <Button type="button" variant="secondary" onClick={() => onCopy(tag)}>
              <Copy aria-hidden size={16} />
              Copy
            </Button>
            <a className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[#f8fbf9]" href={href} target="_blank" rel="noreferrer">
              <ExternalLink aria-hidden size={16} />
              Open
            </a>
          </>
        ) : null}
        <Button type="button" variant="secondary" loading={actionLoadingId === tag.id} onClick={() => onStatusChange(tag, active ? "DISABLED" : "ACTIVE")}>
          {active ? <PowerOff aria-hidden size={16} /> : <Power aria-hidden size={16} />}
          {active ? "Pause" : "Activate"}
        </Button>
      </div>
    </article>
  );
}

export function AdminTagsListClient() {
  const alertRef = useRef<HTMLDivElement>(null);
  const [tags, setTags] = useState<AdminTagListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  async function loadTags({ quiet = false }: { quiet?: boolean } = {}) {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ tags: AdminTagListItem[] }>("/admin/tags");
      setTags(Array.isArray(data.tags) ? data.tags : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tags.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadTags();
  }, []);

  const statusOptions = useMemo(() => Array.from(new Set(tags.map((tag) => tag.status).filter(Boolean))).sort() as string[], [tags]);
  const typeOptions = useMemo(() => Array.from(new Set(tags.map((tag) => tag.type).filter(Boolean))).sort() as string[], [tags]);

  const filteredTags = useMemo(() => {
    const query = search.trim().toLowerCase();
    const next = tags.filter((tag) => {
      const matchesSearch = query ? searchableText(tag).includes(query) : true;
      const matchesStatus = statusFilter === "ALL" ? true : tag.status === statusFilter;
      const matchesType = typeFilter === "ALL" ? true : tag.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

    return [...next].sort((left, right) => {
      if (sortBy === "most-scanned") return (right.scanCount ?? 0) - (left.scanCount ?? 0);
      if (sortBy === "recently-scanned") return sortDateValue(right.lastScannedAt) - sortDateValue(left.lastScannedAt);
      if (sortBy === "label") return (left.label || "").localeCompare(right.label || "");
      return sortDateValue(right.createdAt) - sortDateValue(left.createdAt);
    });
  }, [search, sortBy, statusFilter, tags, typeFilter]);

  const metrics = useMemo(() => {
    const active = tags.filter((tag) => tag.status === "ACTIVE").length;
    const paused = tags.filter((tag) => tag.status === "DISABLED" || tag.status === "PENDING_ACTIVATION" || tag.status === "DRAFT").length;
    const blocked = tags.filter((tag) => tag.status === "LOST" || tag.status === "DELETED").length;
    const scans = tags.reduce((total, tag) => total + (tag.scanCount ?? 0), 0);
    return { active, blocked, paused, scans, total: tags.length };
  }, [tags]);

  const hasFilters = Boolean(search.trim()) || statusFilter !== "ALL" || typeFilter !== "ALL" || sortBy !== "newest";

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setSortBy("newest");
  }

  function buildPublicUrl(tag: AdminTagListItem) {
    const href = publicHref(tag);
    if (!href) return "";
    return typeof window === "undefined" ? href : `${window.location.origin}${href}`;
  }

  async function copyPublicLink(tag: AdminTagListItem) {
    const url = buildPublicUrl(tag);
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setNotice(`Public link copied for ${tag.label || tag.publicSlug || "tag"}.`);
    window.setTimeout(() => alertRef.current?.focus(), 0);
  }

  async function updateStatus(tag: AdminTagListItem, status: "ACTIVE" | "DISABLED") {
    setActionLoadingId(tag.id);
    setNotice("");
    setError("");
    try {
      const data = await apiFetch<{ tag: AdminTagListItem }>(`/admin/tags/${tag.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      setTags((current) => current.map((item) => (item.id === tag.id ? { ...item, ...data.tag, owner: item.owner, contactSetting: item.contactSetting } : item)));
      setNotice(status === "ACTIVE" ? "Tag activated." : "Tag paused.");
      window.setTimeout(() => alertRef.current?.focus(), 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update tag.");
    } finally {
      setActionLoadingId("");
    }
  }

  if (loading) {
    return (
      <AdminShell>
        <TagsListSkeleton />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="grid gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
              <Link href="/admin/overview" className="font-bold text-[var(--color-primary)] hover:underline">Admin</Link>
              <span aria-hidden>/</span>
              <span>Tags</span>
            </nav>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">QR tag operations</p>
            <h1 className="mt-1 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">Tags</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">Manage QR/contact tags, scan status, and public access.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" loading={refreshing} onClick={() => loadTags({ quiet: true })}>
              <RefreshCw aria-hidden size={16} />
              Refresh
            </Button>
            <LinkButton href="/admin/tags/create">
              <Plus aria-hidden size={16} />
              Create tag
            </LinkButton>
          </div>
        </header>

        {notice ? (
          <div ref={alertRef} tabIndex={-1}>
            <InlineAlert tone="success">{notice}</InlineAlert>
          </div>
        ) : null}

        {error ? <ErrorState message={error} onRetry={() => loadTags()} /> : null}

        {!error ? (
          <>
            <InlineAlert tone="info" title="Loaded admin rows">
              This page uses the current admin list endpoint and filters the loaded rows in the browser. Counts below describe the returned list, not a separate global analytics endpoint.
            </InlineAlert>

            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricTile icon={TagIcon} label="Loaded tags" value={metrics.total} detail="Rows returned by /admin/tags" tone="info" />
              <MetricTile icon={ShieldCheck} label="Active shown" value={metrics.active} detail="Tags currently active in the loaded list" tone="success" />
              <MetricTile icon={PowerOff} label="Paused / draft shown" value={metrics.paused} detail="Disabled, pending, or draft rows returned" tone="warning" />
              <MetricTile icon={Activity} label="Shown scans" value={metrics.scans} detail="Scan count summed from loaded rows" tone={metrics.blocked ? "danger" : "neutral"} />
            </section>

            <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-ink-strong)]">Search and filters</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">Client-side controls for the loaded admin tag rows.</p>
                </div>
                {hasFilters ? (
                  <Button type="button" variant="ghost" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_0.75fr_0.75fr_0.85fr]">
                <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="tag-search">
                  Search tags
                  <span className="relative">
                    <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                    <input
                      id="tag-search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="focus-ring min-h-11 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-2.5 pl-10 text-sm font-medium text-[var(--color-ink)] placeholder:text-slate-400"
                      placeholder="Label, slug, owner, vehicle, ID"
                    />
                  </span>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="tag-status-filter">
                  Status
                  <select id="tag-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="focus-ring min-h-11 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-2.5 text-sm font-medium text-[var(--color-ink)]">
                    <option value="ALL">All statuses</option>
                    {statusOptions.map((status) => <option key={status} value={status}>{humanize(status)}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="tag-type-filter">
                  Type
                  <select id="tag-type-filter" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="focus-ring min-h-11 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-2.5 text-sm font-medium text-[var(--color-ink)]">
                    <option value="ALL">All types</option>
                    {typeOptions.map((type) => <option key={type} value={type}>{humanize(type)}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="tag-sort">
                  Sort
                  <select id="tag-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value as SortOption)} className="focus-ring min-h-11 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-2.5 text-sm font-medium text-[var(--color-ink)]">
                    <option value="newest">Newest created</option>
                    <option value="recently-scanned">Recently scanned</option>
                    <option value="most-scanned">Most scanned</option>
                    <option value="label">Label A-Z</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Filter aria-hidden className="h-4 w-4 text-[var(--color-primary)]" />
                    <h2 className="text-lg font-bold text-[var(--color-ink-strong)]">Tag records</h2>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                    Showing {filteredTags.length} of {tags.length} loaded tags.
                  </p>
                </div>
                <StatusBadge tone="info">Client-side list</StatusBadge>
              </div>

              {!tags.length ? (
                <div className="p-4">
                  <EmptyState
                    title="No tags yet"
                    body="Create your first tag to start using QR/contact routing."
                    action={<LinkButton href="/admin/tags/create">Create tag</LinkButton>}
                  />
                </div>
              ) : !filteredTags.length ? (
                <div className="p-4">
                  <EmptyState
                    title="No matching tags"
                    body="Try changing the search or filters."
                    action={<Button type="button" onClick={clearFilters}>Clear filters</Button>}
                  />
                </div>
              ) : (
                <>
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                        <tr className="border-b border-[var(--color-border)]">
                          <th className="px-4 py-3">Tag</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Scans</th>
                          <th className="px-4 py-3">Last activity</th>
                          <th className="px-4 py-3">Owner/contact</th>
                          <th className="px-4 py-3">Created</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTags.map((tag) => {
                          const href = publicHref(tag);
                          const active = tag.status === "ACTIVE";
                          return (
                            <tr key={tag.id} className="border-b border-slate-100 align-top last:border-0 hover:bg-[#f8fbf9]">
                              <td className="px-4 py-4">
                                <div className="flex items-start gap-3">
                                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-button)] border border-teal-100 bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                                    <QrCode aria-hidden className="h-4 w-4" />
                                  </span>
                                  <div className="min-w-0">
                                    <Link href={`/admin/tags/${tag.id}`} className="focus-ring rounded font-bold text-[var(--color-ink-strong)] hover:text-[var(--color-primary)]">
                                      {tag.label || tag.publicSlug || tag.id}
                                    </Link>
                                    <p className="mt-1 max-w-[260px] truncate text-xs font-semibold text-[var(--color-muted)]">{tag.publicSlug || tag.id}</p>
                                    <p className="mt-1 text-xs font-medium text-[var(--color-muted)]">{humanize(tag.type)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4"><StatusBadge tone={statusTone(tag.status)}>{humanize(tag.status)}</StatusBadge></td>
                              <td className="px-4 py-4 font-bold text-[var(--color-ink)]">{tag.scanCount ?? 0}</td>
                              <td className="px-4 py-4 text-[var(--color-muted)]">{tag.lastScannedAt ? formatDate(tag.lastScannedAt) : "None"}</td>
                              <td className="px-4 py-4">
                                <div className="flex items-start gap-2">
                                  <UserRound aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                                  <div className="min-w-0">
                                    <p className="font-bold text-[var(--color-ink)]">{ownerLabel(tag)}</p>
                                    <p className="mt-1 text-xs text-[var(--color-muted)]">{tag.contactSetting?.allowContactForm === false ? "Contact form off" : "Contact form on"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-[var(--color-muted)]">{formatDate(tag.createdAt)}</td>
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap justify-end gap-2">
                                  <LinkButton href={`/admin/tags/${tag.id}`} variant="secondary">View</LinkButton>
                                  {href ? (
                                    <>
                                      <Button type="button" variant="secondary" onClick={() => copyPublicLink(tag)} aria-label={`Copy public link for ${tag.label || tag.publicSlug || tag.id}`}>
                                        <Copy aria-hidden size={16} />
                                      </Button>
                                      <a className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[#f8fbf9]" href={href} target="_blank" rel="noreferrer" aria-label={`Open public page for ${tag.label || tag.publicSlug || tag.id}`}>
                                        <ExternalLink aria-hidden size={16} />
                                      </a>
                                    </>
                                  ) : null}
                                  <Button type="button" variant="secondary" loading={actionLoadingId === tag.id} onClick={() => updateStatus(tag, active ? "DISABLED" : "ACTIVE")} aria-label={`${active ? "Pause" : "Activate"} ${tag.label || tag.publicSlug || tag.id}`}>
                                    {active ? <PowerOff aria-hidden size={16} /> : <Power aria-hidden size={16} />}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-3 p-4 lg:hidden">
                    {filteredTags.map((tag) => (
                      <TagMobileCard
                        key={tag.id}
                        tag={tag}
                        actionLoadingId={actionLoadingId}
                        onCopy={copyPublicLink}
                        onStatusChange={updateStatus}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
