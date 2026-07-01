"use client";

import { useParams, usePathname, useSearchParams } from "next/navigation";
import { LockKeyhole, ShieldCheck, TimerReset } from "lucide-react";
import { PublicConversation } from "@/components/PublicConversation";
import { InlineAlert } from "@/components/admin/ui";
import { BRAND_NAME } from "@/lib/brand";

function conversationIdFromPath(pathname: string, fallback?: string) {
  const value = pathname.split("/").filter(Boolean).pop() || fallback || "";
  return value.startsWith("__") ? fallback || "" : decodeURIComponent(value);
}

export function PublicConversationRoute() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const id = conversationIdFromPath(pathname, routeId);
  const token = searchParams.get("token") || "";

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,rgba(250,248,255,0.92),rgba(248,250,252,0.98))] px-4 py-4 text-[var(--color-ink)] sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col gap-4">
        <header className="flex min-h-14 items-center justify-between rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white/90 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-button)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <ShieldCheck aria-hidden size={21} />
            </span>
            <div>
              <p className="text-sm font-bold text-[var(--color-primary)]">{BRAND_NAME}</p>
              <p className="text-xs font-medium text-[var(--color-muted)]">Private conversation</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-[var(--color-success-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--color-success-text)]">
            <LockKeyhole aria-hidden size={14} />
            Token protected
          </span>
        </header>

        <section className="rounded-[var(--radius-card-lg)] border border-teal-200 bg-[var(--color-primary-soft)] p-4 text-sm leading-6 text-[var(--color-primary-hover)] shadow-[var(--shadow-card)]">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold text-[var(--color-ink-strong)]">This private conversation is protected by your link.</p>
              <p className="mt-1">The owner&apos;s phone number stays hidden.</p>
              <p className="mt-1">Conversations expire for safety.</p>
            </div>
          </div>
        </section>

        {id && token ? (
          <PublicConversation contactRequestId={id} token={token} variant="route" />
        ) : (
          <section className="grid flex-1 place-items-center rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white p-5 text-center shadow-[var(--shadow-card)]">
            <div className="max-w-md">
              <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-surface-soft)] text-[var(--color-muted)]">
                <TimerReset aria-hidden size={30} />
              </span>
              <h1 className="mt-4 text-2xl font-bold tracking-[-0.01em] text-[var(--color-ink-strong)]">This private conversation link is incomplete.</h1>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Please open the full conversation link you received after sending your message.
              </p>
              <div className="mt-4">
                <InlineAlert tone="warning">The owner&apos;s phone number stays hidden, even when a link is missing or invalid.</InlineAlert>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
