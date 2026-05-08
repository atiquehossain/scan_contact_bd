"use client";

import { useEffect, useState } from "react";
import { MessageSquareText, QrCode, Send, ShieldCheck } from "lucide-react";
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
  expiresAt?: string | null;
};

export function PublicConversation({
  contactRequestId,
  token,
  scannerName
}: {
  contactRequestId: string;
  token: string;
  scannerName?: string;
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

  return (
    <section className="mt-5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[#f8fbf9] p-4">
      <div className="flex items-start gap-3">
        <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-button)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <QrCode aria-hidden size={22} />
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--color-primary)] text-white ring-2 ring-white">
            <MessageSquareText aria-hidden size={11} />
          </span>
          <span className="absolute -bottom-1 -left-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[var(--color-primary)] ring-1 ring-[var(--color-border)]">
            <ShieldCheck aria-hidden size={11} />
          </span>
        </span>
        <div>
          <h2 className="text-lg font-black">Private QR chat</h2>
          {thread ? <p className="mt-1 text-sm text-[var(--color-muted)]">{safePublicLabel(thread.tagLabel)} | {thread.reason}</p> : null}
          {thread ? (
            <div className="mt-2">
              <StatusBadge tone={thread.status === "OPEN" ? "success" : "warning"}>
                {thread.status === "OPEN" ? "Active private chat" : "Expired"}
              </StatusBadge>
            </div>
          ) : null}
        </div>
      </div>
      <div className="mt-4">
        <InlineAlert tone="info">Phone numbers stay hidden in this ScanContact BD chat unless someone chooses to type them.</InlineAlert>
      </div>
      {unavailable ? (
        <div className="mt-3">
          <InlineAlert tone="warning">This conversation expired. Please scan the QR again to send a new message.</InlineAlert>
        </div>
      ) : null}
      {loading ? (
        <div className="mt-4">
          <LoadingState label="Checking private chat access..." />
        </div>
      ) : null}
      <div className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-[var(--radius-card)] bg-white p-3">
        {!loading && messages.length === 0 ? <p className="text-sm text-[var(--color-muted)]">No replies yet. Keep this page open.</p> : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] rounded-[var(--radius-card)] p-3 text-sm ${
              message.sender === "OWNER" ? "ml-auto bg-[var(--color-primary-soft)]" : "bg-[var(--color-warning-bg)]"
            }`}
          >
            <p className="text-xs font-bold uppercase text-[var(--color-muted)]">{message.sender === "OWNER" ? "Owner" : message.senderName || "You"}</p>
            <p className="mt-1 whitespace-pre-wrap text-[var(--color-ink)]">{message.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-2">
        <label className="grid gap-2 text-sm font-bold" htmlFor="public-conversation-reply">
          Reply
          <textarea
            id="public-conversation-reply"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={unavailable}
            className="focus-ring min-h-24 rounded-[var(--radius-button)] border border-[var(--color-border)] px-3 py-3 font-normal"
          />
        </label>
        <Button onClick={sendMessage} loading={sending} disabled={unavailable || body.trim().length < 1}>
          <Send aria-hidden size={18} />
          Send reply
        </Button>
      </div>
      {status ? (
        <p className="mt-3 text-sm font-bold text-[var(--color-warning-text)]" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}
