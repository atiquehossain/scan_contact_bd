"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, ConfirmDialog, EmptyState, ErrorState, formatDate, LoadingState, PageHeader, Panel, StatusBadge, ToastNotification } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ users: any[] }>("/admin/users");
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) => !needle || user.fullName?.toLowerCase().includes(needle) || user.email?.toLowerCase().includes(needle) || user.phone?.includes(needle));
  }, [users, query]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiFetch(`/admin/users/${deleteTarget.id}`, { method: "DELETE" });
      setUsers((items) => items.filter((item) => item.id !== deleteTarget.id));
      setToast("User deleted.");
      setDeleteTarget(null);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Could not delete user.");
    } finally {
      setDeleting(false);
    }
  }

  function rolesFor(user: any) {
    return user.userRoles?.map((entry: any) => entry.role?.name).filter(Boolean) || [];
  }

  return (
    <AdminShell>
      <PageHeader title="Users" description="Manage admin-created owner accounts and app users. Super admin accounts are protected." breadcrumbs={[{ label: "Admin", href: "/admin/overview" }, { label: "Users" }]} />

      <Panel>
        <label className="grid max-w-xl gap-2 text-sm font-bold" htmlFor="user-search">
          Search users
          <span className="relative">
            <Search aria-hidden className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
            <input id="user-search" value={query} onChange={(event) => setQuery(event.target.value)} className="focus-ring w-full rounded-[var(--radius-button)] border border-[var(--color-border)] py-3 pl-10 pr-3 font-normal" />
          </span>
        </label>
      </Panel>

      <div className="mt-5">
        {loading ? <LoadingState label="Loading users..." /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}
        {!loading && !error && users.length === 0 ? <EmptyState title="No users" body="Users will appear after admin creates owner QR tags or owners use the app." /> : null}
        {!loading && !error && users.length > 0 ? (
          <Panel>
            {filtered.length === 0 ? <EmptyState title="No matching users" body="Change the search text to see users." /> : null}
            {filtered.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]">
                    <tr>
                      <th className="py-3 pr-3">Full name</th>
                      <th className="py-3 pr-3">Email</th>
                      <th className="py-3 pr-3">Phone</th>
                      <th className="py-3 pr-3">Role</th>
                      <th className="py-3 pr-3">Status</th>
                      <th className="py-3 pr-3">Created</th>
                      <th className="py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {filtered.map((user) => {
                      const roles = rolesFor(user);
                      const superAdmin = roles.includes("SUPER_ADMIN");
                      return (
                        <tr key={user.id}>
                          <td className="py-4 pr-3 font-black">{user.fullName || "Unnamed user"}</td>
                          <td className="py-4 pr-3">{user.email || "No email"}</td>
                          <td className="py-4 pr-3">{user.phone}</td>
                          <td className="py-4 pr-3"><div className="flex flex-wrap gap-1">{roles.length ? roles.map((role: string) => <StatusBadge key={role} tone={role === "SUPER_ADMIN" ? "info" : "neutral"}>{role === "SUPER_ADMIN" ? "Super admin" : role}</StatusBadge>) : <StatusBadge>User</StatusBadge>}</div></td>
                          <td className="py-4 pr-3"><StatusBadge tone={user.status === "ACTIVE" ? "success" : "warning"}>{user.status}</StatusBadge></td>
                          <td className="py-4 pr-3">{formatDate(user.createdAt)}</td>
                          <td className="py-4">
                            {superAdmin ? null : (
                              <Button variant="danger" onClick={() => setDeleteTarget(user)}>
                                <Trash2 aria-hidden size={15} />Delete user
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </Panel>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        body={<p>Delete <strong>{deleteTarget?.fullName || deleteTarget?.email || deleteTarget?.phone}</strong>? This removes their account, owned QR tags, contact requests, notifications, sessions, and matching COD orders.</p>}
        confirmLabel="Delete user"
        cancelLabel="Keep user"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
      <ToastNotification message={toast} tone={toast.includes("Could not") ? "danger" : "success"} onClose={() => setToast("")} />
    </AdminShell>
  );
}
