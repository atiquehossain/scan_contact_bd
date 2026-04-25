"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState, ErrorState, formatDate, LoadingState, PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [admin, setAdmin] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ logs: any[] }>("/admin/audit-logs");
      setLogs(data.logs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load audit logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const actions = Array.from(new Set(logs.map((log) => log.action))).sort();
  const entities = Array.from(new Set(logs.map((log) => log.entityType))).sort();
  const admins = Array.from(new Set(logs.map((log) => log.actor?.email || log.actor?.phone || "System"))).sort();
  const filtered = useMemo(() => logs.filter((log) => {
    const actor = log.actor?.email || log.actor?.phone || "System";
    return (action === "all" || log.action === action) && (entity === "all" || log.entityType === entity) && (admin === "all" || actor === admin);
  }), [logs, action, entity, admin]);

  return (
    <AdminShell>
      <PageHeader title="Audit Logs" description="Read-only trail of admin and sensitive system actions." breadcrumbs={[{ label: "Admin", href: "/admin/overview" }, { label: "Audit Logs" }]} />

      <Panel>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-bold">Action type
            <select value={action} onChange={(event) => setAction(event.target.value)} className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal">
              <option value="all">All actions</option>
              {actions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">Admin
            <select value={admin} onChange={(event) => setAdmin(event.target.value)} className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal">
              <option value="all">All admins</option>
              {admins.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">Entity type
            <select value={entity} onChange={(event) => setEntity(event.target.value)} className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal">
              <option value="all">All entities</option>
              {entities.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </Panel>

      <div className="mt-5">
        {loading ? <LoadingState label="Loading audit logs..." /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && logs.length === 0 ? <EmptyState title="No audit logs" body="Audit records will appear after admin login or sensitive admin actions." /> : null}
        {!loading && !error && logs.length > 0 ? (
          <Panel>
            {filtered.length === 0 ? <EmptyState title="No matching audit logs" body="Change filters to see audit records." /> : null}
            {filtered.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]">
                    <tr>
                      <th className="py-3 pr-3">Time</th>
                      <th className="py-3 pr-3">Admin</th>
                      <th className="py-3 pr-3">Action</th>
                      <th className="py-3 pr-3">Entity</th>
                      <th className="py-3 pr-3">Status</th>
                      <th className="py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {filtered.map((log) => (
                      <tr key={log.id}>
                        <td className="py-4 pr-3">{formatDate(log.createdAt)}</td>
                        <td className="py-4 pr-3">{log.actor?.email || log.actor?.phone || "System"}</td>
                        <td className="py-4 pr-3 font-black">{log.action}</td>
                        <td className="py-4 pr-3">{log.entityType}{log.entityId ? ` / ${log.entityId}` : ""}</td>
                        <td className="py-4 pr-3"><StatusBadge tone={String(log.action).includes("FAILURE") || String(log.action).includes("DENIED") ? "danger" : "success"}>{String(log.metadata?.result || "recorded")}</StatusBadge></td>
                        <td className="py-4"><pre className="max-w-md overflow-auto rounded bg-[#f8fbf9] p-2 text-xs">{JSON.stringify(log.metadata || {}, null, 2)}</pre></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </Panel>
        ) : null}
      </div>
    </AdminShell>
  );
}
