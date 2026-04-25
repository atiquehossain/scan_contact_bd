"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, ErrorState, formatDate, LoadingState, PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const [health, setHealth] = useState<any>(null);
  const [settings, setSettings] = useState<any[]>([]);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [healthData, settingsData, backupData] = await Promise.all([
        apiFetch<any>("/admin/system-health"),
        apiFetch<{ settings: any[] }>("/admin/settings"),
        apiFetch<{ backups: any[] }>("/admin/backups")
      ]);
      setHealth(healthData);
      setSettings(settingsData.settings);
      setBackups(backupData.backups);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load settings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminShell>
      <PageHeader title="Settings" description="Operational health, stored settings, and backup status. No static settings are created automatically." breadcrumbs={[{ label: "Admin", href: "/admin/overview" }, { label: "Settings" }]} />

      {loading ? <LoadingState label="Loading settings..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <div className="grid gap-6">
          <Panel title="System health">
            <div className="grid gap-4 text-sm md:grid-cols-3">
              <div><p className="font-bold text-[var(--color-muted)]">API</p><p className="mt-1"><StatusBadge tone={health?.ok ? "success" : "danger"}>{health?.ok ? "Healthy" : "Unavailable"}</StatusBadge></p></div>
              <div><p className="font-bold text-[var(--color-muted)]">Database</p><p className="mt-1 font-black">{health?.db || "Unknown"}</p></div>
              <div><p className="font-bold text-[var(--color-muted)]">Server time</p><p className="mt-1 font-black">{formatDate(health?.time)}</p></div>
            </div>
          </Panel>

          <Panel title="App settings">
            {settings.length === 0 ? <EmptyState title="No settings rows" body="Settings will appear after an admin creates them through supported operational workflows." /> : null}
            <div className="space-y-2">
              {settings.map((setting) => (
                <div key={setting.id || setting.key} className="rounded border border-[var(--color-border)] p-3 text-sm">
                  <p className="font-black">{setting.key}</p>
                  <pre className="mt-2 overflow-auto rounded bg-[#f8fbf9] p-2 text-xs">{JSON.stringify(setting.value, null, 2)}</pre>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Backup status">
            {backups.length === 0 ? <EmptyState title="No backup logs" body="Backup logs will appear after backup scripts run." /> : null}
            <div className="space-y-2">
              {backups.map((backup) => (
                <div key={backup.id} className="rounded border border-[var(--color-border)] p-3 text-sm">
                  <p className="font-black">{backup.type || "Backup"} | {backup.status}</p>
                  <p className="text-[var(--color-muted)]">{formatDate(backup.createdAt)}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}
    </AdminShell>
  );
}
