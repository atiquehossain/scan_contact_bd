"use client";

import { useEffect, useMemo, useState } from "react";
import { LockKeyhole, Search, ShieldCheck, Trash2, UserCheck, UsersRound } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button, ConfirmDialog, EmptyState, ErrorState, formatDate, StatusBadge, ToastNotification, cx } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

type AdminUser = {
  id: string;
  phone?: string | null;
  email?: string | null;
  fullName?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  deletedAt?: string | null;
  lastLoginAt?: string | null;
  roles?: string[];
  userRoles?: Array<{ role?: { name?: string | null } | null }>;
};

function rolesFor(user: AdminUser) {
  const roles = user.roles?.length ? user.roles : user.userRoles?.map((entry) => entry.role?.name).filter(Boolean);
  return (roles || []) as string[];
}

function humanize(value?: string | null) {
  if (!value) return "Not available";
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function statusTone(status?: string | null): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "ACTIVE") return "success";
  if (status === "SUSPENDED" || status === "DELETED" || status === "BANNED") return "danger";
  if (status === "PENDING" || status === "INACTIVE") return "warning";
  return "neutral";
}

function roleTone(role: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (role === "SUPER_ADMIN") return "warning";
  if (role.includes("ADMIN") || role.includes("MANAGER")) return "info";
  if (role === "USER") return "success";
  return "neutral";
}

function displayName(user: AdminUser) {
  return user.fullName || user.email || user.phone || "Unnamed user";
}

function isSuperAdmin(user: AdminUser) {
  return rolesFor(user).includes("SUPER_ADMIN");
}

