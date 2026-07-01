"use client";

import { type ComponentType, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileWarning,
  MessageSquare,
  Pencil,
  Power,
  PowerOff,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, EmptyState, ErrorState, FieldError, formatDate, InlineAlert, LinkButton, StatusBadge, cx } from "@/components/admin/ui";
import { apiFetch, qrImageUrl } from "@/lib/api";

type QrTagStatus = "DRAFT" | "PENDING_ACTIVATION" | "ACTIVE" | "DISABLED" | "LOST" | "TRANSFERRED" | "DELETED";

type OwnerSummary = {
  id: string;
  phone: string;
  fullName?: string | null;
  email?: string | null;
};

type ContactSetting = {
  allowContactForm?: boolean;
  allowWhatsapp?: boolean;
  allowSms?: boolean;
  phoneVisible?: boolean;
  showName?: boolean;
  showEmergency?: boolean;
};

type ScanEvent = {
  id: string;
  referrer?: string | null;
  country?: string | null;
  city?: string | null;
  createdAt?: string | null;
};

type ContactRequest = {
  id: string;
  reason?: string | null;
  message?: string | null;
  scannerName?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

type AbuseReport = {
  id: string;
  reason?: string | null;
  status?: string | null;
  createdAt?: string | null;
};

type AdminTag = {
  id: string;
  publicSlug: string;
  publicUrl: string;
  type: string;
  label: string;
  vehicleNumber?: string | null;
  itemName?: string | null;
  status: QrTagStatus;
  privacyMode?: string | null;
  scanCount?: number | null;
  lastScannedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  owner?: OwnerSummary | null;
  contactSetting?: ContactSetting | null;
  scanEvents?: ScanEvent[];
  contactRequests?: ContactRequest[];
  abuseReports?: AbuseReport[];
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

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character] || character);
}

function statusTone(status?: string | null): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "ACTIVE") return "success";
  if (status === "DISABLED" || status === "LOST" || status === "DELETED") return "danger";
  if (status === "PENDING_ACTIVATION" || status === "DRAFT" || status === "TRANSFERRED") return "warning";
  return "neutral";
}

function requestTone(status?: string | null): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "OPEN") return "warning";
  if (status === "EXPIRED") return "warning";
  if (status === "CLOSED" || status === "RESOLVED") return "success";
  return "neutral";
}

function MetricTile({ label, value, detail, tone = "neutral", icon: Icon }: { label: string; value: ReactNode; detail: string; tone?: "neutral" | "success" | "warning" | "danger" | "info"; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }> }) {
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
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{label}</p>
      <div className="mt-1 text-xl font-bold leading-7 text-[var(--color-ink-strong)]">{value}</div>
      <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{detail}</p>
    </div>
  );
}

