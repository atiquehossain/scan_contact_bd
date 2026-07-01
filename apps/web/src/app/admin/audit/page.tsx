"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { FileClock, LockKeyhole, SearchCheck, ShieldAlert, UserCheck, type LucideIcon } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, ErrorState, StatusBadge, cx, formatDate } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";
type MetadataValue = string | number | boolean | null | MetadataValue[] | { [key: string]: MetadataValue };

type AuditActor = {
  email?: string | null;
  phone?: string | null;
  fullName?: string | null;
};

type AuditLog = {
  id: string;
  actor?: AuditActor | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  metadata?: MetadataValue;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const sensitiveKeyPattern = /(token|accessToken|refreshToken|authorization|bearer|password|secret|apiKey|privateKey|serviceAccount|credential|databaseUrl|dbUrl|redisUrl|smtpPassword|paymentSecret|firebasePrivateKey|jwt|otp|session|cookie|key|private|hash)/i;
const sensitiveValuePattern = /(bearer\s+|postgres:\/\/|mysql:\/\/|mongodb:\/\/|redis:\/\/|-----BEGIN|eyJ[A-Za-z0-9_-]{20,}|[A-Za-z0-9+/]{48,}={0,2})/i;

function humanize(value?: string | null) {
  if (!value) return "Not available";
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function actorLabel(log: AuditLog) {
  return log.actor?.email || log.actor?.phone || log.actor?.fullName || "System";
}

function actionTone(action?: string | null): Tone {
  const value = String(action || "").toUpperCase();
  if (/(FAILURE|DENIED|DELETE|DISABLE|REVOKE|SUSPEND|BLOCK|ERROR)/.test(value)) return "danger";
  if (/(UPDATE|PATCH|REVIEW|TRANSFER|LOGOUT|BACKUP|SETTING|PASSWORD)/.test(value)) return "warning";
  if (/(VIEW|FETCH|READ|LIST)/.test(value)) return "info";
  if (/(CREATE|LOGIN_SUCCESS|VERIFY|APPROVE|RESOLVE)/.test(value)) return "success";
  return "neutral";
}

function categoryFor(action?: string | null) {
  const value = String(action || "").toUpperCase();
  if (/(FAILURE|DENIED|LOGIN|LOGOUT|PASSWORD|TOKEN|SESSION|AUTH)/.test(value)) return "Security";
  if (/(DELETE|DISABLE|TRANSFER|UPDATE|PATCH|CREATE)/.test(value)) return "Data change";
  if (/(VIEW|FETCH|READ|LIST)/.test(value)) return "Access";
  return "System";
}

function metadataEntries(value: MetadataValue | undefined) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value);
}

function countSensitiveMetadata(value: MetadataValue | undefined): number {
  if (!value || typeof value !== "object") return 0;
  if (Array.isArray(value)) return value.reduce<number>((total, item) => total + countSensitiveMetadata(item), 0);
  return Object.entries(value).reduce((total, [key, item]) => {
    const keySensitive = sensitiveKeyPattern.test(key);
    const valueSensitive = typeof item === "string" && sensitiveValuePattern.test(item);
    return total + (keySensitive || valueSensitive ? 1 : 0) + countSensitiveMetadata(item);
  }, 0);
}

function sanitizeMetadata(value: MetadataValue | undefined, key = ""): MetadataValue {
  if (value === undefined) return {};
  if (sensitiveKeyPattern.test(key)) return "[redacted]";
  if (typeof value === "string") {
    if (sensitiveValuePattern.test(value)) return "[redacted]";
    return value.length > 120 ? `${value.slice(0, 117)}...` : value;
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeMetadata(item, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([entryKey, entryValue]) => [entryKey, sanitizeMetadata(entryValue, entryKey)]));
  }
  return value ?? null;
}

function metadataSummary(value: MetadataValue | undefined) {
  const entries = metadataEntries(value);
  if (!entries.length) return "No metadata";
  const sensitive = countSensitiveMetadata(value);
  const visible = entries.length;
  return sensitive ? `${visible} fields, ${sensitive} protected` : `${visible} safe fields`;
}

function resultLabel(log: AuditLog) {
  const metadata = log.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const result = metadata.result;
    if (typeof result === "string") return humanize(result);
  }
  return actionTone(log.action) === "danger" ? "Review" : "Recorded";
}

