"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Archive,
  CheckCircle2,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Settings as SettingsIcon,
  ShieldCheck,
  TriangleAlert,
  type LucideIcon
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, EmptyState, ErrorState, StatusBadge, cx, formatDate } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

type SystemHealth = {
  ok?: boolean;
  db?: string | null;
  time?: string | null;
};

type SettingRecord = {
  id?: string | null;
  key: string;
  value?: unknown;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type BackupLog = {
  id: string;
  type?: string | null;
  status?: string | null;
  location?: string | null;
  message?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type EndpointState = {
  loading: boolean;
  error: string;
};

const sensitivePattern = /(secret|token|password|private|credential|database|redis|smtp|sms|payment|bkash|nagad|sslcommerz|firebase|fcm|apns|s3|api[_-]?key|access[_-]?key|refresh|jwt|connection|string|url)/i;

function humanize(value?: string | null) {
  if (!value) return "Not available";
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function statusTone(status?: string | null): Tone {
  if (!status) return "neutral";
  const normalized = status.toUpperCase();
  if (["OK", "HEALTHY", "CONNECTED", "COMPLETED", "SUCCESS", "SUCCEEDED", "ACTIVE"].includes(normalized)) return "success";
  if (["PENDING", "RUNNING", "STARTED", "IN_PROGRESS", "SCHEDULED"].includes(normalized)) return "warning";
  if (["FAILED", "ERROR", "UNAVAILABLE", "DISCONNECTED", "MISSING"].includes(normalized)) return "danger";
  return "neutral";
}

function isConfigured(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function safeValueSummary(key: string, value: unknown) {
  if (!isConfigured(value)) return "Missing";
  if (sensitivePattern.test(key)) return "Configured";
  if (typeof value === "boolean") return value ? "Enabled" : "Disabled";
  if (typeof value === "number") return "Configured";
  if (typeof value === "string") return "Configured";
  if (Array.isArray(value)) return `${value.length} ${value.length === 1 ? "entry" : "entries"} configured`;
  if (typeof value === "object") return `${Object.keys(value as Record<string, unknown>).length} fields configured`;
  return "Configured";
}

function settingFields(setting: SettingRecord) {
  const value = setting.value;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [{ key: setting.key, summary: safeValueSummary(setting.key, value) }];
  }
  return Object.entries(value as Record<string, unknown>)
    .slice(0, 8)
    .map(([key, entryValue]) => ({ key, summary: safeValueSummary(`${setting.key}.${key}`, entryValue) }));
}

function SectionCard({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
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

function HealthCard({
  label,
  value,
  detail,
  tone,
  icon: Icon
}: {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
  icon: LucideIcon;
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
        <StatusBadge tone={tone}>{value}</StatusBadge>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{detail}</p>
    </div>
  );
}

function EndpointWarning({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-amber-200 bg-[var(--color-warning-bg)] p-4 text-sm leading-6 text-[var(--color-warning-text)]" role="status">
      <div className="flex gap-3">
        <TriangleAlert aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-bold text-[var(--color-ink-strong)]">{title}</p>
          <p className="mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-5" role="status" aria-live="polite" aria-label="Loading settings and health">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="h-9 w-9 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />
            <div className="mt-4 h-3 w-28 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-4 w-40 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
        <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
        <div className="mt-5 grid gap-3">
          {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-[var(--radius-button)] bg-slate-200" />)}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [settings, setSettings] = useState<SettingRecord[]>([]);
  const [backups, setBackups] = useState<BackupLog[]>([]);
  const [healthState, setHealthState] = useState<EndpointState>({ loading: true, error: "" });
  const [settingsState, setSettingsState] = useState<EndpointState>({ loading: true, error: "" });
  const [backupsState, setBackupsState] = useState<EndpointState>({ loading: true, error: "" });

  async function load() {
    setHealthState({ loading: true, error: "" });
    setSettingsState({ loading: true, error: "" });
    setBackupsState({ loading: true, error: "" });

    const [healthResult, settingsResult, backupsResult] = await Promise.allSettled([
      apiFetch<SystemHealth>("/admin/system-health"),
      apiFetch<{ settings: SettingRecord[] }>("/admin/settings"),
      apiFetch<{ backups: BackupLog[] }>("/admin/backups")
    ]);

    if (healthResult.status === "fulfilled") {
      setHealth(healthResult.value);
      setHealthState({ loading: false, error: "" });
    } else {
      setHealth(null);
      setHealthState({ loading: false, error: healthResult.reason instanceof Error ? healthResult.reason.message : "System health is unavailable." });
    }

    if (settingsResult.status === "fulfilled") {
      setSettings(settingsResult.value.settings || []);
      setSettingsState({ loading: false, error: "" });
    } else {
      setSettings([]);
      setSettingsState({ loading: false, error: settingsResult.reason instanceof Error ? settingsResult.reason.message : "Settings are unavailable." });
    }

    if (backupsResult.status === "fulfilled") {
      setBackups(backupsResult.value.backups || []);
      setBackupsState({ loading: false, error: "" });
    } else {
      setBackups([]);
      setBackupsState({ loading: false, error: backupsResult.reason instanceof Error ? backupsResult.reason.message : "Backup logs are unavailable." });
    }
  }

  useEffect(() => {
    load();
  }, []);

  const loading = healthState.loading || settingsState.loading || backupsState.loading;
  const healthTone: Tone = health?.ok ? "success" : healthState.error ? "danger" : "warning";
  const backupSummary = useMemo(() => {
    const latest = backups[0];
    return {
      count: backups.length,
      latestStatus: latest?.status || "No records",
      latestTime: latest?.finishedAt || latest?.startedAt || latest?.createdAt || null
    };
  }, [backups]);

  return (
    <AdminShell>
      <div className="grid gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
              <a href="/admin/overview" className="font-bold text-[var(--color-primary)] hover:underline">Admin</a>
              <span aria-hidden>/</span>
              <span>Settings</span>
            </nav>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">Operations console</p>
            <h1 className="mt-1 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">Settings &amp; Health</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              Review NoNumQR system health, operational settings, and backup readiness.
            </p>
          </div>
          <Button type="button" variant="secondary" loading={loading} onClick={load}>
            <RefreshCw aria-hidden className="h-4 w-4" />
            Refresh
          </Button>
        </header>

        {loading ? <SettingsSkeleton /> : null}

        {!loading ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="System health overview">
              <HealthCard
                icon={Server}
                label="API server"
                value={health?.ok ? "Healthy" : "Unavailable"}
                detail={healthState.error ? "Health endpoint did not return a usable response." : "Server health endpoint responded."}
                tone={healthTone}
              />
              <HealthCard
                icon={Database}
                label="Database"
                value={humanize(health?.db)}
                detail={health?.db ? "Database status returned by the health endpoint." : "Database status was not returned."}
                tone={statusTone(health?.db || (healthState.error ? "unavailable" : ""))}
              />
              <HealthCard
                icon={Archive}
                label="Backups"
                value={humanize(backupSummary.latestStatus)}
                detail={backupSummary.latestTime ? `Latest record: ${formatDate(backupSummary.latestTime)}` : "No backup records returned."}
                tone={backupsState.error ? "danger" : backups.length ? statusTone(backupSummary.latestStatus) : "neutral"}
              />
              <HealthCard
                icon={SettingsIcon}
                label="Configuration"
                value={settingsState.error ? "Unavailable" : `${settings.length} rows`}
                detail={settingsState.error ? "Settings route did not load for this session." : "Values are masked to avoid exposing secrets."}
                tone={settingsState.error ? "warning" : "info"}
              />
            </section>

            {healthState.error ? <EndpointWarning title="System health unavailable" message={healthState.error} /> : null}
            {settingsState.error ? <EndpointWarning title="Settings route unavailable" message={settingsState.error} /> : null}
            {backupsState.error ? <EndpointWarning title="Backup logs unavailable" message={backupsState.error} /> : null}

            <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
              <SectionCard title="Services" description="Current service status returned by the existing health endpoint.">
                {healthState.error ? (
                  <ErrorState message={healthState.error} onRetry={load} />
                ) : (
                  <dl className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#fbfdfc] p-4">
                      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">API</dt>
                      <dd className="mt-2"><StatusBadge tone={health?.ok ? "success" : "danger"}>{health?.ok ? "Healthy" : "Unavailable"}</StatusBadge></dd>
                    </div>
                    <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#fbfdfc] p-4">
                      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">Database</dt>
                      <dd className="mt-2 font-bold text-[var(--color-ink-strong)]">{humanize(health?.db)}</dd>
                    </div>
                    <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#fbfdfc] p-4">
                      <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-muted)]">Last checked</dt>
                      <dd className="mt-2 font-bold text-[var(--color-ink-strong)]">{formatDate(health?.time)}</dd>
                    </div>
                  </dl>
                )}
              </SectionCard>

              <SectionCard title="Operational notes" description="Safe reminders for admin-only system operations.">
                <div className="grid gap-3 text-sm leading-6">
                  <div className="rounded-[var(--radius-button)] border border-teal-200 bg-[var(--color-primary-soft)] p-4 text-[var(--color-primary-hover)]">
                    <div className="flex gap-3">
                      <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
                      <p>Secrets and connection strings are never rendered as raw values on this page.</p>
                    </div>
                  </div>
                  <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#fbfdfc] p-4 text-[var(--color-muted)]">
                    Backup and restore actions are shown only when existing frontend behavior supports them.
                  </div>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              title="Configuration"
              description="Stored operational settings are shown as safe labels and masked status, not raw values."
              action={<StatusBadge tone={settingsState.error ? "warning" : "info"}>{settingsState.error ? "Unavailable" : `${settings.length} rows`}</StatusBadge>}
            >
              {settingsState.error ? (
                <EmptyState title="Settings unavailable" body="The settings endpoint did not return data for this admin session. Other health sections remain available." />
              ) : settings.length === 0 ? (
                <EmptyState title="No settings rows" body="Settings will appear after an admin creates them through supported operational workflows." />
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {settings.map((setting) => (
                    <article key={setting.id || setting.key} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#fbfdfc] p-4 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-[var(--color-ink-strong)]">{setting.key}</h3>
                          <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">Updated {formatDate(setting.updatedAt)}</p>
                        </div>
                        <StatusBadge tone={isConfigured(setting.value) ? "success" : "warning"}>
                          {isConfigured(setting.value) ? "Configured" : "Missing"}
                        </StatusBadge>
                      </div>
                      <dl className="mt-4 grid gap-2">
                        {settingFields(setting).map((field) => (
                          <div key={field.key} className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white px-3 py-2">
                            <dt className="font-semibold text-[var(--color-muted)]">{field.key}</dt>
                            <dd className="font-bold text-[var(--color-ink)]">{field.summary}</dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Backup status"
              description="Backup records returned by the existing admin backups endpoint."
              action={<StatusBadge tone={backupsState.error ? "danger" : backups.length ? statusTone(backupSummary.latestStatus) : "neutral"}>{backupsState.error ? "Unavailable" : `${backups.length} logs`}</StatusBadge>}
            >
              {backupsState.error ? (
                <EmptyState title="Backup logs unavailable" body="The backups endpoint did not return data for this admin session." />
              ) : backups.length === 0 ? (
                <EmptyState title="No backup logs" body="Backup logs will appear after backup scripts run." />
              ) : (
                <>
                  <div className="hidden overflow-x-auto xl:block">
                    <table className="min-w-full text-left text-sm">
                      <thead className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                        <tr className="border-b border-[var(--color-border)]">
                          <th className="py-3 pr-4">Type</th>
                          <th className="py-3 pr-4">Status</th>
                          <th className="py-3 pr-4">Started</th>
                          <th className="py-3 pr-4">Finished</th>
                          <th className="py-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {backups.map((backup) => (
                          <tr key={backup.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-4 pr-4 font-bold text-[var(--color-ink-strong)]">{humanize(backup.type || "Backup")}</td>
                            <td className="py-4 pr-4"><StatusBadge tone={statusTone(backup.status)}>{humanize(backup.status)}</StatusBadge></td>
                            <td className="py-4 pr-4">{formatDate(backup.startedAt || backup.createdAt)}</td>
                            <td className="py-4 pr-4">{formatDate(backup.finishedAt)}</td>
                            <td className="py-4 text-[var(--color-muted)]">{backup.message ? "Message captured" : "No message"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-3 xl:hidden">
                    {backups.map((backup) => (
                      <article key={backup.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#fbfdfc] p-4 text-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-[var(--color-ink-strong)]">{humanize(backup.type || "Backup")}</h3>
                            <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">Started {formatDate(backup.startedAt || backup.createdAt)}</p>
                          </div>
                          <StatusBadge tone={statusTone(backup.status)}>{humanize(backup.status)}</StatusBadge>
                        </div>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-3">
                            <p className="text-xs font-semibold text-[var(--color-muted)]">Finished</p>
                            <p className="mt-1 font-bold text-[var(--color-ink)]">{formatDate(backup.finishedAt)}</p>
                          </div>
                          <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-3">
                            <p className="text-xs font-semibold text-[var(--color-muted)]">Notes</p>
                            <p className="mt-1 font-bold text-[var(--color-ink)]">{backup.message ? "Message captured" : "No message"}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </SectionCard>

            <section className="grid gap-3 sm:grid-cols-3" aria-label="Operations safeguards">
              <HealthCard icon={CheckCircle2} label="Auth boundary" value="Admin only" detail="This screen remains inside the authenticated admin shell." tone="success" />
              <HealthCard icon={HardDrive} label="Backup actions" value="Read only" detail="No new backup or restore actions were added in this phase." tone="info" />
              <HealthCard icon={ShieldCheck} label="Secret safety" value="Masked" detail="Configuration values are summarized without raw secrets." tone="success" />
            </section>
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
