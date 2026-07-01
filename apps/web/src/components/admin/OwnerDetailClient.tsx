"use client";

import { type ComponentType, type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { Activity, ArrowLeft, CalendarClock, ExternalLink, MessageSquareText, PackageCheck, QrCode, ShoppingBag, UserRound } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, ErrorState, formatBdt, formatDate, InlineAlert, LinkButton, StatusBadge, cx } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

type OwnerProfile = {
  id: string;
  phone: string;
  fullName?: string | null;
  createdAt?: string | null;
};

type OwnerTag = {
  id: string;
  publicSlug: string;
  publicUrl: string;
  type: string;
  label: string;
  status: string;
  scanCount?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type OwnerOrder = {
  id: string;
  orderNumber?: string | null;
  trackingCode?: string | null;
  status?: string | null;
  paymentStatus?: string | null;
  totalBdt?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  items?: Array<{ id?: string; productName?: string | null; name?: string | null; quantity?: number | null }>;
};

type ConversationMessage = {
  id: string;
  sender?: string | null;
  body?: string | null;
  createdAt?: string | null;
};

type ContactRequest = {
  id: string;
  reason?: string | null;
  message?: string | null;
  scannerName?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  qrTag?: Pick<OwnerTag, "id" | "publicSlug" | "type" | "label" | "status"> | null;
  messages?: ConversationMessage[];
};

type OwnerDetailResponse = {
  owner: OwnerProfile;
  tags: OwnerTag[];
  orders: OwnerOrder[];
  requests: ContactRequest[];
};

function actualSegmentFromPath(pathname: string, fallback?: string) {
  const value = pathname.split("/").filter(Boolean).pop() || fallback || "";
  return value.startsWith("__") ? fallback || "" : decodeURIComponent(value);
}

function humanize(value?: string | null) {
  if (!value) return "Not available";
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function statusTone(status?: string | null): "neutral" | "success" | "warning" | "danger" | "info" {
  if (!status) return "neutral";
  if (["ACTIVE", "DELIVERED", "RESOLVED", "CLOSED", "COD_COLLECTED"].includes(status)) return "success";
  if (["OPEN", "PENDING", "PENDING_ACTIVATION", "PROCESSING", "CONFIRMED", "OUT_FOR_DELIVERY", "COD_PENDING", "DRAFT"].includes(status)) return "warning";
  if (["DISABLED", "LOST", "DELETED", "CANCELLED", "RETURNED", "EXPIRED"].includes(status)) return "danger";
  return "neutral";
}

function DetailCard({ title, description, action, children, id }: { title: string; description?: string; action?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-ink-strong)]">{title}</h2>
          {description ? <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-1 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-3 text-sm">
      <dt className="font-semibold text-[var(--color-muted)]">{label}</dt>
      <dd className="min-w-0 break-words font-bold text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}

function MetricTile({
  label,
  value,
  detail,
  tone = "neutral",
  icon: Icon
}: {
  label: string;
  value: ReactNode;
  detail: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
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
      <span
        className={cx(
          "grid h-9 w-9 place-items-center rounded-[var(--radius-button)] border",
          tone === "success" && "border-emerald-200 bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
          tone === "warning" && "border-amber-200 bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
          tone === "danger" && "border-red-200 bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
          tone === "info" && "border-blue-200 bg-[var(--color-info-soft)] text-[var(--color-info)]",
          tone === "neutral" && "border-[var(--color-border)] bg-[#f8fbf9] text-[var(--color-muted)]"
        )}
      >
        <Icon aria-hidden className="h-4 w-4" />
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{label}</p>
      <div className="mt-1 text-xl font-bold leading-7 text-[var(--color-ink-strong)]">{value}</div>
      <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{detail}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6" role="status" aria-live="polite" aria-label="Loading owner detail">
      <div className="space-y-2">
        <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-72 max-w-full animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="h-9 w-9 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />
            <div className="mt-4 h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-6 w-20 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
        <div className="h-72 animate-pulse rounded-[var(--radius-card)] bg-slate-200" />
        <div className="h-72 animate-pulse rounded-[var(--radius-card)] bg-slate-200" />
      </div>
    </div>
  );
}

export function OwnerDetailClient() {
  const params = useParams<{ ownerId: string }>();
  const pathname = usePathname();
  const routeOwnerId = Array.isArray(params.ownerId) ? params.ownerId[0] : params.ownerId;
  const ownerId = actualSegmentFromPath(pathname, routeOwnerId);
  const [data, setData] = useState<OwnerDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<OwnerDetailResponse>(`/admin/owners/${ownerId}`);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load owner.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ownerId) load();
  }, [ownerId]);

  const latestActivity = useMemo(() => {
    const dates = [
      ...(data?.tags || []).map((tag) => tag.updatedAt || tag.createdAt),
      ...(data?.requests || []).map((request) => request.updatedAt || request.createdAt),
      ...(data?.orders || []).map((order) => order.updatedAt || order.createdAt)
    ].filter(Boolean) as string[];
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  }, [data]);

  const activityItems = useMemo(() => {
    if (!data) return [];
    return [
      ...data.tags.map((tag) => ({ id: `tag-${tag.id}`, kind: "QR tag", title: tag.label, detail: `${humanize(tag.type)} · ${humanize(tag.status)}`, at: tag.updatedAt || tag.createdAt, href: `/admin/tags/${tag.id}` })),
      ...data.requests.map((request) => ({ id: `request-${request.id}`, kind: "Request", title: humanize(request.reason), detail: humanize(request.status), at: request.updatedAt || request.createdAt, href: "#messages" })),
      ...data.orders.map((order) => ({ id: `order-${order.id}`, kind: "Order", title: order.orderNumber || order.trackingCode || "COD order", detail: humanize(order.status), at: order.updatedAt || order.createdAt, href: "/admin/orders" }))
    ]
      .filter((item) => item.at)
      .sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime())
      .slice(0, 8);
  }, [data]);

  const notFound = !loading && error.toLowerCase().includes("owner not found");

  return (
    <AdminShell>
      {loading ? <DetailSkeleton /> : null}

      {!loading && error && !notFound ? (
        <div className="grid gap-5">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">Owner operations</p>
              <h1 className="mt-1 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">Owner Detail</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">Inspect one owner and related operational records.</p>
            </div>
            <LinkButton href="/admin/owners" variant="secondary"><ArrowLeft aria-hidden size={16} />Back to owners</LinkButton>
          </header>
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : null}

      {notFound ? (
        <div className="grid gap-5">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">Owner operations</p>
              <h1 className="mt-1 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">Owner not found</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">This owner may have been deleted or your admin role may not have access.</p>
            </div>
            <LinkButton href="/admin/owners" variant="secondary"><ArrowLeft aria-hidden size={16} />Back to owners</LinkButton>
          </header>
          <EmptyState title="Owner not found" body="This owner may have been deleted or your admin role may not have access to it." action={<LinkButton href="/admin/owners">View owners</LinkButton>} />
        </div>
      ) : null}

      {!loading && !error && data ? (
        <div className="grid gap-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
                <Link href="/admin/overview" className="font-bold text-[var(--color-primary)] hover:underline">Admin</Link>
                <span aria-hidden>/</span>
                <Link href="/admin/owners" className="font-bold text-[var(--color-primary)] hover:underline">Owners</Link>
                <span aria-hidden>/</span>
                <span>{data.owner.fullName || "Owner detail"}</span>
              </nav>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">Owner operations</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">{data.owner.fullName || "Owner Detail"}</h1>
                <StatusBadge tone={data.tags.length ? "success" : "neutral"}>{data.tags.length ? "Owner with tags" : "No tags"}</StatusBadge>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">Inspect owner profile, QR tags, COD orders, scanner requests, and operational activity.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LinkButton href="/admin/owners" variant="secondary"><ArrowLeft aria-hidden size={16} />Back to owners</LinkButton>
              <LinkButton href="/admin/tags/new">Create QR Tag</LinkButton>
            </div>
          </header>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Owner metrics">
            <MetricTile icon={QrCode} label="QR tags" value={data.tags.length} detail="Tags assigned to this owner" tone={data.tags.length ? "success" : "neutral"} />
            <MetricTile icon={MessageSquareText} label="Contact requests" value={data.requests.length} detail="Scanner messages and conversations" tone={data.requests.length ? "warning" : "neutral"} />
            <MetricTile icon={ShoppingBag} label="Orders" value={data.orders.length} detail="COD order records linked here" tone={data.orders.length ? "info" : "neutral"} />
            <MetricTile icon={CalendarClock} label="Latest activity" value={latestActivity ? formatDate(latestActivity) : "None"} detail="Latest tag, request, or order update" tone={latestActivity ? "success" : "neutral"} />
          </section>

          <InlineAlert tone="info" title="Admin-only privacy boundary">
            Owner details are visible only inside NoNumQR Admin. Public QR pages keep phone numbers hidden by default.
          </InlineAlert>

          <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
            <div className="grid content-start gap-5">
              <DetailCard title="Owner profile" description="Admin identity and support context returned by the owner detail endpoint.">
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[var(--radius-card)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <UserRound aria-hidden className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-[var(--color-ink-strong)]">{data.owner.fullName || "Unnamed owner"}</p>
                    <p className="mt-1 break-all text-sm font-semibold text-[var(--color-muted)]">{data.owner.phone}</p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3">
                  <InfoRow label="Owner ID" value={data.owner.id} />
                  <InfoRow label="Phone / login identity" value={data.owner.phone} />
                  <InfoRow label="Created" value={formatDate(data.owner.createdAt)} />
                  <InfoRow label="Latest activity" value={latestActivity ? formatDate(latestActivity) : "None"} />
                </dl>
              </DetailCard>

              <DetailCard title="Quick navigation" description="Jump to related owner records.">
                <div className="grid gap-2">
                  <a href="#qr-tags" className="focus-ring flex min-h-10 items-center justify-between rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[#f8fbf9]">QR tags <span>{data.tags.length}</span></a>
                  <a href="#orders" className="focus-ring flex min-h-10 items-center justify-between rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[#f8fbf9]">Orders <span>{data.orders.length}</span></a>
                  <a href="#messages" className="focus-ring flex min-h-10 items-center justify-between rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[#f8fbf9]">Contact requests <span>{data.requests.length}</span></a>
                  <a href="#activity" className="focus-ring flex min-h-10 items-center justify-between rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[#f8fbf9]">Alerts/activity <span>{activityItems.length}</span></a>
                </div>
              </DetailCard>
            </div>

            <div className="grid gap-5">
              <DetailCard id="qr-tags" title="QR tags" description="Assigned QR tags and public pages for this owner.">
                {data.tags.length === 0 ? <EmptyState title="No QR tags" body="This owner does not have any assigned QR tags yet." /> : null}
                <div className="grid gap-3 md:grid-cols-2">
                  {data.tags.map((tag) => (
                    <article key={tag.id} className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-4 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-[var(--color-ink-strong)]">{tag.label}</h3>
                          <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">{humanize(tag.type)}</p>
                        </div>
                        <StatusBadge tone={statusTone(tag.status)}>{humanize(tag.status)}</StatusBadge>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-2">
                        <InfoRow label="Scan count" value={tag.scanCount || 0} />
                        <InfoRow label="Created" value={formatDate(tag.createdAt)} />
                      </dl>
                      <p className="mt-3 break-all rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-2 text-xs font-semibold text-[var(--color-muted)]">{tag.publicUrl}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <LinkButton href={`/admin/tags/${tag.id}`} variant="secondary">Open tag detail</LinkButton>
                        <a href={`/t/${tag.publicSlug}`} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-button)] px-3 py-2 text-sm font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]">
                          <ExternalLink aria-hidden size={15} />Public page
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </DetailCard>

              <DetailCard id="orders" title="Orders" description="COD order records linked to this owner." action={<LinkButton href="/admin/orders" variant="secondary">View all orders</LinkButton>}>
                {data.orders.length === 0 ? <EmptyState title="No COD orders" body="Orders linked to this owner will appear here." /> : null}
                <div className="grid gap-3">
                  {data.orders.map((order) => (
                    <article key={order.id} className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-4 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-[var(--color-ink-strong)]">{order.orderNumber || order.trackingCode || "COD order"}</h3>
                          <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">{formatDate(order.createdAt)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge tone={statusTone(order.status)}>{humanize(order.status)}</StatusBadge>
                          <StatusBadge tone={statusTone(order.paymentStatus)}>{humanize(order.paymentStatus)}</StatusBadge>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-lg font-bold text-[var(--color-ink-strong)]">{formatBdt(order.totalBdt)}</p>
                        <p className="text-xs font-semibold text-[var(--color-muted)]">{order.items?.length || 0} item{order.items?.length === 1 ? "" : "s"}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </DetailCard>

              <DetailCard id="messages" title="Contact requests" description="Scanner messages and token-protected conversation records.">
                <InlineAlert tone="info">
                  Admins can inspect messages for support and safety. Replies are handled by the owner app.
                </InlineAlert>
                {data.requests.length === 0 ? <div className="mt-4"><EmptyState title="No contact requests" body="Scanner messages will appear here after someone submits the public QR form." /></div> : null}
                <div className="mt-4 grid gap-3">
                  {data.requests.map((request) => (
                    <article key={request.id} className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-4 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-[var(--color-ink-strong)]">{humanize(request.reason)}</h3>
                          <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">{request.qrTag?.label || "QR tag"} · {formatDate(request.createdAt)}</p>
                        </div>
                        <StatusBadge tone={statusTone(request.status)}>{humanize(request.status)}</StatusBadge>
                      </div>
                      {request.scannerName ? <p className="mt-3 font-bold text-[var(--color-ink)]">Scanner: {request.scannerName}</p> : null}
                      <p className="mt-2 whitespace-pre-wrap rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-3 text-[var(--color-muted)]">{request.message || "No message text provided."}</p>
                      {request.qrTag?.id ? <Link href={`/admin/tags/${request.qrTag.id}`} className="mt-3 inline-flex text-sm font-bold text-[var(--color-primary)] hover:underline">Open related tag</Link> : null}
                      {request.messages?.length ? (
                        <div className="mt-3 grid gap-2">
                          {request.messages.map((message) => (
                            <div key={message.id} className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-3">
                              <p className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">{message.sender === "OWNER" ? "Owner reply" : "Scanner text"}</p>
                              <p className="mt-1 whitespace-pre-wrap text-[var(--color-ink)]">{message.body || "No message body."}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              </DetailCard>

              <DetailCard id="activity" title="Alerts/activity" description="Recent owner-related activity derived from returned tags, requests, and orders.">
                {activityItems.length === 0 ? <EmptyState title="No activity yet" body="No tag, request, order, alert, or activity rows are available for this owner yet." /> : null}
                <div className="grid gap-3">
                  {activityItems.map((item) => (
                    <a key={item.id} href={item.href} className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-3 text-sm hover:bg-white">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-button)] border border-teal-100 bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                            {item.kind === "QR tag" ? <QrCode aria-hidden className="h-4 w-4" /> : item.kind === "Order" ? <PackageCheck aria-hidden className="h-4 w-4" /> : <Activity aria-hidden className="h-4 w-4" />}
                          </span>
                          <div>
                            <p className="font-bold text-[var(--color-ink-strong)]">{item.title}</p>
                            <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">{item.kind} · {item.detail}</p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-[var(--color-muted)]">{formatDate(item.at)}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </DetailCard>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
