"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, FileWarning, Handshake, MessageSquare, ShieldCheck, type LucideIcon } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, EmptyState, ErrorState, StatusBadge, ToastNotification, cx, formatDate } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";
type ReportStatusUpdate = "REVIEWING" | "RESOLVED" | "DISMISSED";

type OwnerSummary = {
  fullName?: string | null;
  phone?: string | null;
};

type QrTagSummary = {
  id?: string | null;
  label?: string | null;
  type?: string | null;
  publicSlug?: string | null;
  owner?: OwnerSummary | null;
};

type AbuseReport = {
  id: string;
  reason?: string | null;
  details?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  qrTag?: QrTagSummary | null;
};

type ContactRequest = {
  id: string;
  reason?: string | null;
  message?: string | null;
  scannerName?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  owner?: OwnerSummary | null;
  qrTag?: QrTagSummary | null;
};

type ResellerApplication = {
  id: string;
  businessName?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  user?: {
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
};

type Society = {
  id: string;
  name?: string | null;
  city?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type OperationalReports = {
  abuseReports: AbuseReport[];
  contactRequests: ContactRequest[];
  resellerApplications: ResellerApplication[];
  societies: Society[];
};

function humanize(value?: string | null) {
  if (!value) return "Not available";
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function statusTone(status?: string | null): Tone {
  if (!status) return "neutral";
  if (["RESOLVED", "CLOSED", "APPROVED", "ACTIVE", "COMPLETED"].includes(status)) return "success";
  if (["OPEN", "FAILED", "REJECTED", "BLOCKED"].includes(status)) return "danger";
  if (["PENDING", "REVIEWING", "EXPIRED", "SUBMITTED"].includes(status)) return "warning";
  if (["CONTACTED", "IN_PROGRESS"].includes(status)) return "info";
  if (["DISMISSED", "INACTIVE"].includes(status)) return "neutral";
  return "neutral";
}

function trimPreview(value?: string | null, fallback = "No details provided.") {
  const clean = value?.trim();
  if (!clean) return fallback;
  return clean.length > 220 ? `${clean.slice(0, 217)}...` : clean;
}

function tagLabel(tag?: QrTagSummary | null) {
  return tag?.label || tag?.publicSlug || "QR tag";
}

function ownerLabel(owner?: OwnerSummary | null) {
  return owner?.fullName || owner?.phone || "Owner";
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral"
}: {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  tone?: Tone;
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

function ReportsSkeleton() {
  return (
    <div className="grid gap-5" role="status" aria-live="polite" aria-label="Loading reports">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-40 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
        <div className="mt-5 grid gap-3">
          {[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />)}
        </div>
      </div>
    </div>
  );
}

function QueueSection({
  title,
  description,
  count,
  tone,
  children
}: {
  title: string;
  description: string;
  count: number;
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--color-ink-strong)]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
        </div>
        <StatusBadge tone={tone}>{count} item{count === 1 ? "" : "s"}</StatusBadge>
      </div>
      {children}
    </section>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<OperationalReports | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<OperationalReports>("/admin/operational-reports");
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateReport(reportId: string, status: ReportStatusUpdate) {
    setUpdatingId(reportId);
    try {
      await apiFetch(`/admin/reports/${reportId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setToast("Abuse report updated.");
      await load();
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not update report.");
    } finally {
      setUpdatingId("");
    }
  }

  const summary = useMemo(() => {
    const abuseReports = data?.abuseReports || [];
    const contactRequests = data?.contactRequests || [];
    const resellerApplications = data?.resellerApplications || [];
    const societies = data?.societies || [];
    return {
      abuseReports: abuseReports.length,
      contactRequests: contactRequests.length,
      resellerApplications: resellerApplications.length,
      societies: societies.length,
      reviewQueue: abuseReports.filter((report) => ["OPEN", "PENDING", "REVIEWING"].includes(report.status || "")).length
    };
  }, [data]);

  return (
    <AdminShell>
      <div className="grid gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
              <a href="/admin/overview" className="font-bold text-[var(--color-primary)] hover:underline">Admin</a>
              <span aria-hidden>/</span>
              <span>Reports</span>
            </nav>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">Moderation operations</p>
            <h1 className="mt-1 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">Reports</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              Review abuse reports, contact requests, reseller applications, and society activity.
            </p>
          </div>
          <StatusBadge tone={summary.reviewQueue ? "warning" : "success"}>
            {summary.reviewQueue ? `${summary.reviewQueue} needs review` : "Queues clear"}
          </StatusBadge>
        </header>

        {loading ? <ReportsSkeleton /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}

        {!loading && !error && data ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Reports summary">
              <SummaryCard
                icon={FileWarning}
                label="Abuse reports"
                value={summary.abuseReports}
                detail="Submitted from public QR pages"
                tone={summary.reviewQueue ? "danger" : "success"}
              />
              <SummaryCard
                icon={MessageSquare}
                label="Contact requests"
                value={summary.contactRequests}
                detail="Private scanner messages in review view"
                tone="info"
              />
              <SummaryCard
                icon={Handshake}
                label="Reseller applications"
                value={summary.resellerApplications}
                detail="Partner and reseller queue records"
                tone={summary.resellerApplications ? "warning" : "neutral"}
              />
              <SummaryCard
                icon={Building2}
                label="Societies"
                value={summary.societies}
                detail="Society records returned by admin API"
                tone="neutral"
              />
            </section>

            <div className="grid gap-6">
              <QueueSection
                title="Abuse reports"
                description="High-priority reports submitted from public QR pages. Status changes use the existing moderation workflow."
                count={data.abuseReports.length}
                tone={summary.reviewQueue ? "danger" : "success"}
              >
                {data.abuseReports.length === 0 ? (
                  <EmptyState title="No abuse reports" body="Submitted abuse reports will appear here for admin review." />
                ) : (
                  <div className="grid gap-3">
                    {data.abuseReports.map((report) => (
                      <article
                        key={report.id}
                        className={cx(
                          "rounded-[var(--radius-card)] border p-4 text-sm",
                          report.status === "OPEN"
                            ? "border-red-200 bg-[var(--color-danger-bg)]"
                            : "border-[var(--color-border)] bg-[#fbfdfc]"
                        )}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-[var(--color-ink-strong)]">{humanize(report.reason)}</h3>
                            <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">
                              {tagLabel(report.qrTag)} · {formatDate(report.createdAt)}
                            </p>
                          </div>
                          <StatusBadge tone={statusTone(report.status)}>{humanize(report.status)}</StatusBadge>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap leading-6 text-[var(--color-ink)]">{trimPreview(report.details)}</p>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap gap-2">
                            {report.qrTag?.id ? (
                              <Link
                                className="focus-ring inline-flex min-h-9 items-center rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--color-ink)] hover:bg-[#f8fbf9]"
                                href={`/admin/tags/${report.qrTag.id}`}
                              >
                                Open tag
                              </Link>
                            ) : null}
                            <StatusBadge tone="info">Admin only</StatusBadge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button type="button" variant="secondary" loading={updatingId === report.id} onClick={() => updateReport(report.id, "REVIEWING")}>
                              Mark reviewing
                            </Button>
                            <Button type="button" variant="secondary" loading={updatingId === report.id} onClick={() => updateReport(report.id, "RESOLVED")}>
                              Resolve
                            </Button>
                            <Button type="button" variant="secondary" loading={updatingId === report.id} onClick={() => updateReport(report.id, "DISMISSED")}>
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </QueueSection>

              <QueueSection
                title="Contact requests"
                description="Scanner contact requests and message previews stay inside authenticated admin review."
                count={data.contactRequests.length}
                tone="info"
              >
                {data.contactRequests.length === 0 ? (
                  <EmptyState title="No contact requests" body="Scanner contact requests will appear here." />
                ) : (
                  <>
                    <div className="hidden overflow-x-auto xl:block">
                      <table className="min-w-full text-left text-sm">
                        <thead className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                          <tr className="border-b border-[var(--color-border)]">
                            <th className="py-3 pr-4">Reason</th>
                            <th className="py-3 pr-4">Tag / owner</th>
                            <th className="py-3 pr-4">Message preview</th>
                            <th className="py-3 pr-4">Status</th>
                            <th className="py-3">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.contactRequests.map((request) => (
                            <tr key={request.id} className="border-b border-slate-100 last:border-0">
                              <td className="py-4 pr-4 font-bold text-[var(--color-ink-strong)]">{humanize(request.reason)}</td>
                              <td className="py-4 pr-4">
                                <p className="font-semibold text-[var(--color-ink)]">{tagLabel(request.qrTag)}</p>
                                <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">{ownerLabel(request.owner)}</p>
                              </td>
                              <td className="max-w-md py-4 pr-4 leading-6 text-[var(--color-ink)]">{trimPreview(request.message, "No message preview available.")}</td>
                              <td className="py-4 pr-4"><StatusBadge tone={statusTone(request.status)}>{humanize(request.status)}</StatusBadge></td>
                              <td className="py-4">{formatDate(request.createdAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid gap-3 xl:hidden">
                      {data.contactRequests.map((request) => (
                        <article key={request.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#fbfdfc] p-4 text-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-[var(--color-ink-strong)]">{humanize(request.reason)}</h3>
                              <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">{tagLabel(request.qrTag)} · {ownerLabel(request.owner)}</p>
                            </div>
                            <StatusBadge tone={statusTone(request.status)}>{humanize(request.status)}</StatusBadge>
                          </div>
                          <p className="mt-3 whitespace-pre-wrap leading-6 text-[var(--color-ink)]">{trimPreview(request.message, "No message preview available.")}</p>
                          <p className="mt-3 text-xs font-semibold text-[var(--color-muted)]">{formatDate(request.createdAt)}</p>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </QueueSection>

              <div className="grid gap-6 lg:grid-cols-2">
                <QueueSection
                  title="Reseller applications"
                  description="Applicant records returned by the existing reseller queue."
                  count={data.resellerApplications.length}
                  tone={data.resellerApplications.length ? "warning" : "neutral"}
                >
                  {data.resellerApplications.length === 0 ? (
                    <EmptyState title="No reseller applications" body="Applications will appear here when users apply." />
                  ) : (
                    <div className="grid gap-3">
                      {data.resellerApplications.map((item) => (
                        <article key={item.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#fbfdfc] p-4 text-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-[var(--color-ink-strong)]">{item.businessName || "Reseller application"}</h3>
                              <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">
                                {item.user?.fullName || item.user?.phone || item.user?.email || "Applicant"} · {formatDate(item.createdAt)}
                              </p>
                            </div>
                            <StatusBadge tone={statusTone(item.status)}>{humanize(item.status)}</StatusBadge>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </QueueSection>

                <QueueSection
                  title="Societies"
                  description="Society records stay in this admin-only operational view."
                  count={data.societies.length}
                  tone="neutral"
                >
                  {data.societies.length === 0 ? (
                    <EmptyState title="No societies" body="Society accounts will appear here after creation." />
                  ) : (
                    <div className="grid gap-3">
                      {data.societies.map((society) => (
                        <article key={society.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#fbfdfc] p-4 text-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold text-[var(--color-ink-strong)]">{society.name || "Society"}</h3>
                              <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">{society.city || "No city"} · {formatDate(society.createdAt)}</p>
                            </div>
                            {society.status ? <StatusBadge tone={statusTone(society.status)}>{humanize(society.status)}</StatusBadge> : <StatusBadge>Society</StatusBadge>}
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </QueueSection>
              </div>

              <section className="rounded-[var(--radius-card)] border border-teal-200 bg-[var(--color-primary-soft)] p-4 text-sm leading-6 text-[var(--color-primary-hover)]">
                <div className="flex gap-3">
                  <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>
                    Report and message content is admin-only. Public scanner, conversation, and call pages keep owner contact details private and continue using token-protected flows.
                  </p>
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>

      <ToastNotification message={toast} tone={toast.includes("Could not") ? "danger" : "success"} onClose={() => setToast("")} />
    </AdminShell>
  );
}
