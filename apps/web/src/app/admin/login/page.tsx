"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { apiFetch, authToken, saveAuth } from "@/lib/api";
import { Button, FieldError, InlineAlert } from "@/components/admin/ui";

const developmentEmail = process.env.NODE_ENV === "production" ? "" : "atique@atique.com";

export default function AdminLoginPage() {
  const router = useRouter();
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState(developmentEmail);
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; summary?: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authToken()) router.replace("/admin/overview");
  }, [router]);

  function validate() {
    const nextErrors: typeof errors = {};
    if (!email.trim()) nextErrors.email = "Admin email is required.";
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "Enter a valid admin email.";
    if (!password) nextErrors.password = "Admin password is required.";
    return nextErrors;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors({ ...nextErrors, summary: "Please fix the highlighted fields." });
      window.setTimeout(() => errorSummaryRef.current?.focus(), 0);
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      const data = await apiFetch<{ accessToken: string; refreshToken: string }>("/auth/admin-login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password })
      }, "");
      saveAuth(data);
      router.replace("/admin/overview");
    } catch {
      setErrors({ summary: "Invalid email or password." });
      window.setTimeout(() => errorSummaryRef.current?.focus(), 0);
    } finally {
      setLoading(false);
    }
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

        {errors.summary ? (
          <div ref={errorSummaryRef} tabIndex={-1} className="mb-4">
            <InlineAlert tone="danger" title="Login failed">{errors.summary}</InlineAlert>
          </div>
        ) : null}

        <form className="grid gap-4" onSubmit={submit} noValidate>
          <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="admin-email">
            Email
            <input
              id="admin-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "admin-email-error" : undefined}
              className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal"
            />
            <FieldError id="admin-email-error">{errors.email}</FieldError>
          </label>

          <label className="grid gap-2 text-sm font-bold text-[var(--color-ink)]" htmlFor="admin-password">
            Password
            <input
              id="admin-password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "admin-password-error" : undefined}
              className="focus-ring rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal"
            />
            <FieldError id="admin-password-error">{errors.password}</FieldError>
          </label>

          <Button type="submit" loading={loading} className="w-full">
            <LockKeyhole aria-hidden size={18} />
            Login
          </Button>
        </form>
      </section>
    </main>
  );
}