function SummaryCard({
  label,
  value,
  detail,
  tone = "neutral",
  icon: Icon
}: {
  label: string;
  value: number;
  detail: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  icon: typeof UsersRound;
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

function UsersSkeleton() {
  return (
    <div className="grid gap-5" role="status" aria-live="polite" aria-label="Loading users">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="h-3 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-36 animate-pulse rounded bg-slate-200" />
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

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ users: AdminUser[] }>("/admin/users");
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
    return users.filter((user) => {
      const haystack = [
        user.fullName,
        user.email,
        user.phone,
        user.status,
        ...rolesFor(user)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return !needle || haystack.includes(needle);
    });
  }, [users, query]);

  const summary = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.status === "ACTIVE").length,
    adminUsers: users.filter((user) => rolesFor(user).some((role) => role.includes("ADMIN") || role.includes("MANAGER"))).length,
    protectedUsers: users.filter(isSuperAdmin).length
  }), [users]);

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

  return (
    <AdminShell>
      <div className="grid gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
              <a href="/admin/overview" className="font-bold text-[var(--color-primary)] hover:underline">Admin</a>
              <span aria-hidden>/</span>
              <span>Users</span>
            </nav>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]">User operations</p>
            <h1 className="mt-1 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-ink-strong)]">Users</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
              Search platform users, review roles, and manage access safely.
            </p>
          </div>
          <StatusBadge tone="warning">Super admin protected</StatusBadge>
        </header>

        {loading ? <UsersSkeleton /> : null}
        {error ? <ErrorState message={error} onRetry={load} /> : null}

        {!loading && !error ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="User summary">
              <SummaryCard icon={UsersRound} label="Total users" value={summary.total} detail="All accounts returned by admin API" tone="info" />
              <SummaryCard icon={UserCheck} label="Active users" value={summary.active} detail="Currently active accounts" tone="success" />
              <SummaryCard icon={ShieldCheck} label="Admin users" value={summary.adminUsers} detail="Admin or manager role accounts" tone={summary.adminUsers ? "info" : "neutral"} />
              <SummaryCard icon={LockKeyhole} label="Protected" value={summary.protectedUsers} detail="Super admin accounts cannot be deleted" tone={summary.protectedUsers ? "warning" : "neutral"} />
            </section>

            <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
              <label className="grid max-w-2xl gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="user-search">
                Search users
                <span className="relative">
                  <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                  <input
                    id="user-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search name, email, phone, status, or role"
                    className="focus-ring min-h-11 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] py-2.5 pl-10 pr-3 font-medium text-[var(--color-ink)] placeholder:text-slate-400"
                  />
                </span>
              </label>
            </section>

            {users.length === 0 ? (
              <EmptyState title="No users" body="Users will appear after admin creates owner QR tags or owners use the app." />
            ) : (
              <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-card)]">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--color-ink-strong)]">User directory</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{filtered.length} user{filtered.length === 1 ? "" : "s"} match this view.</p>
                  </div>
                  <StatusBadge tone="info">Admin only</StatusBadge>
                </div>

                {filtered.length === 0 ? <EmptyState title="No matching users" body="Change the search text to see users." /> : null}

                {filtered.length > 0 ? (
                  <>
                    <div className="hidden overflow-x-auto xl:block">
                      <table className="min-w-full text-left text-sm">
                        <thead className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-muted)]">
                          <tr className="border-b border-[var(--color-border)]">
                            <th className="py-3 pr-4">User</th>
                            <th className="py-3 pr-4">Contact</th>
                            <th className="py-3 pr-4">Roles</th>
                            <th className="py-3 pr-4">Status</th>
                            <th className="py-3 pr-4">Created</th>
                            <th className="py-3 pr-4">Last active</th>
                            <th className="py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((user) => {
                            const roles = rolesFor(user);
                            const superAdmin = isSuperAdmin(user);
                            return (
                              <tr key={user.id} className="border-b border-slate-100 last:border-0">
                                <td className="py-4 pr-4">
                                  <p className="font-bold text-[var(--color-ink-strong)]">{displayName(user)}</p>
                                  <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">{user.id}</p>
                                </td>
                                <td className="py-4 pr-4">
                                  <p className="font-semibold text-[var(--color-ink)]">{user.email || "No email"}</p>
                                  <p className="mt-1 text-xs font-semibold text-[var(--color-muted)]">{user.phone || "No phone"}</p>
                                </td>
                                <td className="py-4 pr-4">
                                  <div className="flex flex-wrap gap-1.5">
                                    {roles.length ? roles.map((role) => <StatusBadge key={role} tone={roleTone(role)}>{humanize(role)}</StatusBadge>) : <StatusBadge>User</StatusBadge>}
                                  </div>
                                </td>
                                <td className="py-4 pr-4"><StatusBadge tone={statusTone(user.status)}>{humanize(user.status)}</StatusBadge></td>
                                <td className="py-4 pr-4">{formatDate(user.createdAt)}</td>
                                <td className="py-4 pr-4">{formatDate(user.lastLoginAt || user.updatedAt)}</td>
                                <td className="py-4">
                                  {superAdmin ? (
                                    <div className="grid gap-1">
                                      <StatusBadge tone="warning">Protected super admin</StatusBadge>
                                      <p className="text-xs font-semibold text-[var(--color-muted)]">Super admin accounts cannot be deleted.</p>
                                    </div>
                                  ) : (
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

                    <div className="grid gap-3 xl:hidden">
                      {filtered.map((user) => {
                        const roles = rolesFor(user);
                        const superAdmin = isSuperAdmin(user);
                        return (
                          <article key={user.id} className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#fbfdfc] p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <h2 className="font-bold text-[var(--color-ink-strong)]">{displayName(user)}</h2>
                                <p className="mt-1 text-sm text-[var(--color-muted)]">{user.email || user.phone || "No contact"}</p>
                              </div>
                              <StatusBadge tone={statusTone(user.status)}>{humanize(user.status)}</StatusBadge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {roles.length ? roles.map((role) => <StatusBadge key={role} tone={roleTone(role)}>{humanize(role)}</StatusBadge>) : <StatusBadge>User</StatusBadge>}
                            </div>
                            <dl className="mt-4 grid gap-2 sm:grid-cols-2">
                              <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-3 text-sm">
                                <dt className="text-xs font-semibold text-[var(--color-muted)]">Phone</dt>
                                <dd className="mt-1 font-bold text-[var(--color-ink)]">{user.phone || "No phone"}</dd>
                              </div>
                              <div className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-white p-3 text-sm">
                                <dt className="text-xs font-semibold text-[var(--color-muted)]">Created</dt>
                                <dd className="mt-1 font-bold text-[var(--color-ink)]">{formatDate(user.createdAt)}</dd>
                              </div>
                            </dl>
                            <div className="mt-4">
                              {superAdmin ? (
                                <div className="rounded-[var(--radius-button)] border border-amber-200 bg-[var(--color-warning-bg)] p-3">
                                  <StatusBadge tone="warning">Protected super admin</StatusBadge>
                                  <p className="mt-2 text-sm font-semibold text-[var(--color-warning-text)]">Super admin accounts cannot be deleted.</p>
                                </div>
                              ) : (
                                <Button variant="danger" className="w-full" onClick={() => setDeleteTarget(user)}>
                                  <Trash2 aria-hidden size={15} />Delete user
                                </Button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </section>
            )}
          </>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        body={
          <div className="grid gap-3">
            <p>Delete <strong>{deleteTarget ? displayName(deleteTarget) : "this user"}</strong>? This removes their account, owned QR tags, contact requests, notifications, sessions, and matching COD orders.</p>
            <p className="rounded-[var(--radius-button)] border border-red-200 bg-[var(--color-danger-bg)] p-3 font-bold text-[var(--color-danger)]">
              This action is destructive and should only be used for eligible non-super-admin accounts.
            </p>
          </div>
        }
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