function resultTone(log: AuditLog): Tone {
  const metadata = log.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const result = metadata.result;
    if (typeof result === "string") {
      const normalized = result.toUpperCase();
      if (/(FAIL|DENIED|ERROR|INVALID)/.test(normalized)) return "danger";
      if (/(PENDING|REVIEW)/.test(normalized)) return "warning";
      if (/(SUCCESS|OK|DONE)/.test(normalized)) return "success";
    }
  }
  return actionTone(log.action);
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral"
}: {
  label: string;
  value: number | string;
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

function SectionCard({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
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

function AuditSkeleton() {
  return (
    <div className="grid gap-5" role="status" aria-live="polite" aria-label="Loading audit logs">
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
        <div className="h-10 w-full animate-pulse rounded-[var(--radius-button)] bg-slate-200" />
        <div className="mt-5 grid gap-3">
          {[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-16 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />)}
        </div>
      </div>
    </div>
  );
}

function MetadataDisclosure({ log }: { log: AuditLog }) {
  const entries = metadataEntries(log.metadata);
  if (!entries.length) return <span className="text-xs font-semibold text-[var(--color-muted)]">No metadata</span>;

  const sanitized = sanitizeMetadata(log.metadata);
  return (
    <details className="group max-w-md rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] text-xs">
      <summary className="focus-ring cursor-pointer rounded-[var(--radius-button)] px-3 py-2 font-bold text-[var(--color-primary)]">
        View safe metadata
      </summary>
      <pre className="max-h-60 overflow-auto border-t border-[var(--color-border)] p-3 leading-5 text-[var(--color-muted)]">
        {JSON.stringify(sanitized, null, 2)}
      </pre>
    </details>
  );
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [admin, setAdmin] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ logs: AuditLog[] }>("/admin/audit-logs");
      setLogs(data.logs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const actions = useMemo(() => Array.from(new Set(logs.map((log) => log.action).filter(Boolean))).sort(), [logs]);
  const entities = useMemo(() => Array.from(new Set(logs.map((log) => log.entityType || "System").filter(Boolean))).sort(), [logs]);
  const admins = useMemo(() => Array.from(new Set(logs.map(actorLabel))).sort(), [logs]);
  const filtered = useMemo(
    () => logs.filter((log) => {
      const actor = actorLabel(log);
      const entityLabel = log.entityType || "System";
      return (action === "all" || log.action === action) && (entity === "all" || entityLabel === entity) && (admin === "all" || actor === admin);
    }),
    [logs, action, entity, admin]
  );

  const summary = useMemo(() => {
    const adminCount = new Set(logs.map(actorLabel)).size;
    const securityEvents = logs.filter((log) => categoryFor(log.action) === "Security").length;
    const destructive = logs.filter((log) => actionTone(log.action) === "danger").length;
    return {
      total: logs.length,
      admins: adminCount,
      securityEvents,
      destructive,
      latest: logs[0]?.createdAt ? formatDate(logs[0].createdAt) : "No recent activity"
    };
  }, [logs]);

  return (
    <AdminShell>
      <div className="grid gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
              <a href="/admin/overview" className="font-bold text-[var(--color-primary)] hover:underline">Admin</a>
              <span aria-hidden>/</span>
              <span>Audit Logs</span>
            </nav>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">Security audit</p>
            <h1 className="mt-1 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">Audit Logs</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              Review admin and system activity across NoNumQR.
            </p>
          </div>
          <StatusBadge tone={summary.destructive ? "warning" : "success"}>
            {summary.destructive ? `${summary.destructive} needs review` : "Read-only trail"}
          </StatusBadge>
        </header>

        {loading ? <AuditSkeleton /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}

        {!loading && !error ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Audit summary">
              <SummaryCard icon={FileClock} label="Total events" value={summary.total} detail="Records returned by admin API" tone="info" />
              <SummaryCard icon={UserCheck} label="Actors" value={summary.admins} detail="Unique admins or system actor labels" tone="neutral" />
              <SummaryCard icon={LockKeyhole} label="Security events" value={summary.securityEvents} detail="Login, auth, and session-related actions" tone={summary.securityEvents ? "warning" : "success"} />
              <SummaryCard icon={ShieldAlert} label="Sensitive changes" value={summary.destructive} detail="Failures, denials, deletes, and disables" tone={summary.destructive ? "danger" : "success"} />
            </section>

            <SectionCard
              title="Filters"
              description="Filter locally by existing audit action, actor, or entity values returned by the API."
              action={<StatusBadge tone="info">{filtered.length} of {logs.length}</StatusBadge>}
            >
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="audit-action-filter">
                  Action type
                  <select
                    id="audit-action-filter"
                    value={action}
                    onChange={(event) => setAction(event.target.value)}
                    className="focus-ring min-h-11 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-2.5 font-medium text-[var(--color-ink)]"
                  >
                    <option value="all">All actions</option>
                    {actions.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="audit-admin-filter">
                  Actor
                  <select
                    id="audit-admin-filter"
                    value={admin}
                    onChange={(event) => setAdmin(event.target.value)}
                    className="focus-ring min-h-11 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-2.5 font-medium text-[var(--color-ink)]"
                  >
                    <option value="all">All actors</option>
                    {admins.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="audit-entity-filter">
                  Entity type
                  <select
                    id="audit-entity-filter"
                    value={entity}
                    onChange={(event) => setEntity(event.target.value)}
                    className="focus-ring min-h-11 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-2.5 font-medium text-[var(--color-ink)]"
                  >
                    <option value="all">All entities</option>
                    {entities.map((item) => <option key={item} value={item}>{humanize(item)}</option>)}
                  </select>
                </label>
              </div>
            </SectionCard>

            {logs.length === 0 ? (
              <EmptyState title="No audit logs" body="Audit records will appear after admin login or sensitive admin actions." />
            ) : (
              <SectionCard
                title="Activity trail"
                description={`Latest activity: ${summary.latest}. Metadata is redacted before display.`}
                action={<StatusBadge tone="neutral">Read only</StatusBadge>}
              >
                {filtered.length === 0 ? <EmptyState title="No matching audit logs" body="Change filters to see audit records." /> : null}

                {filtered.length > 0 ? (
                  <>
                    <div className="hidden overflow-x-auto xl:block">
                      <table className="min-w-full text-left text-sm">
                        <thead className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                          <tr className="border-b border-[var(--color-border)]">
                            <th className="py-3 pr-4">Time</th>
                            <th className="py-3 pr-4">Actor</th>
                            <th className="py-3 pr-4">Action</th>
                            <th className="py-3 pr-4">Entity</th>
                            <th className="py-3 pr-4">Category</th>
                            <th className="py-3 pr-4">Status</th>
                            <th className="py-3">Metadata</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((log) => (
                            <tr key={log.id} className="border-b border-slate-100 last:border-0">
                              <td className="py-4 pr-4 font-semibold text-[var(--color-muted)]">{formatDate(log.createdAt)}</td>
                              <td className="py-4 pr-4">
                                <p className="font-bold text-[var(--color-ink)]">{actorLabel(log)}</p>
                                <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">{log.ipAddress ? "IP captured" : "No IP recorded"}</p>
                              </td>
                              <td className="py-4 pr-4">
                                <p className="max-w-[220px] font-bold text-[var(--color-ink-strong)]">{humanize(log.action)}</p>
                              </td>
                              <td className="py-4 pr-4">
                                <p className="font-semibold text-[var(--color-ink)]">{humanize(log.entityType)}</p>
                                <p className="mt-1 max-w-[180px] truncate text-xs font-semibold text-[var(--color-muted)]">{log.entityId || "No target"}</p>
                              </td>
                              <td className="py-4 pr-4"><StatusBadge tone={actionTone(log.action)}>{categoryFor(log.action)}</StatusBadge></td>
                              <td className="py-4 pr-4"><StatusBadge tone={resultTone(log)}>{resultLabel(log)}</StatusBadge></td>
                              <td className="py-4">
                                <div className="grid gap-2">
                                  <p className="text-xs font-semibold text-[var(--color-muted)]">{metadataSummary(log.metadata)}</p>
                                  <MetadataDisclosure log={log} />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid gap-3 xl:hidden">
                      {filtered.map((log) => (
                        <article key={log.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#fbfdfc] p-4 text-sm">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h2 className="font-bold text-[var(--color-ink-strong)]">{humanize(log.action)}</h2>
                              <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">{formatDate(log.createdAt)}</p>
                            </div>
                            <StatusBadge tone={actionTone(log.action)}>{categoryFor(log.action)}</StatusBadge>
                          </div>
                          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                            <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-3">
                              <dt className="text-xs font-semibold text-[var(--color-muted)]">Actor</dt>
                              <dd className="mt-1 font-bold text-[var(--color-ink)]">{actorLabel(log)}</dd>
                            </div>
                            <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-3">
                              <dt className="text-xs font-semibold text-[var(--color-muted)]">Entity</dt>
                              <dd className="mt-1 font-bold text-[var(--color-ink)]">{humanize(log.entityType)}</dd>
                            </div>
                            <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-3">
                              <dt className="text-xs font-semibold text-[var(--color-muted)]">Status</dt>
                              <dd className="mt-1"><StatusBadge tone={resultTone(log)}>{resultLabel(log)}</StatusBadge></dd>
                            </div>
                            <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-3">
                              <dt className="text-xs font-semibold text-[var(--color-muted)]">Metadata</dt>
                              <dd className="mt-1 font-bold text-[var(--color-ink)]">{metadataSummary(log.metadata)}</dd>
                            </div>
                          </dl>
                          <div className="mt-3">
                            <MetadataDisclosure log={log} />
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                ) : null}
              </SectionCard>
            )}

            <section className="rounded-[var(--radius-card)] border border-teal-200 bg-[var(--color-primary-soft)] p-4 text-sm leading-6 text-[var(--color-primary-hover)]">
              <div className="flex gap-3">
                <SearchCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
                <p>
                  Audit metadata is displayed through a safe renderer. Sensitive keys such as tokens, passwords, cookies, secrets, and private keys are redacted before they appear in the admin UI.
                </p>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
