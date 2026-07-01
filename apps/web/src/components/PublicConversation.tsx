"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, LockKeyhole, MessageSquareText, QrCode, Send, ShieldCheck, TimerOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { safePublicLabel } from "@/lib/brand";
import { Button, InlineAlert, LoadingState, StatusBadge } from "@/components/admin/ui";

type ChatMessage = {
  id: string;
  sender: "SCANNER" | "OWNER" | "SYSTEM";
  senderName?: string | null;
  body: string;
  createdAt: string;
};

type ContactThread = {
  id: string;
  tagLabel: string;
  reason: string;
  status: string;
  createdAt?: string | null;
  expiresAt?: string | null;
};

function formatConversationTime(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-BD", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatConversationDate(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-BD", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function statusBadgeLabel(status?: string | null) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "OPEN") return "Private link active";
  if (normalized === "EXPIRED") return "Expired";
  if (normalized === "CLOSED") return "Closed";
  if (normalized === "DELETED") return "Unavailable";
  return "Unavailable";
}

function reasonLabel(reason?: string | null) {
  return String(reason || "Private request")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function unavailableCopy(status?: string | null) {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "CLOSED") {
    return {
      title: "This conversation is closed.",
      body: "You can no longer send new messages here. The owner's phone number remains hidden."
    };
  }
  if (normalized === "DELETED") {
    return {
      title: "This conversation is no longer available.",
      body: "The secure link cannot be used now. The owner's phone number remains hidden."
    };
  }
  return {
    title: "This conversation has expired.",
    body: "You can no longer send new messages here. The owner's phone number remains hidden."
  };
}

