"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, ClipboardList, FileWarning, History, LogOut, Menu, QrCode, Settings, ShieldCheck, ShoppingBag, Users, X } from "lucide-react";
import { apiFetch, authToken, clearAuth, clientDebugLog, refreshToken, saveAuth } from "@/lib/api";
import { Button, cx } from "./ui";

type AdminUser = {
  id: string;
  email?: string | null;
  phone: string;
  fullName?: string | null;
  roles?: string[];
  userRoles?: Array<{ role: { name: string } }>;
};

const navItems = [
  { label: "Overview", href: "/admin/overview", icon: BarChart3 },
  { label: "Tags", href: "/admin/tags/new", icon: QrCode },
  { label: "Owners", href: "/admin/owners", icon: Users },
  { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { label: "Users", href: "/admin/users", icon: ClipboardList },
  { label: "Reports", href: "/admin/reports", icon: FileWarning },
  { label: "Audit Logs", href: "/admin/audit", icon: History },
  { label: "Settings", href: "/admin/settings", icon: Settings }
];

function isAdmin(user: AdminUser | null) {
  const roles = user?.roles || user?.userRoles?.map((entry) => entry.role.name) || [];
  return roles.some((role) => ["SUPER_ADMIN", "SUPPORT_ADMIN", "ORDER_MANAGER"].includes(role));
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      clientDebugLog("admin.shell.check.start", { path: pathname, tokenPresent: Boolean(authToken()) });
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get("accessToken");
        const nextRefreshToken = params.get("refreshToken");
        if (accessToken && nextRefreshToken) {
          clientDebugLog("admin.shell.queryTokens.found", { accessTokenPresent: true, refreshTokenPresent: true });
          saveAuth({ accessToken, refreshToken: nextRefreshToken });
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
      try {
        const data = await apiFetch<{ user: AdminUser }>("/me");
        if (!mounted) return;
        const roles = data.user?.roles || data.user?.userRoles?.map((entry) => entry.role.name) || [];
        clientDebugLog("admin.shell.me.loaded", { userId: data.user?.id, roles });
        if (!isAdmin(data.user)) {
          clientDebugLog("admin.shell.me.notAdmin", { userId: data.user?.id, roles });
          clearAuth();
          router.replace("/admin/login");
          return;
        }
        setAdmin(data.user);
        setChecking(false);
      } catch (error) {
        clientDebugLog("admin.shell.check.failed", { error: error instanceof Error ? error.message : "unknown" });
        clearAuth();
        router.replace("/admin/login");
      }
    }
    check();
    return () => {
      mounted = false;
    };
  }, [router]);

  const activeLabel = useMemo(() => navItems.find((item) => pathname.startsWith(item.href.replace("/new", "")))?.label || "Admin", [pathname]);

  async function logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken: refreshToken() }) });
    } catch {
      // Session cleanup still happens locally if the server cannot be reached.
    }
    clearAuth();
    router.replace("/admin/login");
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-[var(--color-border)] bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-[var(--color-border)] px-5">
        <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white">
          <ShieldCheck aria-hidden size={22} />
        </span>
        <div>
          <p className="font-black text-[var(--color-ink)]">ScanContact BD</p>
          <p className="text-xs font-bold text-[var(--color-muted)]">Admin control panel</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href.replace("/new", ""));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              className={cx(
                "focus-ring flex items-center gap-3 rounded-[var(--radius-button)] px-3 py-2 text-sm font-bold",
                active ? "bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)]" : "text-[var(--color-muted)] hover:bg-[#f8fbf9] hover:text-[var(--color-ink)]"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon aria-hidden size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--color-border)] p-4">
        <p className="truncate text-sm font-black text-[var(--color-ink)]">{admin?.fullName || "Admin"}</p>
        <p className="truncate text-xs text-[var(--color-muted)]">{admin?.email || admin?.phone}</p>
        <Button className="mt-3 w-full" variant="secondary" onClick={logout}>
          <LogOut aria-hidden size={16} />
          Logout
        </Button>
      </div>
    </aside>
  );

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] p-6">
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-6 text-sm font-bold text-[var(--color-muted)] shadow-[var(--shadow-card)]">
          Checking admin session...
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-page-bg)]">
      <div className="hidden fixed inset-y-0 left-0 z-30 lg:block">{sidebar}</div>
      {drawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation drawer">
          <button className="absolute inset-0 bg-black/35" aria-label="Close navigation" onClick={() => setDrawerOpen(false)} />
          <div className="relative h-full">{sidebar}</div>
        </div>
      ) : null}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-white/95 px-4 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <button className="focus-ring grid h-10 w-10 place-items-center rounded-[var(--radius-button)] border border-[var(--color-border)] lg:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open navigation">
              <Menu aria-hidden size={20} />
            </button>
            <div>
              <p className="text-sm font-black text-[var(--color-ink)]">{activeLabel}</p>
              <p className="text-xs text-[var(--color-muted)]">Admin-only web dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-black text-[var(--color-ink)]">{admin?.fullName || "Admin"}</p>
              <p className="text-xs text-[var(--color-muted)]">{admin?.email || admin?.phone}</p>
            </div>
            <Button variant="secondary" onClick={logout}>
              <LogOut aria-hidden size={16} />
              Logout
            </Button>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
      {drawerOpen ? (
        <button className="focus-ring fixed right-3 top-3 z-50 grid h-10 w-10 place-items-center rounded-full bg-white shadow lg:hidden" onClick={() => setDrawerOpen(false)} aria-label="Close navigation">
          <X aria-hidden size={20} />
        </button>
      ) : null}
    </div>
  );
}
