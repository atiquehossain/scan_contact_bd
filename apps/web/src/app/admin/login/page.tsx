"use client";

import { FormEvent } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { API_BASE, clientDebugLog } from "@/lib/api";
import { Button, InlineAlert } from "@/components/admin/ui";

const developmentEmail = process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL || "";

export default function AdminLoginPage() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const formData = new FormData(form);
    clientDebugLog("admin.login.submit", {
      action: form.action,
      emailPresent: Boolean(formData.get("email")),
      passwordPresent: Boolean(formData.get("password"))
    });
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-page-bg)] px-4 py-10">
      <section className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-card)]">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-[var(--radius-button)] bg-[var(--color-primary)] text-white">
            <ShieldCheck aria-hidden size={25} />
          </span>
          <div>
            <p className="text-sm font-black uppercase text-[var(--color-primary)]">Admin only</p>
            <h1 className="text-3xl font-black text-[var(--color-ink)]">Admin panel</h1>
          </div>
        </div>

        {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("error") === "invalid" ? (
          <div className="mb-4">
            <InlineAlert tone="danger" title="Login failed">Invalid email or password.</InlineAlert>
          </div>
        ) : null}

        <form className="grid gap-4" action={`${API_BASE}/auth/admin-login-form/`} method="post" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="admin-email">
            Email
            <input
              id="admin-email"
              name="email"
              type="text"
              inputMode="email"
              defaultValue={developmentEmail}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
              className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="admin-password">
            Password
            <input
              id="admin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal"
            />
          </label>

          <Button type="submit" className="w-full">
            <LockKeyhole aria-hidden size={18} />
            Login
          </Button>
        </form>
      </section>
    </main>
  );
}
