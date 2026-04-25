"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(value?: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function formatBdt(value?: number | null) {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(value || 0);
}

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  action
}: {
  title: string;
  description: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {breadcrumbs.length ? (
          <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]">
            {breadcrumbs.map((item, index) => (
              <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
                {item.href ? <Link className="font-bold text-[var(--color-primary)] hover:underline" href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
                {index < breadcrumbs.length - 1 ? <span aria-hidden>/</span> : null}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="text-3xl font-black tracking-tight text-[var(--color-ink)]">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">{description}</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function Button({
  children,
  variant = "primary",
  loading = false,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost"; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" && "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
        variant === "secondary" && "border border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:bg-[#f8fbf9]",
        variant === "danger" && "bg-[var(--color-danger)] text-white hover:bg-red-700",
        variant === "ghost" && "text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]",
        className
      )}
    >
      {loading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}

export function LinkButton({ href, children, variant = "primary", className }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "danger" | "ghost"; className?: string }) {
  return (
    <Link
      href={href}
      className={cx(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] px-4 py-2 text-sm font-bold transition",
        variant === "primary" && "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]",
        variant === "secondary" && "border border-[var(--color-border)] bg-white text-[var(--color-ink)] hover:bg-[#f8fbf9]",
        variant === "danger" && "bg-[var(--color-danger)] text-white hover:bg-red-700",
        variant === "ghost" && "text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function Panel({ title, description, children, action }: { title?: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-card-bg)] p-5 shadow-[var(--shadow-card)]">
      {title || action ? (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-lg font-black text-[var(--color-ink)]">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{description}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function MetricCard({ label, value, href, tone = "neutral", detail }: { label: string; value: ReactNode; href?: string; tone?: "neutral" | "urgent" | "success" | "warning"; detail?: string }) {
  const content = (
    <div
      className={cx(
        "rounded-[var(--radius-card)] border bg-white p-5 shadow-[var(--shadow-card)] transition",
        tone === "urgent" && "border-red-200 bg-[var(--color-danger-bg)]",
        tone === "warning" && "border-amber-200 bg-[var(--color-warning-bg)]",
        tone === "success" && "border-emerald-200 bg-[var(--color-success-bg)]",
        tone === "neutral" && "border-[var(--color-border)]",
        href && "hover:-translate-y-0.5 hover:shadow-md"
      )}
    >
      <p className="text-sm font-bold text-[var(--color-muted)]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[var(--color-ink)]">{value}</p>
      {detail ? <p className="mt-2 text-xs font-semibold text-[var(--color-muted)]">{detail}</p> : null}
    </div>
  );
  return href ? <Link href={href} className="focus-ring block rounded-[var(--radius-card)]">{content}</Link> : content;
}

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black uppercase",
        tone === "neutral" && "border-[var(--color-border)] bg-white text-[var(--color-muted)]",
        tone === "success" && "border-emerald-200 bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
        tone === "warning" && "border-amber-200 bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
        tone === "danger" && "border-red-200 bg-[var(--color-danger-bg)] text-[var(--color-danger)]",
        tone === "info" && "border-teal-200 bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)]"
      )}
    >
      {children}
    </span>
  );
}

export function InlineAlert({ children, tone = "info", title }: { children: ReactNode; tone?: "info" | "success" | "warning" | "danger"; title?: string }) {
  return (
    <div
      className={cx(
        "rounded-[var(--radius-card)] border p-4 text-sm leading-6",
        tone === "info" && "border-teal-200 bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)]",
        tone === "success" && "border-emerald-200 bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
        tone === "warning" && "border-amber-200 bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
        tone === "danger" && "border-red-200 bg-[var(--color-danger-bg)] text-[var(--color-danger)]"
      )}
      role={tone === "danger" ? "alert" : "status"}
    >
      {title ? <p className="mb-1 font-black">{title}</p> : null}
      {children}
    </div>
  );
}

export function LoadingState({ label = "Loading data..." }: { label?: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-6 text-sm font-bold text-[var(--color-muted)]" role="status">
      <Loader2 aria-hidden className="mr-2 inline h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-red-200 bg-[var(--color-danger-bg)] p-5 text-sm text-[var(--color-danger)]" role="alert">
      <p className="font-black"><AlertTriangle aria-hidden className="mr-2 inline h-4 w-4" />Something went wrong</p>
      <p className="mt-1">{message}</p>
      {onRetry ? <Button className="mt-3" variant="secondary" onClick={onRetry}>Retry</Button> : null}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-white p-8 text-center">
      <p className="text-lg font-black text-[var(--color-ink)]">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted)]">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ToastNotification({ message, tone = "success", onClose }: { message: string; tone?: "success" | "danger" | "info"; onClose: () => void }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white p-4 shadow-lg" role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        {tone === "success" ? <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 text-[var(--color-success-text)]" /> : <AlertTriangle aria-hidden className="mt-0.5 h-5 w-5 text-[var(--color-danger)]" />}
        <p className="text-sm font-bold text-[var(--color-ink)]">{message}</p>
        <button className="focus-ring ml-auto rounded p-1" onClick={onClose} aria-label="Close notification">
          <X aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 0);

    function onKeyDown(event: KeyboardEvent) {
      if (!dialogRef.current) return;
      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [loading, onCancel, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4" role="presentation">
      <section ref={dialogRef} tabIndex={-1} aria-modal="true" role="dialog" aria-labelledby="confirm-title" className="focus-ring w-full max-w-md rounded-[var(--radius-card)] bg-white p-5 shadow-xl">
        <h2 id="confirm-title" className="text-xl font-black text-[var(--color-ink)]">{title}</h2>
        <div className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{body}</div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </section>
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return <p id={id} className="mt-1 text-sm font-bold text-[var(--color-danger)]">{children}</p>;
}