export function PublicConversation({
  contactRequestId,
  token,
  scannerName,
  variant = "embedded"
}: {
  contactRequestId: string;
  token: string;
  scannerName?: string;
  variant?: "embedded" | "route";
}) {
  const [thread, setThread] = useState<ContactThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function load() {
    const data = await apiFetch<{ contactRequest: ContactThread; messages: ChatMessage[] }>(
      `/public/contact-requests/${contactRequestId}/messages?token=${encodeURIComponent(token)}`,
      {},
      ""
    );
    setThread(data.contactRequest);
    setMessages(data.messages);
    setUnavailable(data.contactRequest.status !== "OPEN");
    setLoading(false);
  }

  useEffect(() => {
    load().catch((error) => {
      setUnavailable(true);
      setLoading(false);
      setStatus(error instanceof Error ? error.message : "Unable to load conversation");
    });
    const timer = window.setInterval(() => {
      if (!unavailable) load().catch(() => undefined);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [contactRequestId, token, unavailable]);

  async function sendMessage() {
    if (body.trim().length < 1) return;
    setSending(true);
    try {
      await apiFetch(
        `/public/contact-requests/${contactRequestId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ token, body: body.trim(), senderName: scannerName || undefined })
        },
        ""
      );
      setBody("");
      setStatus("Sent.");
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Message could not be sent.");
      if (error instanceof Error && error.message.toLowerCase().includes("expired")) {
        setUnavailable(true);
      }
    } finally {
      setSending(false);
    }
  }

  const isRoute = variant === "route";
  const unavailableDetails = unavailableCopy(thread?.status);
  const statusTone = status.toLowerCase().includes("sent") ? "success" : "warning";

  return (
    <section
      className={`rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-card)] ${
        isRoute ? "flex min-h-[620px] flex-1 flex-col overflow-hidden" : "mt-5 p-4"
      }`}
    >
      <div className={`border-b border-[var(--color-border)] bg-white ${isRoute ? "p-4 sm:p-5" : "rounded-[var(--radius-card)] p-4"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-button)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <QrCode aria-hidden size={22} />
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--color-primary)] text-white ring-2 ring-white">
                <MessageSquareText aria-hidden size={11} />
              </span>
              <span className="absolute -bottom-1 -left-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[var(--color-primary)] ring-1 ring-[var(--color-border)]">
                <ShieldCheck aria-hidden size={11} />
              </span>
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-[-0.01em] text-[var(--color-ink-strong)]">Private Chat</h2>
              {thread ? (
                <p className="mt-1 truncate text-sm leading-5 text-[var(--color-muted)]">
                  {safePublicLabel(thread.tagLabel)} | {reasonLabel(thread.reason)}
                </p>
              ) : (
                <p className="mt-1 text-sm leading-5 text-[var(--color-muted)]">Checking private conversation access...</p>
              )}
            </div>
          </div>
          {thread ? (
            <StatusBadge tone={thread.status === "OPEN" ? "success" : "warning"}>{statusBadgeLabel(thread.status)}</StatusBadge>
          ) : (
            <StatusBadge tone="info">Checking access</StatusBadge>
          )}
        </div>

        {thread ? (
          <dl className="mt-4 grid gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] p-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--color-muted)]">Tag</dt>
              <dd className="mt-1 font-semibold text-[var(--color-ink)]">{safePublicLabel(thread.tagLabel)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--color-muted)]">Reason</dt>
              <dd className="mt-1 font-semibold text-[var(--color-ink)]">{reasonLabel(thread.reason)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.04em] text-[var(--color-muted)]">Expires</dt>
              <dd className="mt-1 font-semibold text-[var(--color-ink)]">{thread.expiresAt ? formatConversationDate(thread.expiresAt) : "For safety"}</dd>
            </div>
          </dl>
        ) : null}
      </div>

      <div className="border-b border-[var(--color-border)] bg-[var(--color-primary-soft)] px-4 py-3 text-sm leading-6 text-[var(--color-primary-hover)] sm:px-5">
        <div className="flex items-start gap-3">
          <LockKeyhole aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold text-[var(--color-ink-strong)]">This private conversation is protected by your link.</p>
            <p>The owner&apos;s phone number stays hidden. Conversations expire for safety.</p>
          </div>
        </div>
      </div>

      {unavailable ? (
        <div className="border-b border-[var(--color-border)] bg-[var(--color-warning-bg)] px-4 py-3 text-sm leading-6 text-[var(--color-warning-text)] sm:px-5">
          <div className="flex items-start gap-3">
            <TimerOff aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">{unavailableDetails.title}</p>
              <p>{unavailableDetails.body}</p>
            </div>
          </div>
        </div>
      ) : null}

      {status ? (
        <div className="px-4 pt-4 sm:px-5">
          <InlineAlert tone={statusTone}>{status}</InlineAlert>
        </div>
      ) : null}

      <div className={`min-h-0 flex-1 overflow-y-auto bg-[#fbfcfb] p-4 sm:p-5 ${isRoute ? "space-y-4" : "mt-4 max-h-80 rounded-[var(--radius-card)]"}`}>
        {loading ? (
          <div className="grid gap-3">
            <LoadingState label="Checking private chat access..." />
            <div className="grid gap-3 rounded-[var(--radius-card)] bg-white p-3">
              <div className="h-12 w-3/4 animate-pulse rounded-2xl bg-[var(--color-surface-soft)]" />
              <div className="ml-auto h-12 w-2/3 animate-pulse rounded-2xl bg-[var(--color-primary-soft)]" />
              <div className="h-12 w-1/2 animate-pulse rounded-2xl bg-[var(--color-surface-soft)]" />
            </div>
          </div>
        ) : null}

        {!loading && messages.length === 0 ? (
          <div className="rounded-[var(--radius-card-lg)] border border-dashed border-[var(--color-border)] bg-white p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <MessageSquareText aria-hidden size={24} />
            </span>
            <h3 className="mt-3 text-base font-bold text-[var(--color-ink-strong)]">No replies yet.</h3>
            <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">Keep this page open, or return using the same private link later.</p>
          </div>
        ) : null}

        {messages.map((message) => {
          const isScanner = message.sender === "SCANNER";
          const isOwner = message.sender === "OWNER";
          const isSystem = message.sender === "SYSTEM";

          if (isSystem) {
            return (
              <div key={message.id} className="flex justify-center">
                <div className="max-w-[88%] rounded-full border border-[var(--color-border)] bg-white px-3 py-1.5 text-center text-xs font-semibold text-[var(--color-muted)]">
                  {message.body}
                </div>
              </div>
            );
          }

          return (
            <article key={message.id} className={`flex flex-col ${isScanner ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-[var(--shadow-card)] ${
                  isScanner
                    ? "bg-[var(--color-primary)] text-white"
                    : "border border-[var(--color-border)] bg-[var(--color-surface-soft)] text-[var(--color-ink)]"
                }`}
              >
                <p className={`mb-1 text-xs font-bold uppercase tracking-[0.04em] ${isScanner ? "text-white/78" : "text-[var(--color-muted)]"}`}>
                  {isScanner ? message.senderName || "You" : isOwner ? "Owner" : "System"}
                </p>
                <p className="whitespace-pre-wrap">{message.body}</p>
              </div>
              <span className="mt-1 inline-flex items-center gap-1 px-1 text-xs font-medium text-[var(--color-muted)]">
                <Clock3 aria-hidden size={12} />
                {formatConversationTime(message.createdAt)}
              </span>
            </article>
          );
        })}
      </div>

      <div className="border-t border-[var(--color-border)] bg-white p-4 sm:p-5">
        <label className="sr-only" htmlFor="public-conversation-reply">Reply</label>
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
          <textarea
            id="public-conversation-reply"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={unavailable || loading}
            placeholder={loading ? "Checking private conversation..." : unavailable ? "This conversation is read-only." : "Type a private reply..."}
            className="focus-ring min-h-24 resize-none rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[#f8fbf9] px-3 py-3 text-sm font-normal text-[var(--color-ink)] placeholder:text-[var(--color-muted)] disabled:cursor-not-allowed disabled:bg-[var(--color-page-bg)] sm:min-h-12"
          />
          <Button type="button" className="min-h-12 px-5" onClick={sendMessage} loading={sending} disabled={loading || unavailable || body.trim().length < 1}>
            {sending ? null : <Send aria-hidden size={18} />}
            Send
          </Button>
        </div>
        <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-[var(--color-muted)]">
          {unavailable ? <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success-text)]" />}
          {loading ? "Loading the token-protected conversation before replies are enabled." : unavailable ? "Read-only conversation. The owner's phone number remains hidden." : "Your reply is sent through the token-protected NoNumQR conversation link."}
        </p>
      </div>
    </section>
  );
}
