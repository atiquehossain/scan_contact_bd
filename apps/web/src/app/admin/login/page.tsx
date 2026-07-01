"use client";

import { FormEvent } from "react";
import { ArrowRight, AtSign, LockKeyhole, QrCode, ShieldCheck } from "lucide-react";
import { API_BASE, clientDebugLog } from "@/lib/api";
import { Button, InlineAlert } from "@/components/admin/ui";
import { BRAND_NAME } from "@/lib/brand";

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
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[linear-gradient(180deg,rgba(250,248,255,0.96),rgba(248,250,252,0.98))] px-4 py-10 text-[var(--color-ink)]">
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(var(--color-primary)_1px,transparent_1px),linear-gradient(90deg,var(--color-primary)_1px,transparent_1px)] [background-size:28px_28px]" />
      <section className="relative z-10 w-full max-w-[440px] rounded-[24px] border border-white/70 bg-white/90 p-6 shadow-[0_8px_32px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
        <div className="mb-7 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-[var(--radius-card)] bg-[var(--color-primary)] text-white shadow-[var(--shadow-card)]">
            <QrCode aria-hidden size={32} />
          </span>
          <p className="mt-4 text-[32px] font-bold leading-10 tracking-[-0.02em] text-[var(--color-primary)]">{BRAND_NAME}</p>
          <h1 className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">Admin Console</h1>
        </div>

        <div className="mb-6 rounded-[var(--radius-card)] border border-teal-200 bg-[var(--color-primary-soft)] p-4 text-sm leading-6 text-[var(--color-primary-hover)]">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold text-[var(--color-ink-strong)]">Admin access is protected and monitored.</p>
              <p className="mt-1">Use an authorized NoNumQR operator account to continue.</p>
            </div>
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
            <span className="relative">
              <AtSign aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
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
                placeholder="admin@nonumqr.com"
                className="focus-ring min-h-12 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] py-3 pl-10 pr-3 font-normal text-[var(--color-ink)] placeholder:text-[var(--color-muted)]"
              />
            </span>
          </label>

          <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="admin-password">
            Password
            <span className="relative">
              <LockKeyhole aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                placeholder="Enter password"
                className="focus-ring min-h-12 w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] py-3 pl-10 pr-3 font-normal text-[var(--color-ink)] placeholder:text-[var(--color-muted)]"
              />
            </span>
          </label>

          <Button type="submit" className="mt-2 min-h-12 w-full">
            <LockKeyhole aria-hidden size={18} />
            Login to Console
            <ArrowRight aria-hidden size={17} />
          </Button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-[var(--color-muted)]">
          Unauthorized access is prohibited. Activity may be logged for security and audit review.
        </p>
      </section>
    </main>
  );
}