function DetailCard({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
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

function DetailSkeleton() {
  const blocks = Array.from({ length: 8 }, (_, index) => index);
  return (
    <div className="grid gap-6" role="status" aria-live="polite" aria-label="Loading tag detail">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
          <div className="h-9 w-64 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-slate-200" />
        </div>
        <div className="h-10 w-36 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="h-9 w-9 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />
            <div className="mt-4 h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-6 w-28 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="aspect-square animate-pulse rounded-[var(--radius-card)] bg-slate-200" />
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
          <div className="grid gap-3 md:grid-cols-2">
            {blocks.map((item) => <div key={item} className="h-16 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminTagDetailClient() {
  const params = useParams<{ tagId: string }>();
  const pathname = usePathname();
  const alertRef = useRef<HTMLDivElement>(null);
  const routeTagId = Array.isArray(params.tagId) ? params.tagId[0] : params.tagId;
  const tagId = actualSegmentFromPath(pathname, routeTagId);
  const [tag, setTag] = useState<AdminTag | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [labelDraft, setLabelDraft] = useState("");
  const [labelError, setLabelError] = useState("");

  const latestContactAt = useMemo(() => tag?.contactRequests?.[0]?.createdAt ?? null, [tag]);
  const latestActivityAt = tag?.lastScannedAt || latestContactAt;
  const notFound = !loading && error.toLowerCase().includes("tag not found");

  async function load() {
    if (!tagId) return;
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ tag: AdminTag }>(`/admin/tags/${tagId}`);
      setTag(data.tag);
      setLabelDraft(data.tag.label || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load tag.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [tagId]);

  async function patchTag(body: Partial<Pick<AdminTag, "status" | "label">>, successMessage: string) {
    if (!tagId) return;
    setActionLoading(true);
    setNotice("");
    setError("");
    try {
      const data = await apiFetch<{ tag: AdminTag }>(`/admin/tags/${tagId}`, { method: "PATCH", body: JSON.stringify(body) });
      setTag((current) => ({ ...(current || data.tag), ...data.tag }));
      setLabelDraft(data.tag.label || "");
      setNotice(successMessage);
      window.setTimeout(() => alertRef.current?.focus(), 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update tag.");
    } finally {
      setActionLoading(false);
    }
  }

  async function setStatus(status: "ACTIVE" | "DISABLED") {
    await patchTag({ status }, status === "ACTIVE" ? "Tag activated." : "Tag paused.");
  }

  async function saveLabel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = labelDraft.trim();
    if (value.length < 2) {
      setLabelError("Tag label must be at least 2 characters.");
      return;
    }
    if (value.length > 80) {
      setLabelError("Tag label must be 80 characters or less.");
      return;
    }
    setLabelError("");
    await patchTag({ label: value }, "Tag label updated.");
  }

  async function copyUrl() {
    if (!tag?.publicUrl) return;
    await navigator.clipboard.writeText(tag.publicUrl);
    setNotice("Public URL copied.");
    window.setTimeout(() => alertRef.current?.focus(), 0);
  }

  function printQr() {
    if (!tag) return;
    const win = window.open("", "_blank", "noopener,noreferrer,width=520,height=720");
    if (!win) return;
    const safeLabel = escapeHtml(tag.label);
    const safeType = escapeHtml(tag.type);
    const safeImageUrl = escapeHtml(qrImageUrl(tag.publicSlug));
    const safePublicUrl = escapeHtml(tag.publicUrl);
    win.document.write(`
      <html><head><title>${safeLabel}</title></head>
      <body style="font-family:Arial,sans-serif;text-align:center;padding:32px">
        <h1>${safeLabel}</h1>
        <p>${safeType}</p>
        <img src="${safeImageUrl}" style="width:320px;height:320px" />
        <p style="word-break:break-all">${safePublicUrl}</p>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    win.document.close();
  }

  return (
    <AdminShell>
      {loading ? <DetailSkeleton /> : null}

      {!loading && error && !notFound ? (
        <div className="grid gap-5">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">QR tag operations</p>
              <h1 className="mt-1 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">QR Tag Detail</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">View tag status, destination, scan activity, and admin controls.</p>
            </div>
            <LinkButton href="/admin/tags" variant="secondary">Back to tags</LinkButton>
          </header>
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : null}

      {notFound ? (
        <div className="grid gap-5">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">QR tag operations</p>
              <h1 className="mt-1 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">Tag not found</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">This tag may have been deleted or you may not have access.</p>
            </div>
            <LinkButton href="/admin/tags" variant="secondary">
              <ArrowLeft aria-hidden size={16} />
              Back to tags
            </LinkButton>
          </header>
          <EmptyState title="Tag not found" body="This tag may have been deleted or your admin role may not have access to it." action={<LinkButton href="/admin/tags/create">Create tag</LinkButton>} />
        </div>
      ) : null}

      {!loading && !error && tag ? (
        <div className="grid gap-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
                <Link href="/admin/overview" className="font-bold text-[var(--color-primary)] hover:underline">Admin</Link>
                <span aria-hidden>/</span>
                <Link href="/admin/tags" className="font-bold text-[var(--color-primary)] hover:underline">Tags</Link>
                <span aria-hidden>/</span>
                <span>{tag.label}</span>
              </nav>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">{tag.label || tag.publicSlug}</h1>
                <StatusBadge tone={statusTone(tag.status)}>{humanize(tag.status)}</StatusBadge>
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">View tag status, destination, scan activity, and supported admin controls.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LinkButton href="/admin/tags" variant="secondary">
                <ArrowLeft aria-hidden size={16} />
                Back to tags
              </LinkButton>
              <Button type="button" variant="secondary" onClick={copyUrl}>
                <Copy aria-hidden size={16} />
                Copy public URL
              </Button>
              <a className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)]" href={`/t/${tag.publicSlug}`} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden size={16} />
                Open public page
              </a>
            </div>
          </header>

          {notice ? (
            <div ref={alertRef} tabIndex={-1}>
              <InlineAlert tone="success">{notice}</InlineAlert>
            </div>
          ) : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <MetricTile icon={ShieldCheck} label="Status" value={<StatusBadge tone={statusTone(tag.status)}>{humanize(tag.status)}</StatusBadge>} detail="Current QR availability" tone={statusTone(tag.status)} />
            <MetricTile icon={Activity} label="Scan count" value={tag.scanCount ?? 0} detail="Counter from QR scans" tone="info" />
            <MetricTile icon={RefreshCw} label="Last activity" value={latestActivityAt ? formatDate(latestActivityAt) : "None"} detail="Last scan or scanner message" tone={latestActivityAt ? "success" : "neutral"} />
            <MetricTile icon={QrCode} label="Destination type" value="Public URL" detail="Generated NoNumQR tag page" tone="info" />
            <MetricTile icon={CheckCircle2} label="Created" value={formatDate(tag.createdAt)} detail="Original tag creation time" tone="neutral" />
          </section>

          <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
            <div className="grid content-start gap-5">
              <DetailCard title="QR preview" description="Generated QR image and public route.">
                {tag.publicSlug ? (
                  <div className="grid gap-4">
                    <div className="rounded-[24px] border border-teal-100 bg-[#f8fbf9] p-4">
                      <img src={qrImageUrl(tag.publicSlug)} alt={`${tag.label} QR code`} className="aspect-square w-full rounded-[var(--radius-card)] bg-white p-3" />
                    </div>
                    <InlineAlert tone="info" title="QR privacy reminder">
                      This QR points to the public tag page only. It does not encode owner phone, address, owner ID, or private profile data.
                    </InlineAlert>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">Public URL</p>
                      <p className="mt-2 break-all rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-3 text-sm font-bold text-[var(--color-ink)]">{tag.publicUrl}</p>
                    </div>
                    <div className="grid gap-2">
                      <Button type="button" variant="secondary" onClick={copyUrl}>
                        <Copy aria-hidden size={16} />
                        Copy public URL
                      </Button>
                      <a className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[#f8fbf9]" href={qrImageUrl(tag.publicSlug)} download={`${tag.publicSlug}.png`}>
                        <Download aria-hidden size={16} />
                        Download QR
                      </a>
                      <Button type="button" variant="secondary" onClick={printQr}>
                        <Printer aria-hidden size={16} />
                        Print QR
                      </Button>
                      <a className="focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--color-ink)] hover:bg-[#f8fbf9]" href={`/t/${tag.publicSlug}`} target="_blank" rel="noreferrer">
                        <ExternalLink aria-hidden size={16} />
                        Open public page
                      </a>
                    </div>
                  </div>
                ) : (
                  <EmptyState title="QR preview unavailable" body="QR preview is not available from this response." />
                )}
              </DetailCard>

              <DetailCard title="Admin controls" description="Supported by the current PATCH endpoint.">
                <form className="grid gap-3" onSubmit={saveLabel} noValidate>
                  <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="tag-label-edit">
                    Edit label
                    <input
                      id="tag-label-edit"
                      value={labelDraft}
                      onChange={(event) => setLabelDraft(event.target.value)}
                      aria-invalid={Boolean(labelError)}
                      aria-describedby={labelError ? "tag-label-edit-error" : undefined}
                      className={cx(
                        "focus-ring min-h-11 rounded-[var(--radius-button)] border bg-[#f8fbf9] px-3 py-2.5 font-medium",
                        labelError ? "border-red-300" : "border-[var(--color-border)]"
                      )}
                    />
                    <FieldError id="tag-label-edit-error">{labelError}</FieldError>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" variant="secondary" loading={actionLoading}>
                      <Pencil aria-hidden size={16} />
                      Save label
                    </Button>
                    {tag.status === "ACTIVE" ? (
                      <Button type="button" variant="secondary" loading={actionLoading} onClick={() => setStatus("DISABLED")}>
                        <PowerOff aria-hidden size={16} />
                        Pause tag
                      </Button>
                    ) : (
                      <Button type="button" loading={actionLoading} onClick={() => setStatus("ACTIVE")}>
                        <Power aria-hidden size={16} />
                        Activate tag
                      </Button>
                    )}
                  </div>
                </form>
                <InlineAlert tone="info" title="Supported actions only">
                  Delete, regenerate QR, and status history are not exposed by the current admin tag detail API, so they are not shown here.
                </InlineAlert>
              </DetailCard>
            </div>

            <div className="grid gap-5">
              <DetailCard title="Tag information" description="Stored QR tag fields returned by the admin detail endpoint.">
                <dl className="grid gap-3 md:grid-cols-2">
                  <InfoRow label="Tag ID" value={tag.id} />
                  <InfoRow label="Name" value={tag.label} />
                  <InfoRow label="Public slug" value={tag.publicSlug} />
                  <InfoRow label="Type" value={humanize(tag.type)} />
                  <InfoRow label="Status" value={<StatusBadge tone={statusTone(tag.status)}>{humanize(tag.status)}</StatusBadge>} />
                  <InfoRow label="Privacy mode" value={humanize(tag.privacyMode)} />
                  <InfoRow label="Vehicle number" value={tag.vehicleNumber || "Not provided"} />
                  <InfoRow label="Item name" value={tag.itemName || "Not provided"} />
                  <InfoRow label="Created at" value={formatDate(tag.createdAt)} />
                  <InfoRow label="Updated at" value={formatDate(tag.updatedAt)} />
                  <InfoRow label="Owner/customer" value={tag.owner?.id ? <Link href={`/admin/owners/${tag.owner.id}`} className="text-[var(--color-primary)] hover:underline">{tag.owner.fullName || tag.owner.phone}</Link> : "No owner"} />
                  <InfoRow label="Owner phone" value={tag.owner?.phone || "No owner"} />
                </dl>
              </DetailCard>

              <DetailCard title="Destination / scanner behavior" description="Behavior settings included with this tag response.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow label="Destination" value="Generated public tag page" />
                  <InfoRow label="Public page" value={<a className="text-[var(--color-primary)] hover:underline" href={`/t/${tag.publicSlug}`} target="_blank" rel="noreferrer">{`/t/${tag.publicSlug}`}</a>} />
                  <InfoRow label="Contact form" value={<StatusBadge tone={tag.contactSetting?.allowContactForm === false ? "warning" : "success"}>{tag.contactSetting?.allowContactForm === false ? "Off" : "On"}</StatusBadge>} />
                  <InfoRow label="Phone visible" value={<StatusBadge tone={tag.contactSetting?.phoneVisible ? "warning" : "success"}>{tag.contactSetting?.phoneVisible ? "Visible" : "Hidden"}</StatusBadge>} />
                  <InfoRow label="WhatsApp direct link" value={<StatusBadge tone={tag.contactSetting?.allowWhatsapp ? "warning" : "neutral"}>{tag.contactSetting?.allowWhatsapp ? "On" : "Off"}</StatusBadge>} />
                  <InfoRow label="SMS direct link" value={<StatusBadge tone={tag.contactSetting?.allowSms ? "warning" : "neutral"}>{tag.contactSetting?.allowSms ? "On" : "Off"}</StatusBadge>} />
                </div>
              </DetailCard>

              <DetailCard title="Scan activity" description="Recent scan rows returned by the admin detail endpoint.">
                {tag.scanEvents?.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                        <tr className="border-b border-[var(--color-border)]">
                          <th className="py-3 pr-4">Timestamp</th>
                          <th className="py-3 pr-4">Location</th>
                          <th className="py-3 pr-4">Referrer</th>
                          <th className="py-3 pr-4">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tag.scanEvents.map((scan) => (
                          <tr key={scan.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-3 pr-4 font-semibold text-[var(--color-ink)]">{formatDate(scan.createdAt)}</td>
                            <td className="py-3 pr-4 text-[var(--color-muted)]">{[scan.city, scan.country].filter(Boolean).join(", ") || "Not provided"}</td>
                            <td className="max-w-[260px] truncate py-3 pr-4 text-[var(--color-muted)]">{scan.referrer || "Direct / not provided"}</td>
                            <td className="py-3 pr-4"><StatusBadge tone="success">Recorded</StatusBadge></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState title="No scan rows yet" body={tag.scanCount ? "This tag has a scan count, but recent scan rows are not included in this response yet." : "No scan activity has been recorded for this tag yet."} />
                )}
              </DetailCard>

              <div className="grid gap-5 xl:grid-cols-2">
                <DetailCard title="Scanner messages" description="Recent contact requests for this tag.">
                  {tag.contactRequests?.length ? (
                    <div className="grid gap-3">
                      {tag.contactRequests.map((request) => (
                        <div key={request.id} className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-3 text-sm">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <MessageSquare aria-hidden className="h-4 w-4 text-[var(--color-primary)]" />
                              <p className="font-bold text-[var(--color-ink)]">{humanize(request.reason)}</p>
                            </div>
                            <StatusBadge tone={requestTone(request.status)}>{humanize(request.status)}</StatusBadge>
                          </div>
                          <p className="mt-2 line-clamp-3 text-[var(--color-muted)]">{request.message || "No message text provided."}</p>
                          <p className="mt-2 text-xs font-semibold text-[var(--color-muted)]">{formatDate(request.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No scanner messages" body="No scanner contact requests have been submitted for this tag yet." />
                  )}
                </DetailCard>

                <DetailCard title="Related records" description="Safety records included with this tag response.">
                  {tag.abuseReports?.length ? (
                    <div className="grid gap-3">
                      {tag.abuseReports.map((report) => (
                        <div key={report.id} className="rounded-[var(--radius-button)] border border-red-100 bg-[var(--color-danger-bg)] p-3 text-sm">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <FileWarning aria-hidden className="h-4 w-4 text-[var(--color-danger)]" />
                              <p className="font-bold text-[var(--color-ink)]">{report.reason || "Abuse report"}</p>
                            </div>
                            <StatusBadge tone={report.status === "OPEN" ? "danger" : "warning"}>{humanize(report.status)}</StatusBadge>
                          </div>
                          <p className="mt-2 text-xs font-semibold text-[var(--color-muted)]">{formatDate(report.createdAt)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No related records" body="No abuse reports, orders, campaigns, or audit trail rows are included for this tag response." />
                  )}
                </DetailCard>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AdminShell>
  );
}
