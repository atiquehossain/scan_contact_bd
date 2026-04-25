"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, EmptyState, ErrorState, formatDate, LoadingState, PageHeader, Panel, StatusBadge, ToastNotification } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch<any>("/admin/operational-reports");
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

  async function updateReport(reportId: string, status: string) {
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

  return (
    <AdminShell>
      <PageHeader title="Reports" description="Review safety and operational records. Abuse reports are prioritized." breadcrumbs={[{ label: "Admin", href: "/admin/overview" }, { label: "Reports" }]} />

      {loading ? <LoadingState label="Loading operational reports..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && data ? (
        <div className="grid gap-6">
          <Panel title={`Abuse reports (${data.abuseReports.length})`} description="High priority records submitted from public QR pages.">
            {data.abuseReports.length === 0 ? <EmptyState title="No abuse reports" body="Submitted abuse reports will appear here." /> : null}
            <div className="space-y-3">
              {data.abuseReports.map((report: any) => (
                <article key={report.id} className="rounded-[var(--radius-card)] border border-red-200 bg-[var(--color-danger-bg)] p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="font-black">{report.reason}</h3><p className="text-[var(--color-muted)]">{report.qrTag?.label || "Unknown tag"} | {formatDate(report.createdAt)}</p></div>
                    <StatusBadge tone={report.status === "OPEN" ? "danger" : "warning"}>{report.status}</StatusBadge>
                  </div>
                  {report.details ? <p className="mt-3 whitespace-pre-wrap">{report.details}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="secondary" loading={updatingId === report.id} onClick={() => updateReport(report.id, "REVIEWING")}>Mark reviewing</Button>
                    <Button variant="secondary" loading={updatingId === report.id} onClick={() => updateReport(report.id, "RESOLVED")}>Mark resolved</Button>
                    <Button variant="secondary" loading={updatingId === report.id} onClick={() => updateReport(report.id, "DISMISSED")}>Dismiss</Button>
                  </div>
                </article>
              ))}
            </div>
          </Panel>

          <Panel title={`Contact requests (${data.contactRequests.length})`}>
            {data.contactRequests.length === 0 ? <EmptyState title="No contact requests" body="Scanner contact requests will appear here." /> : null}
            <div className="space-y-3">
              {data.contactRequests.map((request: any) => (
                <article key={request.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="font-black">{request.reason}</h3><p className="text-[var(--color-muted)]">{request.qrTag?.label || "QR tag"} | {request.owner?.fullName || request.owner?.phone || "Owner"} | {formatDate(request.createdAt)}</p></div>
                    <StatusBadge tone={request.status === "UNREAD" ? "warning" : "success"}>{request.status}</StatusBadge>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap">{request.message}</p>
                </article>
              ))}
            </div>
          </Panel>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title={`Reseller applications (${data.resellerApplications.length})`}>
              {data.resellerApplications.length === 0 ? <EmptyState title="No reseller applications" body="Applications will appear here when users apply." /> : null}
              <div className="space-y-2">
                {data.resellerApplications.map((item: any) => (
                  <div key={item.id} className="rounded border border-[var(--color-border)] p-3 text-sm">
                    <p className="font-black">{item.businessName}</p>
                    <p className="text-[var(--color-muted)]">{item.user?.phone} | {item.status} | {formatDate(item.createdAt)}</p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title={`Societies (${data.societies.length})`}>
              {data.societies.length === 0 ? <EmptyState title="No societies" body="Society accounts will appear here after creation." /> : null}
              <div className="space-y-2">
                {data.societies.map((society: any) => (
                  <div key={society.id} className="rounded border border-[var(--color-border)] p-3 text-sm">
                    <p className="font-black">{society.name}</p>
                    <p className="text-[var(--color-muted)]">{society.city || "No city"} | {formatDate(society.createdAt)}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      ) : null}

      <ToastNotification message={toast} tone={toast.includes("Could not") ? "danger" : "success"} onClose={() => setToast("")} />
    </AdminShell>
  );
}
