"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { apiFetch } from "@/lib/api";

type ChatMessage = {
  id: string;
  sender: "SCANNER" | "OWNER" | "SYSTEM";
  senderName?: string | null;
  body: string;
  createdAt: string;
};

type ContactRequest = {
  id: string;
  reason: string;
  message: string;
  status: string;
  scannerName?: string | null;
  createdAt: string;
  messages?: ChatMessage[];
  qrTag?: { label?: string | null } | null;
};

export function OwnerRequestChat({ request }: { request: ContactRequest }) {
  const [messages, setMessages] = useState<ChatMessage[]>(request.messages || []);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    const data = await apiFetch<{ messages: ChatMessage[] }>(`/contact-requests/${request.id}/messages`);
    setMessages(data.messages);
  }

  useEffect(() => {
    load().catch(() => undefined);
    const timer = window.setInterval(() => load().catch(() => undefined), 5000);
    return () => window.clearInterval(timer);
  }, [request.id]);

  async function sendReply() {
    if (reply.trim().length < 1) return;
    await apiFetch(`/contact-requests/${request.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ body: reply.trim() })
    });
    setReply("");
    setStatus("Reply sent.");
    await load();
  }

  const visibleMessages = messages.length ? messages : [{
    id: `${request.id}-initial`,
    sender: "SCANNER" as const,
    senderName: request.scannerName,
    body: request.message,
    createdAt: request.createdAt
  }];

  return (
    <div className="rounded-md border border-[#dbe7e3] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold">{request.reason} | {request.status}</p>
          {request.qrTag?.label ? <p className="mt-1 text-xs text-[#53635f]">{request.qrTag.label}</p> : null}
        </div>
        <p className="text-xs text-[#53635f]">{new Date(request.createdAt).toLocaleString()}</p>
      </div>

      <div className="mt-3 max-h-80 space-y-2 overflow-y-auto rounded-md bg-[#f6f9f7] p-3">
        {visibleMessages.map((message) => (
          <div key={message.id} className={`rounded-md p-3 text-sm ${message.sender === "OWNER" ? "bg-[#e8f5f2]" : "bg-white"}`}>
            <p className="text-xs font-bold uppercase text-[#53635f]">{message.sender === "OWNER" ? "You" : message.senderName || "Scanner"}</p>
            <p className="mt-1 text-[#20302d]">{message.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2">
        <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Reply privately" className="focus-ring min-h-20 rounded-md border border-[#c9d9d4] px-3 py-3 text-sm" />
        <button onClick={sendReply} className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-trust px-4 py-2 text-sm font-bold text-white">
          <Send size={16} />
          Send reply
        </button>
        {status ? <p className="text-sm font-bold text-signal">{status}</p> : null}
      </div>
    </div>
  );
}
