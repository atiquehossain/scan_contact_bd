"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { Download, ExternalLink, Printer, Power, PowerOff } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, ErrorState, formatDate, InlineAlert, LinkButton, LoadingState, PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { apiFetch, qrImageUrl } from "@/lib/api";

function actualSegmentFromPath(pathname: string, fallback?: string) {
  const value = pathname.split("/").filter(Boolean).pop() || fallback || "";
  return value.startsWith("__") ? fallback || "" : decodeURIComponent(value);
}

export function AdminTagDetailClient() {
  const params = useParams<{ tagId: string }>();
  const pathname = usePathname();
  const routeTagId = Array.isArray(params.tagId) ? params.tagId[0] : params.tagId;
  const tagId = actualSegmentFromPath(pathname, routeTagId);
  const [tag, setTag] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ tag: any }>(`/admin/tags/${tagId}`);
      setTag(data.tag);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tag.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tagId) load();
  }, [tagId]);

  async function setStatus(status: "ACTIVE" | "DISABLED") {
    setActionLoading(true);
    setNotice("");
    try {
      const data = await apiFetch<{ tag: any }>(`/admin/tags/${tagId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setTag(data.tag);
      setNotice(status === "ACTIVE" ? "Tag reactivated." : "Tag deactivated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update tag.");
    } finally {
      setActionLoading(false);
    }
  }

  function printQr() {
    if (!tag) return;
    const win = window.open("", "_blank", "noopener,noreferrer,width=520,height=720");
    if (!win) return;
    win.document.write(`
      <html><head><title>${tag.label}</title></head>
      <body style="font-family:Arial,sans-serif;text-align:center;padding:32px">
        <h1>${tag.label}</h1>
        <p>${tag.type}</p>
        <img src="${qrImageUrl(tag.publicSlug)}" style="width:320px;height:320px" />
        <p style="word-break:break-all">${tag.publicUrl}</p>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    win.document.close();
  }

  return (
    <AdminShell>
      <PageHeader
        title="Tag detail"
        description="Inspect a QR tag, its owner assignment, public URL, scans, and latest scanner messages."
        breadcrumbs={[{ label: "Admin", href: "/admin/overview" }, { label: "Tags", href: "/admin/tags/new" }, { label: tag?.label || "Tag detail" }]}
        action={<LinkButton href="/admin/tags/new">Create New Tag</LinkButton>}
      />

      {loading ? <LoadingState label="Loading tag detail..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {notice ? <div className="mb-4"><InlineAlert tone="success">{notice}</InlineAlert></div> : null}

      {!loading && !error && tag ? (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Panel title="QR preview">
            <img src={qrImageUrl(tag.publicSlug)} alt={`${tag.label} QR code`} className="aspect-square w-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-2" />
            <p className="mt-4 break-all rounded-[var(--radius-card)] bg-[#f8fbf9] p-3 text-sm font-bold">{tag.publicUrl}</p>
            <div className="mt-4 grid gap-2">
              <a className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold" href={qrImageUrl(tag.publicSlug)} download={`${tag.publicSlug}.png`}>
                <Download aria-hidden size={16} />Download PNG
              </a>
              <Button variant="secondary" onClick={printQr}><Printer aria-hidden size={16} />Print QR</Button>
              <a className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white" href={`/t/${tag.publicSlug}`} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden size={16} />Open public page
              </a>
            </div>
          </Panel>

          <div className="grid gap-6">
            <Panel title="Tag summary">
              <dl className="grid gap-4 text-sm md:grid-cols-2">
                <div><dt className="font-bold text-[var(--color-muted)]">Tag label</dt><dd className="mt-1 font-black">{tag.label}</dd></div>
                <div><dt className="font-bold text-[var(--color-muted)]">Tag type</dt><dd className="mt-1 font-black">{tag.type}</dd></div>
                <div><dt className="font-bold text-[var(--color-muted)]">Status</dt><dd className="mt-1"><StatusBadge tone={tag.status === "ACTIVE" ? "success" : "warning"}>{tag.status}</StatusBadge></dd></div>
                <div><dt className="font-bold text-[var(--color-muted)]">Created</dt><dd className="mt-1 font-black">{formatDate(tag.createdAt)}</dd></div>
                <div><dt className="font-bold text-[var(--color-muted)]">Owner name</dt><dd className="mt-1 font-black">{tag.owner?.fullName || "No owner"}</dd></div>
                <div><dt className="font-bold text-[var(--color-muted)]">Owner phone</dt><dd className="mt-1 font-black">{tag.owner?.phone || "No owner"}</dd></div>
                <div><dt className="font-bold text-[var(--color-muted)]">Scan count</dt><dd className="mt-1 font-black">{tag.scanCount || 0}</dd></div>
                <div><dt className="font-bold text-[var(--color-muted)]">Latest scan/contact</dt><dd className="mt-1 font-black">{formatDate(tag.lastScannedAt || tag.contactRequests?.[0]?.createdAt)}</dd></div>
              </dl>
              <div className="mt-5 flex flex-wrap gap-2">
                {tag.status === "ACTIVE" ? (
                  <Button variant="secondary" loading={actionLoading} onClick={() => setStatus("DISABLED")}><PowerOff aria-hidden size={16} />Deactivate tag</Button>
                ) : (
                  <Button loading={actionLoading} onClick={() => setStatus("ACTIVE")}><Power aria-hidden size={16} />Reactivate tag</Button>
                )}
                {tag.owner?.id ? <LinkButton href={`/admin/owners/${tag.owner.id}`} variant="secondary">View owner</LinkButton> : null}
              </div>
            </Panel>

            <Panel title="Recent scanner text">
              {tag.contactRequests?.length ? (
                <div className="space-y-3">
                  {tag.contactRequests.map((request: any) => (
                    <div key={request.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-3 text-sm">
                      <div className="flex flex-wrap justify-between gap-2">
                        <p className="font-black">{request.reason}</p>
                        <span className="text-[var(--color-muted)]">{formatDate(request.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-[var(--color-muted)]">{request.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">No scanner messages for this tag yet.</p>
              )}
            </Panel>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
