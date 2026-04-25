"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, ErrorState, formatBdt, formatDate, InlineAlert, LinkButton, LoadingState, MetricCard, PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

export default function OwnerDetailPage() {
  const params = useParams<{ ownerId: string }>();
  const ownerId = Array.isArray(params.ownerId) ? params.ownerId[0] : params.ownerId;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<any>(`/admin/owners/${ownerId}`);
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
      ...(data?.tags || []).map((tag: any) => tag.updatedAt || tag.createdAt),
      ...(data?.requests || []).map((request: any) => request.updatedAt || request.createdAt),
      ...(data?.orders || []).map((order: any) => order.updatedAt || order.createdAt)
    ].filter(Boolean);
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  }, [data]);

  return (
    <AdminShell>
      <PageHeader
        title={data?.owner?.fullName || "Owner detail"}
        description="Read-only support and safety inspection for owner QR tags, scanner text, and COD orders."
        breadcrumbs={[{ label: "Admin", href: "/admin/overview" }, { label: "Owners", href: "/admin/owners" }, { label: data?.owner?.fullName || "Owner detail" }]}
        action={<LinkButton href="/admin/tags/new">Create New Tag</LinkButton>}
      />

      {loading ? <LoadingState label="Loading owner detail..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}

      {!loading && !error && data ? (
        <div className="grid gap-6">
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard label="QR count" value={data.tags.length} />
            <MetricCard label="Submitted text" value={data.requests.length} />
            <MetricCard label="COD orders" value={data.orders.length} />
            <MetricCard label="Latest activity" value={latestActivity ? formatDate(latestActivity) : "None"} />
          </section>

          <Panel title="Owner summary">
            <dl className="grid gap-4 text-sm md:grid-cols-2">
              <div><dt className="font-bold text-[var(--color-muted)]">Owner name</dt><dd className="mt-1 font-black">{data.owner.fullName || "Unnamed owner"}</dd></div>
              <div><dt className="font-bold text-[var(--color-muted)]">Owner phone</dt><dd className="mt-1 font-black">{data.owner.phone}</dd></div>
              <div><dt className="font-bold text-[var(--color-muted)]">Created</dt><dd className="mt-1 font-black">{formatDate(data.owner.createdAt)}</dd></div>
              <div><dt className="font-bold text-[var(--color-muted)]">Latest activity</dt><dd className="mt-1 font-black">{latestActivity ? formatDate(latestActivity) : "None"}</dd></div>
            </dl>
          </Panel>

          <section id="qr-tags">
            <Panel title="QR Tags">
              {data.tags.length === 0 ? <EmptyState title="No QR tags" body="This owner does not have any assigned QR tags yet." /> : null}
              <div className="grid gap-3 md:grid-cols-2">
                {data.tags.map((tag: any) => (
                  <article key={tag.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div><h3 className="font-black">{tag.label}</h3><p className="text-[var(--color-muted)]">{tag.type}</p></div>
                      <StatusBadge tone={tag.status === "ACTIVE" ? "success" : "warning"}>{tag.status}</StatusBadge>
                    </div>
                    <p className="mt-3 break-all rounded bg-[#f8fbf9] p-2 text-xs font-bold">{tag.publicUrl}</p>
                    <dl className="mt-3 grid grid-cols-2 gap-2">
                      <div><dt className="text-[var(--color-muted)]">Scans</dt><dd className="font-black">{tag.scanCount || 0}</dd></div>
                      <div><dt className="text-[var(--color-muted)]">Created</dt><dd className="font-black">{formatDate(tag.createdAt)}</dd></div>
                    </dl>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <LinkButton href={`/admin/tags/${tag.id}`} variant="secondary">Open tag detail</LinkButton>
                      <a href={`/t/${tag.publicSlug}`} target="_blank" rel="noreferrer" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-button)] px-3 py-2 text-sm font-bold text-[var(--color-primary)]">
                        <ExternalLink aria-hidden size={15} />Public page
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </Panel>
          </section>

          <section id="messages">
            <Panel title="Submitted Scanner Text">
              <InlineAlert tone="info">
                Admins can inspect messages for support and safety. Replies are handled only by the owner app.
              </InlineAlert>
              {data.requests.length === 0 ? <div className="mt-4"><EmptyState title="No submitted text" body="Scanner messages will appear here after someone submits the public QR form." /></div> : null}
              <div className="mt-4 space-y-3">
                {data.requests.map((request: any) => (
                  <article key={request.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><h3 className="font-black">{request.reason}</h3><p className="text-[var(--color-muted)]">{request.qrTag?.label || "QR tag"} | {formatDate(request.createdAt)}</p></div>
                      <StatusBadge tone={request.status === "UNREAD" ? "warning" : "success"}>{request.status}</StatusBadge>
                    </div>
                    {request.scannerName ? <p className="mt-3 font-bold">Scanner: {request.scannerName}</p> : null}
                    <p className="mt-2 whitespace-pre-wrap rounded bg-[#f8fbf9] p-3">{request.message}</p>
                    {request.messages?.length ? (
                      <div className="mt-3 space-y-2">
                        {request.messages.map((message: any) => (
                          <div key={message.id} className="rounded border border-[var(--color-border)] p-3">
                            <p className="text-xs font-black uppercase text-[var(--color-muted)]">{message.sender === "OWNER" ? "Owner reply" : "Scanner text"}</p>
                            <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </Panel>
          </section>

          <section id="orders">
            <Panel title="COD Orders">
              {data.orders.length === 0 ? <EmptyState title="No COD orders" body="Orders linked to this owner will appear here." /> : null}
              <div className="space-y-3">
                {data.orders.map((order: any) => (
                  <article key={order.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 text-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><h3 className="font-black">{order.orderNumber}</h3><p className="text-[var(--color-muted)]">{formatDate(order.createdAt)}</p></div>
                      <div className="flex gap-2"><StatusBadge>{order.status}</StatusBadge><StatusBadge tone={order.paymentStatus === "COD_COLLECTED" ? "success" : "warning"}>{order.paymentStatus}</StatusBadge></div>
                    </div>
                    <p className="mt-3 text-lg font-black">{formatBdt(order.totalBdt)}</p>
                  </article>
                ))}
              </div>
            </Panel>
          </section>

          <Panel title="Owner Activity">
            <p className="text-sm text-[var(--color-muted)]">Latest activity: {latestActivity ? formatDate(latestActivity) : "No activity yet"}</p>
          </Panel>
        </div>
      ) : null}
    </AdminShell>
  );
}
